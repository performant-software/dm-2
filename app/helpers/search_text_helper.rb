module SearchTextHelper
  def self.patch_search_text!
    require 'storyblok/richtext'
    renderer = Storyblok::Richtext::HtmlRenderer.new
    Document.where(:document_kind => 'text').find_each do |text_doc|
      html = renderer.render(text_doc[:content])
      searchable = Nokogiri::HTML(html).xpath('//text()').map(&:text).join(' ')
      text_doc.update!(:search_text => searchable)
    end
  end
end