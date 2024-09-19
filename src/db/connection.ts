import * as pg from 'pg';
import { Options, Sequelize } from 'sequelize';
import User from './models/user.model';

// Load environment variables from .env file if not in production
if (process.env.NODE_ENV === 'local') {
  require('dotenv').config();
}

const sslEnabled = process.env.DB_SSL === 'true';

const config: Options = {
  dialect: 'postgres',
  dialectOptions: sslEnabled ? {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  } : {},
  logging: false,
  define: {
    timestamps: true,
    paranoid: true,
  },
};

const connectionString = process.env.DATABASE_URL || `postgres://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const sequelize = new Sequelize(connectionString, config);

// Load models
const models = [User];
models.forEach((model) => model.init(model.attributes, {
  sequelize,
  paranoid: true,
}));

// convert string numbers to number (SUM, COUNT, etc)
pg.defaults.parseInt8 = true;

sequelize.sync()
  .then(() => {
    console.log('💾 Database synchronized successfully.');
  })
  .catch((error) => {
    console.error('❌ Error synchronizing the database:', error);
  });

export default sequelize;
