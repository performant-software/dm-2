module LinkMigrationHelper
  # Helper function for migrate_link_position!
  def self.create_highlights_link(link_id, highlight_id, i)
    unless HighlightsLink.where(
      :link_id => link_id, 
      :highlight_id => highlight_id
    ).count > 0
      HighlightsLink.create(
        :link_id => link_id, 
        :highlight_id => highlight_id,
        :position => i
      )
    end
  end
  # One time migration function for 20210723160125_add_links_to_highlights.rb
  def self.migrate_link_position!
    TextHighlightHelper.patch_text_highlights!
    TextHighlightHelper.merge_duplicate_highlights!
    Highlight.all.each { |highlight|
      i = 0
      all_links = highlight.a_links + highlight.b_links
      all_links.each {|link|
        create_highlights_link(link[:id], highlight[:id], i)
        i = i + 1
      }
    }
  end

end