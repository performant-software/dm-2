# frozen_string_literal: true

class FixTextstyleMarkTypes < ActiveRecord::Migration[6.1]
  def recursively_fix_marks(node)
    # recursive function to traverse all nodes and replace textStyle marks

    # store default attrs to see if any have been changed (if not, ignore mark)
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
              # replace textStyle mark with relevant independent mark type
              if key == "textDecoration" and attrs[key] == "line-through"
                node["marks"] << { "type" => "strikethrough" }
              elsif key == "textDecoration" and attrs[key] == "underline"
                node["marks"] << { "type" => "underline" }
              else
                # all other mark types are formatted like this, as they are CSS styles
                node["marks"] << { "type" => key, "attrs" => { key => attrs[key] }}
              end
            end
          end
          # delete all textStyle marks
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
