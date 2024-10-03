module DownloadHelper
  def self.download_to_file(uri)
    begin
      stream = URI.open(uri, :read_timeout => 10)
      return stream if stream.respond_to?(:path) # Already file-like
    
      # Workaround when open(uri) doesn't return File
      Tempfile.new.tap do |file|
        file.binmode
        IO.copy_stream(stream, file)
        stream.close
        file.rewind
      end
    rescue Net::ReadTimeout
      return 'failed'
    end
  end
end