import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { attachSockets } from './sockets/index.js';

const httpServer = http.createServer(app);
attachSockets(httpServer);

httpServer.listen(env.port, () => {
  console.log(`vestIQ backend running on http://localhost:${env.port}`);
});