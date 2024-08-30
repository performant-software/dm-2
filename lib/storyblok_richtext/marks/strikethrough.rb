module Storyblok::Richtext
  module Marks
    class Strikethrough < Mark

      def matching
        @node['type'] === 'strikethrough'
      end

      def tag
        's'
      end
    end
  end
end
