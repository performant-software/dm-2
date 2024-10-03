module Storyblok::Richtext
  module Marks
    class FontFamily < Mark

      def matching
        @node['type'] === 'fontFamily'
      end

      def tag
        attrs = {
          style: "font-family:#{@node['attrs']['fontFamily']};"
        }
        [{
          tag: 'span',
          attrs: attrs
        }]
      end
    end
  end
end
