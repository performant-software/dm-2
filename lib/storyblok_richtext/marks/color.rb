module Storyblok::Richtext
  module Marks
    class Color < Mark

      def matching
        @node['type'] === 'color'
      end

      def tag
        attrs = {
          style: "color:#{@node['attrs']['color']};"
        }
        [{
          tag: 'span',
          attrs: attrs
        }]
      end
    end
  end
end
