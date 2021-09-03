# Load the Rails application.
require_relative 'application'

# Initialize the Rails application.
Rails.application.initialize!

ActionMailer::Base.smtp_settings = {
  :user_name => ENV['EMAIL_USERNAME'],
  :password => ENV['EMAIL_PASSWORD'],
  :domain => ENV['HOSTNAME'],
  :address => ENV['EMAIL_SERVER'],
  :port => ENV['EMAIL_PORT'],
  :authentication => :plain,
  :enable_starttls_auto => true
}
