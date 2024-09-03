module Storyblok::Richtext
  module Marks
    class Highlight < Mark

      def matching
        @node['type'] === 'highlight'
      end

      def tag
        highlight_uid = @node['attrs']['highlightUid']
        classname = "dm-highlight #{highlight_uid}"
        [{
          tag: 'a',
          attrs: {
            class: classname,
            href: "##{highlight_uid}",
          }
        }]
      end
    end
  end
end
