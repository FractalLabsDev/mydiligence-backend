# MyDiligence Node.js

MyDiligence backend service written in Node.js (Typescript)

## Local setup

1. Install postgres on local environment and create a new database `mydiligence`

```
brew install postgresql
psql postgres
CREATE DATABASE mydiligence;
```

2. Create `.env` file for configuration with the proper environment values

   ```bash
    PORT=8000
    NODE_ENV=development

    DATABASE_URL=postgres://DB_USER:DB_PASSWORD@DB_HOST:DB_PORT/DB_NAME

    JWT_SECRET=xx
    JWT_EXPIRESIN=xx
    JWT_REFRESH_EXPIRATION=xx

   ```

3. Install required packages and run the dev environment

   ```bash
   yarn global add nodemon
   yarn
   yarn dev
   ```

4. Migrate and seed the data
   ```bash
   yarn db:migrate
   yarn db:seeds:all
   ```

## Heroku deploy

```
// Install the Heroku CLI

heroku login

// Set the server:
heroku git:remote -a mydiligence-backend-dev
heroku git:remote -a mydiligence-backend-stage

git push heroku
```

## Heroku trigger script

```
heroku run yarn script
```

## Heroku database

```
heroku pg:reset DATABASE
heroku run yarn db:unseeds:all
heroku run yarn db:migrate
heroku run yarn db:seeds:all
```

### Create models and migrations:

```
npx sequelize-cli model:generate --name User --attributes username:string,email:string
```
