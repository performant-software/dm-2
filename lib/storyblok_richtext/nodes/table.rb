module Storyblok::Richtext
  module Nodes
    class Table < Node

      def matching
        @node['type'] === 'table'
      end

      def tag
        ['table', 'tbody']
      end
    end
  end
end
