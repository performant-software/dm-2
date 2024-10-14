module Storyblok::Richtext
  module Nodes
    class TableRow < Node

      def matching
        @node['type'] === 'table_row'
      end

      def tag
        'tr'
      end
    end
  end
end
