class RobotsGenerator
  # http://avandamiri.com/2011/10/11/serving-different-robots-using-rack.html
  def self.call()
    if ENV.key? 'AWS_BUCKET'
      body = "https://#{ENV['AWS_BUCKET']}.s3.#{ENV['AWS_REGION']}.amazonaws.com/sitemaps/sitemap.xml.gz"
    else
      body = "Sitemap: #{ENV['PROTOCOL'] || 'http'}://#{ENV['HOSTNAME']}/sitemap.xml.gz"
    end
    headers = {
      'Content-Type'  => 'text/plain',
    }
    [200, headers, [body]]
  end
end
