Digital Mappa v2.0 
============================================

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

Digital Mappa v2.0 (DM2 for short) is a freely available online environment for creating projects out of digital images and texts. The premise of DM2 is simple and powerful: if you have a collection of digital images and/or texts, you should be able to produce an online resource that links together specific moments on these images and texts together, annotate these moments as much as you want, collaborate with others on this work, have the content you produce be searchable, and publish this work to others or the public as you wish. And you should be able to do this with little technical expertise.

DM2 was developed under the direction of Martin Foys and his team at the University of Wisconsin-Madison and Dot Porter at the Schoenberg Institute for Manuscript Studies. Funding was provided through a grant from the National Endowment for the Humanities and through funding from UW Madison. Performant Software Solutions LLC (www.performantsoftware.com) performed the software development, with Andy Stuhl and Nick Laiacona being the primary contributors to the 2.0 release. 

DM2 design was inspired by the DM project (https://github.com/performant-software/DM) developed originally at Drew University by Martin Foys and others.


Technical Overview
---------------

DM2 is a single page React application backed by a Ruby on Rails server running a Postgres database. It uses ActiveStorage for image uploads and ImageMagick for image processing. It utilizes the SendGrid service for outbound SMTP and Amazon S3 for image storage. It has been developed within the Heroku (heroku.com) environment but has no Heroku specific dependencies. Issues are tracked and relases are issued on the GitHub repo at https://github.com/performant-software/dm-2 . 


Heroku Installation
-------------

To install DM2 on Heroku, create a new app and point it at this respository. You will need to provision SendGrid and Heroku PostGres. The following config variables should be set for the application:

* AWS_ACCESS_KEY_ID
* AWS_BUCKET
* AWS_REGION
* AWS_SECRET_ACCESS_KEY
* HOSTNAME
* LANG
* RACK_ENV
* RAILS_LOG_TO_STDOUT
* RAILS_SERVE_STATIC_FILES
* SENDGRID_PASSWORD
* SENDGRID_USERNAME

You will also need to provision an Amazon S3 bucket to store the uploaded image files and configure access using Amazon IAM. See aws.amazon.com for more information.

Here are some default settings for provisioning a production server:
* LANG=en_US.UTF-8
* RACK_ENV=production
* RAILS_ENV=production
* RAILS_LOG_TO_STDOUT=enabled
* RAILS_SERVE_STATIC_FILES=enabled
* SECRET_KEY_BASE: this variable is used to encrypt the passwords on your DM2 instance, so it is important to keep it secure and unguessable. Here's a good site for generating a secret key: https://www.grc.com/passwords.htm

Once these things are done, migrate the database using the following command:

    heroku run rake db:migrate


DM2 should now be up and running on your Heroku instance! 

The first user account created is automatically given admin powers. Thereafter, that user can grant other users access and privledges using the Admin menu in the top right corner of the interface. 


Heroku Local Development Environment 
-------------

DM2 is a pretty standard Ruby on Rails 5.x application. It uses a PostgreSQL and has been developed using PostgreSQL v11.1. It was developed using Ruby 2.5.1 and Bundler 1.16.5. Setting up PostgresSQL, Ruby, and Bundler are beyond the scope of this README, but plenty of information is available online about these tools.

Once the dependencies mentioned above are installed, please follow these steps:

1) Clone this repo to your local drive:

git clone https://github.com/performant-software/dm-2.git

2) Run bundler in the base directory to get all the Ruby dependencies:

bundle 

3) Run yarn in the client directory to get all the JS dependencies:

cd client
yarn

4) Create a database for the application. The default database is called "dm2_staging" with no username or password. You can configure this in the config/database.yml file. Once the database is created, run:

rake db:migrate

5) Run the server with the following command:

heroku local -f Procfile.dev

Note that this runs two servers, one on port 3000 for Ruby on Rails and one on 3001 for the Create React App yarn server. This hot reloads any changes made to the Javascript files as you develop.

6) Visit http://localhost:3000 to view the application. 

Please note that the development environment stores files on local disk in the /storage directory by default. You can configure different storage solutions in config/storage.yml. See the Rails ActiveStorage documentation for more details.

Heroku Production Environment 
-------------
Start by adding a remote repository for your Heroku application and deploying your code.
```
heroku git:remote -a <app-name>
git push heroku master
```

#### Configure Heroku buildpacks
The activestorage-preview buildpack will install Image Magick and FFMPEG to allow transformation of images and videos.
```
heroku/ruby
heroku/nodejs
https://github.com/heroku/heroku-buildpack-activestorage-preview
```

#### Set environment variables
Set the `HOSTNAME` environment variable to the host of your Heroku application. For example, if you're application is hosted at https://my-project.herokuapp.com, you would set the `HOSTNAME` variable to "my-project.herokuapp.com".

By default, the production environment will use AWS as the Active Storage service. This will require the following environment variables to be set:

```
AWS_ACCESS_KEY_ID
AWS_BUCKET
AWS_REGION
AWS_SECRET_ACCESS_KEY
```

It is possible use local storage, however this is only recommended for testing purposes, as Heroku does not have a persistant file system. This can be done by setting the `ACTIVE_STORAGE_SERVICE` variable to "local".

#### Run migrations
To setup the initial database run migrations.

```
heroku run bundle exec rake db:migrate
```

#### Create admin user account
Using the Rails console, create an admin user. The admin user account can be used to create accounts for actual users, then removed.

```ruby
User.create!(email: 'admin@example.com', password: '<my-password>', password_confirmation: '<my-password>', admin: true)
```

Installation without Heroku Toolset
-------------

Installation without the Heroku tool set is possible but requires setup specific to your enviroment. Follow the steps given above, except when it comes time to run the application, run the client and the server with these commands:

   To run the client:
    
    cd client && PORT=3000 yarn start

   The run the server:
   
    PORT=3001 && bundle exec puma -C config/puma.rb


Active Storage
-------------

Active storage is used to handle the uploading/downloading of files. Files can either be stored locally on the disk or on a file storage service, such as Amazon S3. For ease of toggling in different environments, the file storage service can be specified as an environment variable in the `application.yml` file.

    ACTIVE_STORAGE_SERVICE: 'local'
    ACTIVE_STORAGE_SERVICE: 'amazon'
    
To convert an existing application to use a different file storage service, a rake task exists to downloading the files from the current storage and upload them to the new storage:

    bundle exec rake active_storage:aws_to_local
    bundle exec rake active_storage:local_to_aws