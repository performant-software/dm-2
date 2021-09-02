Digital Mappa v2.0 
============================================

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

Digital Mappa v2.0 (DM2 for short) is a freely available online environment for creating projects out of digital images and texts. The premise of DM2 is simple and powerful: if you have a collection of digital images and/or texts, you should be able to produce an online resource that links together specific moments on these images and texts together, annotate these moments as much as you want, collaborate with others on this work, have the content you produce be searchable, and publish this work to others or the public as you wish. And you should be able to do this with little technical expertise.

DM2 was developed under the direction of Martin Foys and his team at the University of Wisconsin-Madison and Dot Porter at the Schoenberg Institute for Manuscript Studies. Funding was provided through a grant from the National Endowment for the Humanities and through funding from UW Madison. Performant Software Solutions LLC (www.performantsoftware.com) performed the software development, with Andy Stuhl and Nick Laiacona being the primary contributors to the 2.0 release. 

DM2 design was inspired by the DM project (https://github.com/performant-software/DM) developed originally at Drew University by Martin Foys and others.

- [Technical overview](#technical-overview)
- [Heroku installation](#heroku-installation)
  * [Create app](#create-app)
  * [Provision resources](#provision-resources)
  * [Configuration variables](#configuration-variables)
  * [Set up database](#set-up-database)
- [Local installation](#local-installation)
  * [With Docker Compose](#with-docker-compose)
    + [Development environment](#development-environment)
    + [Production environment](#production-environment)
  * [With Heroku local development environment](#with-heroku-local-development-environment)
  * [Manually](#manually)
- [Active Storage](#active-storage)

Technical overview
---------------

DM2 is a single page React application backed by a Ruby on Rails server running a Postgres database. It uses ActiveStorage for image uploads and ImageMagick for image processing. It utilizes the SendGrid service for outbound SMTP and Amazon S3 for image storage. It has been developed within the Heroku (heroku.com) environment but has no Heroku specific dependencies. Issues are tracked and releases are issued on the [DM2 GitHub repo](https://github.com/performant-software/dm-2).


Heroku installation
-------------

### Create app

To install DM2 on Heroku, create a new app and point it at this repository, using the following command with the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli):

```sh
heroku create --stack heroku-18
```

If you did not provision your app using the Heroku CLI, you may need to manually switch the stack to `heroku-18`, as this app currently relies on a version of Ruby that may not be supported by the current default stack (`heroku-20` at the time of writing). This can be done with the following command:

```sh
heroku stack:set heroku-18
```

and will be activated at next build. For more information, see [Heroku-18 Stack](https://devcenter.heroku.com/articles/heroku-18-stack) and [Heroku Ruby Support](https://devcenter.heroku.com/articles/ruby-support#ruby-versions).

You will also need to activate both the Ruby and Node.JS buildpacks. This can be done from the Heroku CLI:

```sh
heroku buildpacks:set heroku/ruby
heroku buildpacks:add --index 1 heroku/nodejs
```

### Provision resources

You will need to provision SendGrid and Heroku Postgres using the Heroku Resources section.

You will also need to provision an Amazon S3 bucket to store the uploaded image files and configure access using Amazon IAM. Once a S3 bucket has been created you will need to set Cross-origin resource sharing (CORS) in the permissions tab of the S3 bucket. See https://aws.amazon.com/ for more information.

### Configuration variables

The following config variables should be set for the application:

```
AWS_ACCESS_KEY_ID
AWS_BUCKET
AWS_REGION
AWS_SECRET_ACCESS_KEY
EMAIL_FROM
HOSTNAME
LANG
PROTOCOL
RACK_ENV
RAILS_LOG_TO_STDOUT
RAILS_SERVE_STATIC_FILES
SECRET_KEY_BASE
SENDGRID_PASSWORD
SENDGRID_USERNAME
```

Here are some default settings for provisioning a production server:

```env
LANG=en_US.UTF-8
RACK_ENV=production
RAILS_ENV=production
RAILS_LOG_TO_STDOUT=enabled
RAILS_SERVE_STATIC_FILES=enabled
PROTOCOL=https
```

The `SECRET_KEY_BASE` environment variable is used to encrypt the passwords on your DM2 instance, so it is important to keep it secure and unguessable. Here's a good site for generating a secret key: https://www.grc.com/passwords.htm

Set the `HOSTNAME` and `PROTOCOL` environment variables to the hostname and protocol of your Heroku application. For example, if your application is hosted at `https://my-project.herokuapp.com`, you would set the `HOSTNAME` variable to `my-project.herokuapp.com`, and the `PROTOCOL` variable to `https`.

The `EMAIL_FROM` environment variable is used for sending emails via SendGrid. This should be set to the email address you would like to appear in the "From" field in registration confirmation emails. Additionally, SendGrid has changed their authentication scheme from username/password to API keys. Thus, to set the SendGrid environment variables, you must go to your provisioned SendGrid account from the Heroku dashboard, and find the "Settings" > "API Keys" section of the SendGrid service. Click the "Create API Key" button, copy the created key to the `SENDGRID_PASSWORD` environment variable, and set the `SENDGRID_USERNAME` environment variable to `apikey`.

```env
SENDGRID_USERNAME=apikey
SENDGRID_PASSWORD=SG.abcdefghijklmnopqrstuvwxyz
```

By default, the production environment will use AWS as the Active Storage service. This will require the following environment variables to be set:

```
AWS_ACCESS_KEY_ID
AWS_BUCKET
AWS_REGION
AWS_SECRET_ACCESS_KEY
```

It is possible use local storage, however this is only recommended for testing purposes, as Heroku does not have a persistent file system. This can be done by setting the `ACTIVE_STORAGE_SERVICE` variable to "local".

### Set up database

Once these things are done, migrate the database using the following command:

```
heroku run rails db:migrate
```

DM2 should now be up and running on your Heroku instance! 

The first user account created is automatically given admin powers. Thereafter, that user can grant other users access and privileges using the Admin menu in the top right corner of the interface. 

Local installation
-------------

### With Docker Compose

DM2 can be installed quickly using Docker Compose. The only requirements are [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) themselves.

First, clone the repo from GitHub, `cd` into the repo directory, and copy the sample environment variables into `.env` and `config/application.yml`.

```sh
git clone https://github.com/performant-software/dm-2.git
cd dm-2
cp .env.sample .env
cp config/application.sample.yml config/application.yml
```

Next, there are slightly different instructions depending on whether you intend to run DM2 in a production or development environment.

#### Development environment

Edit the environment variables as necessary. The sample values are all standard for a development environment, except for those left blank: `SECRET_KEY_BASE` should be a secure encryption key, and `SENDGRID_PASSWORD` should be a SendGrid API Key. For more information about these variables, see above section on [configuration variables](#configuration-variables).

Then, use Docker Compose to build the necessary Docker images:
```sh
docker-compose build
```

Run any pending database migrations:
```sh
docker-compose run --rm app rails db:migrate
```

And finally, boot the application:
```sh
docker-compose up
```

If you wish to mount the code directory from your local filesystem onto the Docker container in order to develop on it and use hot-reloading features, you can use the following command:
```sh
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

After boot completes, the app should be up and running on `localhost:3000`.

You may stop the application at any time by opening another shell in the same `dm-2` directory and running:
```sh
docker-compose down
```

#### Production environment

Edit the environment variables as necessary. In addition to those listed for the development environment, it is necessary to uncomment and set the variables listed under "Required for production environments" and "Required for running Docker Compose in a production environment." The following are also required:

```env
RAILS_ENV=production 
RACK_ENV=production
PROTOCOL=https
```

<details>
  <summary>
    Note about HTTPS and production
  </summary>

  As you have set the three above variables to `production` and `https`, the app will be served from port 443 over HTTPS. 

  You will need a valid HTTPS certificate to run the app in production. You may also need to run Nginx with a reverse proxy, etc. to run from a hostname other than localhost. That is outside the scope of this README.

  It is **not recommended** and **not supported**, but if you wish to just get the app up and running quickly over localhost, you may change `/config/environments/production.rb:41` to `config.force_ssl = false`, and set `PROTOCOL` back to `http`. This is not secure, but will allow you to run the app over plain HTTP without a certificate.
</details>

Then, use Docker Compose to build the necessary Docker images:
```sh
docker-compose build
```

Run any pending database migrations using the `docker-compose.prod.yml` overrides:
```sh
docker-compose -f docker-compose.yml -f docker-compose.prod.yml run --rm app rails db:migrate
```

And finally, boot the application in detached mode using the same overrides:
```sh
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

During boot, you may wish to view logs for the application:
```sh
docker-compose logs -f -t
```

After boot completes, the app should be up and running on `localhost:443`.

You may stop the application at any time by opening another shell in the same `dm-2` directory and running:
```sh
docker-compose down
```

### With Heroku local development environment

DM2 is a pretty standard Ruby on Rails 5.x application. It uses a PostgreSQL and has been developed using PostgreSQL v11.1. It was developed using Ruby 2.5.7 and Bundler 2.2.23. Setting up PostgresSQL, Ruby, and Bundler are beyond the scope of this README, but plenty of information is available online about these tools.

Once the dependencies mentioned above are installed, please follow these steps:

1) Clone this repo to your local drive:

```sh
git clone https://github.com/performant-software/dm-2.git
```

2) Run bundler in the base directory to get all the Ruby dependencies:

```sh
bundle 
```

3) Run yarn in the client directory to get all the JS dependencies:

```sh
cd client
yarn
```

4) Create a database for the application. The default database is called "dm2_staging" with no username or password. You can configure this in the config/database.yml file. Once the database is created, run:

```sh
rails db:migrate
```

5) Run the server with the following command:

```sh
heroku local -f Procfile.dev
```

Note that this runs two servers, one on port 3000 for Ruby on Rails and one on 3001 for the Create React App yarn server. This hot reloads any changes made to the Javascript files as you develop.

6) Visit http://localhost:3000 to view the application. 

Please note that the development environment stores files on local disk in the /storage directory by default. You can configure different storage solutions in config/storage.yml. See the Rails ActiveStorage documentation for more details.

### Manually

Installation without Docker or the Heroku toolset is possible but requires setup specific to your environment. Follow the steps given above, except when it comes time to run the application, run the client and the server with these commands:

To run the client:
   
```sh
cd client && PORT=3000 yarn start
```

Then run the server:
   
```sh
PORT=3001 && bundle exec puma -C config/puma.rb
```

Active Storage
-------------

Active storage is used to handle the uploading/downloading of files. Files can either be stored locally on the disk or on a file storage service, such as Amazon S3. For ease of toggling in different environments, the file storage service can be specified as an environment variable in the `application.yml` file.

    ACTIVE_STORAGE_SERVICE: 'local'
    ACTIVE_STORAGE_SERVICE: 'amazon'
    
To convert an existing application to use a different file storage service, a rake task exists to downloading the files from the current storage and upload them to the new storage:

    bundle exec rake active_storage:aws_to_local
    bundle exec rake active_storage:local_to_aws
