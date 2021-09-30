module SearchTextHelper
  def self.patch_search_text!
    require 'storyblok/richtext'
    renderer = Storyblok::Richtext::HtmlRenderer.new
    Document.where(:document_kind => 'text').find_each(batch_size: 200) do |text_doc|
      html = renderer.render(text_doc[:content])
      searchable = render_to_ascii(Nokogiri::HTML(html))
      text_doc.update!(:search_text => searchable)
    end
  end
  def self.render_to_ascii(node)
    blocks = %w[p div address]
    swaps  = { "br"=>" ", "hr"=>" " }
    dup = node.dup

    # Get rid of superfluous whitespace in the source
    dup.xpath('.//text()').each{ |t| t.content=t.text.gsub(/\s+/,' ') }

    # Swap out the swaps
    dup.css(swaps.keys.join(',')).each{ |n| n.replace( swaps[n.name] ) }

    # Slap a couple newlines after each block level element
    dup.css(blocks.join(',')).each{ |n| n.after(" ") }

    # Return the modified text content
    dup.text
  end
end