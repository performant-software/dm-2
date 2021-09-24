require 'sidekiq'
require 'sidekiq-status'

Sidekiq.configure_client do |config|
  Sidekiq::Status.configure_client_middleware config, expiration: 30.minutes
end

Sidekiq.configure_server do |config|
  Sidekiq::Status.configure_server_middleware config, expiration: 30.minutes
  Sidekiq::Status.configure_client_middleware config, expiration: 30.minutes
end