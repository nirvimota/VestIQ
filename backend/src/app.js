import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json());
app.use(requestLogger);
app.use('/api', apiRateLimiter, routes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;