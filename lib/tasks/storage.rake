require 'active_storage/migration'

namespace :active_storage do

  desc 'Moves the ActiveStorage data from an Amazon S3 bucket to local storage'
  task :aws_to_local => :environment do
    migration = ActiveStorage::Migration.new
    migration.migrate(:amazon, :local)
  end

  desc 'Moves the data from local storage to an Amazon S3 bucket'
  task :local_to_aws => :environment do
    migration = ActiveStorage::Migration.new
    migration.migrate(:local, :amazon)
  end

end