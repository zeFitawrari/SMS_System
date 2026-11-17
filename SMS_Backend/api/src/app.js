import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { validateEnv } from './config/validateEnv.js';
import { globalErrorHandler } from './middlewares/errorMiddleware.js';
import router from './routes/index.js';

validateEnv();

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || true }));
app.use(express.json({ limit: '2mb' }));
app.use(
  morgan(process.env.HTTP_LOG_FORMAT || 'dev', {
    skip: (req) => req.path === '/health',
  })
);

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'smb-api' });
});

/** Hasura action webhooks under /api/v1 — not a public REST API. */
/** Hasura action webhooks at /api/v1/* — clients use GraphQL, not these URLs. */
app.use('/api/v1', router);
app.use(globalErrorHandler);

export default app;
