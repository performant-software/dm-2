# frozen_string_literal: true

class FixTextstyleMarkTypes < ActiveRecord::Migration[6.1]
  def recursively_fix_marks(node)
    default_textstyle_attrs = {
      "color"=>"black",
      "fontSize"=>"12pt",
      "fontFamily"=>"sans-serif",
      "textDecoration"=>"none"
    }
    if node.key? "marks"
      node["marks"].delete_if do |mark|
        if mark["type"] == "textStyle"
          attrs = mark["attrs"]
          for key, value in default_textstyle_attrs
            if attrs.key? key and attrs[key] != value
              if key == "textDecoration" and attrs[key] == "line-through"
                node["marks"] << { "type" => "strikethrough" }
              elsif key == "textDecoration" and attrs[key] == "underline"
                node["marks"] << { "type" => "underline" }
              else
                node["marks"] << { "type" => key, "attrs" => { key => attrs[key] }}
              end
            end
          end
          true
        end
      end
    end
    if node.key? "content"
      node["content"].each do |inner_node|
        recursively_fix_marks(inner_node)
      end
    end
    node
  end

  def up
    Document.where(:document_kind => "text").find_each do |doc|
      content = doc[:content]
      if content.key? "content"
        content["content"].each do |node|
          node = recursively_fix_marks(node)
        end
        doc.save!
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
