import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import supabase from './config/supabase.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

app.use(helmet());

// Support comma-separated origins e.g. "https://vestiq.vercel.app,https://vestiq-abc.vercel.app"
const allowedOrigins = env.clientOrigin
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(requestLogger);
app.use('/api', apiRateLimiter, routes);

app.get('/health', async (req, res) => {
  let dbOk = false;
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (!error) dbOk = true;
  } catch (err) {
    dbOk = false;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: dbOk ? 'healthy' : 'degraded',
      marketData: env.twelveDataApiKey ? 'configured' : 'unconfigured',
      aiEngine: env.grokApiKey ? 'configured' : 'unconfigured',
    },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;