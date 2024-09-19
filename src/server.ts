import dotenv from 'dotenv';
dotenv.config();

import * as Sentry from "@sentry/node";
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import 'reflect-metadata';
import './config/sentry';
import sequelize from './db/connection';

// ROUTES
import errorHandler from './lib/error-handler';
import { getLimiter } from './middlewares/rate-limiter';
import routes from './routes';

const app = express();
const port = process.env.PORT || '8000';
const server = createServer(app);

// Apply rate limiting middleware to all incoming requests to prevent abuse and ensure fair usage
app.use(getLimiter())

// ENABLE CORS. FOR CROSS ORIGIN RESOURCE SHARING
app.use(cors());
app.options('*', cors());

// body-parser configuration for reading data from request body
app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 500000 })); // x-www-form-urlencoded

// Set up routes
app.use('/api/v1', routes);

// Error Handler
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

if (process.env.MODE !== "Unit-Test") {
  const appServer = server.listen(parseInt(port), () => {
    console.log(`👌 Server is running on port ${port}`);
  });

  function shutDown() {
    appServer.close(async () => {
      console.log('🛑 App server shutting down');
    });
  }

  process.on('SIGTERM', shutDown);
  process.on('SIGINT', shutDown);
}

export const handles = {
  appServer: app,
  sequelize
}

export default app;
