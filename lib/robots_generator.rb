class RobotsGenerator
  # http://avandamiri.com/2011/10/11/serving-different-robots-using-rack.html
  def self.call(env)
    body = "Sitemap: #{ENV['PROTOCOL'] || 'http'}://#{ENV['HOSTNAME']}/sitemap.xml.gz"
    headers = {
      'Content-Type'  => 'text/plain',
    }
    [200, headers, [body]]
  end
end
