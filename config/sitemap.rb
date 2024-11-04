SitemapGenerator::Sitemap.default_host = "#{ENV['PROTOCOL'] || 'http'}://#{ENV['HOSTNAME']}"

# Set the sitemap storage details
if ENV.key? 'AWS_ACCESS_KEY_ID'
  SitemapGenerator::Sitemap.sitemaps_path = 'sitemaps/'
  SitemapGenerator::Sitemap.adapter = SitemapGenerator::AwsSdkAdapter.new(ENV['AWS_BUCKET'],
    acl: 'public-read', # Optional. This is the default.
    cache_control: 'private, max-age=0, no-cache', # Optional. This is the default.
    access_key_id: ENV['AWS_ACCESS_KEY_ID'],
    secret_access_key: ENV['AWS_SECRET_ACCESS_KEY'],
    region: ENV['AWS_REGION'],
  )
end

SitemapGenerator::Sitemap.create do
  # Put links creation logic here.
  #
  # The root path '/' and sitemap index file are added automatically for you.
  # Links are added to the Sitemap in the order they are specified.
  #
  # Usage: add(path, options={})
  #        (default options are used if you don't specify)
  #
  # Defaults: :priority => 0.5, :changefreq => 'weekly',
  #           :lastmod => Time.now, :host => default_host
  #
  # Examples:
  #
  # Add '/articles'
  #
  #   add articles_path, :priority => 0.7, :changefreq => 'daily'
  #
  # Add all articles:
  #
  #   Article.find_each do |article|
  #     add article_path(article), :lastmod => article.updated_at
  #   end
  Project.find_each do |project|
    add project_path(project), :lastmod => project.updated_at
  end
  Document.find_each do |document|
    add project_path(document.project, { "document" => document.id }), :lastmod => document.updated_at
  end
end
