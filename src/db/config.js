require('dotenv').config();

const sslOptions =
  process.env.DB_SSL === 'true'
    ? {
        require: true,
        rejectUnauthorized: false,
      }
    : false;

const config = {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  dialectOptions: {
    ssl: sslOptions,
  },
};

module.exports = {
  development: config,
  dev: config,
  stage: config,
  prod: config,
};
