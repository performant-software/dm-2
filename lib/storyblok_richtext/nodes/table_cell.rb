module Storyblok::Richtext
  module Nodes
    class TableCell < Node

      def matching
        @node['type'] === 'table_cell'
      end

      def tag
        if @node['attrs']
          attrs = {}
          attrs['colspan'] = @node['attrs']['colspan'] if @node['attrs']['colspan'] != 1
          attrs['rowspan'] = @node['attrs']['rowspan'] if @node['attrs']['rowspan'] != 1
          attrs['style'] = "background-color: #{@node['attrs']['background']};" if @node['attrs']['background']
          [{
            tag: 'td',
            attrs: attrs,
          }]
        else
          'td'
        end
      end
    end
  end
end
