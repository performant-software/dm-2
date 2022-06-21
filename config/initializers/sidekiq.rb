require 'sidekiq'
require 'sidekiq-status'

SIDEKIQ_REDIS_CONFIGURATION = {
  url: ENV[ENV["REDIS_PROVIDER"]].presence || '',
  ssl_params: { verify_mode: OpenSSL::SSL::VERIFY_NONE }, # we must trust Heroku and AWS here
}

Sidekiq.configure_client do |config|
  config.redis = SIDEKIQ_REDIS_CONFIGURATION
  Sidekiq::Status.configure_client_middleware config, expiration: 30.minutes
end

Sidekiq.configure_server do |config|
  config.redis = SIDEKIQ_REDIS_CONFIGURATION
  Sidekiq::Status.configure_server_middleware config, expiration: 30.minutes
  Sidekiq::Status.configure_client_middleware config, expiration: 30.minutes
end