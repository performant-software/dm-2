source 'https://rubygems.org'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end

ruby '3.3.2'

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '~> 6.1'
# Use postgresql as the database for Active Record
gem 'pg', '>= 0.18', '< 2.0'
# Use Puma as the app server
gem 'puma', '~> 4.3'
gem 'foreman'

gem 'devise', '~> 4.7.1'

# needed for nokogiri
gem 'pkg-config', '~> 1.1'

gem 'devise_token_auth', '~> 1.1.5'
gem 'active_model_serializers'
gem 'bootsnap', '~> 1.7.7', require: false
gem 'image_processing', '~> 1.12'
gem 'aws-sdk-s3', '~> 1.48.0'
gem 'rack-cors', :require => 'rack/cors'
gem 'pg_search'
gem 'figaro'
gem 'open-uri'
gem 'storyblok-richtext-renderer', github: 'performant-software/storyblok-ruby-richtext-renderer', ref: 'bef6903146426e01175887eb92a75bf9bac4c3cb'
gem 'sidekiq', '~>6.5.1'
gem 'sidekiq-status', '~>2.1.1'

group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
end

group :development do
  gem 'listen', '>= 3.3.0', '< 4.0'
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
  gem 'spring-watcher-listen', '~> 2.0.0'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]

gem 'webrick', '~> 1.8'
gem 'base64', '~> 0.2.0'
gem 'mutex_m', '~> 0.2.0'
gem 'bigdecimal', '~> 3.1'
gem 'psych', '< 4'
gem 'dotenv-rails', '~> 2.8'
# pinned to < 9.3 until https://github.com/ilyakatz/data-migrate/issues/302 resolved
gem 'data_migrate', '~> 9.2', '< 9.3'
gem 'rubyzip', '~> 2.3'
gem 'table_saw'
gem 'sitemap_generator'
