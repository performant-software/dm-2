module Storyblok::Richtext
  module Nodes
    class Image < Node

      def matching
        @node['type'] === 'image'
      end

      def single_tag
        attrs = {}
        if !@node['attrs'].nil?
          attrs = @node['attrs'].slice('src', 'alt', 'title')
          attrs['style'] = "width: #{@node['attrs']['width']};"
        end
        return [{
          tag: "img",
          attrs: attrs
        }]
      end
    end
  end
end
