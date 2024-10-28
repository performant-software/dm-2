module Storyblok::Richtext
  module Marks
    class Em < Mark
      def matching
        @node['type'] === 'em'
      end

      def tag
        'em'
      end
    end
  end
end
