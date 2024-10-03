module Storyblok::Richtext
  module Marks
    class TextStyle < Mark

      def matching
        @node['type'] === 'textStyle'
      end

      def tag
        color = "color:#{@node['attrs']['color']};"
        font_size = "font-size:#{@node['attrs']['fontSize']};"
        font_family = "font-family:#{@node['attrs']['fontFamily']};"
        text_decoration = "text-decoration:#{@node['attrs']['textDecoration']};"
        attrs = {
          style: "#{color} #{font_size} #{font_family} #{text_decoration}"
        }
        [{
          tag: 'span',
          attrs: attrs
        }]
      end
    end
  end
end
