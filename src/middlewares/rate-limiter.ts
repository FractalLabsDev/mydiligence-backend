
import { PostgresStore } from "@acpr/rate-limit-postgresql";
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
dotenv.config();

const getStoreConfig = () => {
  const sslEnabled = process.env.DB_SSL === 'true';
  const connectionString = process.env.DATABASE_URL || `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

  return sslEnabled ? {
    connectionString,
    ssl: {
      require: true,
      rejectUnauthorized: false,
    }
  } : { connectionString }
}

export const getLimiter = () => {
  return rateLimit({
    store: new PostgresStore(
      getStoreConfig(),
      'aggregated_store'
    ),
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes).
    message: 'Too many accounts created from this IP, please try again after 15 minutes',
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  });
}