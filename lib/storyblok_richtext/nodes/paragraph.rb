module Storyblok::Richtext
  module Nodes
    class Paragraph < Node

      def matching
        @node['type'] === 'paragraph'
      end

      def tag
        if @node['attrs']
          text_indent = @node['attrs']['indented'] ? '3rem' : '0'
          text_indent = "text-indent: #{text_indent};"
          margin_left = "margin-left: #{(@node['attrs']['indentLevel'] || 0) * 48}px;"
          line_height = "line-height: #{@node['attrs']['lineHeight']};"
          attrs = {
            style: "#{text_indent} #{margin_left} #{line_height}"
          }
          [{
            tag: 'p',
            attrs: attrs,
          }]
        else
          'p'
        end
      end
    end
  end
end
