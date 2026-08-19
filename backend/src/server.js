import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { startNewsCron } from './newsCron.js';
import { attachSockets } from './sockets/index.js';
import { startOrderMatchingScheduler } from './jobs/orderMatchingJob.js';

const httpServer = http.createServer(app);
attachSockets(httpServer);
startNewsCron(io);

httpServer.listen(env.port, () => {
  console.log(`vestIQ backend running on http://localhost:${env.port}`);
  startOrderMatchingScheduler(5000);
});