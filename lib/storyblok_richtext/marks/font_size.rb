module Storyblok::Richtext
  module Marks
    class FontSize < Mark

      def matching
        @node['type'] === 'fontSize'
      end

      def tag
        attrs = {
          style: "font-size:#{@node['attrs']['fontSize']};"
        }
        [{
          tag: 'span',
          attrs: attrs
        }]
      end
    end
  end
end
