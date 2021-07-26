module LinkMigrationHelper
  # One time migration function for 20210723160125_add_links_to_highlights.rb
  def self.migrate_link_position!
    Highlight.all.each { |highlight|
      i = 0
      all_links = highlight.a_links + highlight.b_links
      all_links.each {|link|
        unless HighlightsLink.where(
          :link_id => link[:id], 
          :highlight_id => highlight[:id]
        ).count > 0
          highlight.highlights_links.create(
            :link_id => link[:id], 
            :highlight_id => highlight[:id],
            :position => i
          )
          i = i + 1
        end
      }
    }
  end
end