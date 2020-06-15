require 'active_storage/as_download_patch'

module ActiveStorage
  class Migration

    def initialize
      ActiveStorage::Blob.send(:include, ActiveStorage::AsDownloadPatch)
    end

    def migrate(from, to)
      config_file = Pathname.new(Rails.root.join('config/storage.yml'))
      configs = YAML.load(ERB.new(config_file.read).result) || {}

      from_service = ActiveStorage::Service.configure from, configs
      to_service   = ActiveStorage::Service.configure to, configs

      ActiveStorage::Blob.service = from_service

      puts "Moving #{ActiveStorage::Blob.count} blob(s)..."
      ActiveStorage::Blob.find_each do |blob|
        print '.'
        blob.open do |tf|
          checksum = blob.checksum
          to_service.upload(blob.key, tf, checksum: checksum)
        end
      end
    end

  end
end