require 'active_storage/downloader'

module ActiveStorage
  module AsDownloadPatch
    # define a blob.open method
    def open(tempdir: nil, &block)
      ActiveStorage::Downloader.new(self, tempdir: tempdir).download_blob_to_tempfile(&block)
    end
  end
end