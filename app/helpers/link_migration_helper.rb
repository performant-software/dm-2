module LinkMigrationHelper
  # One time migration function for 20210719143944_add_position_to_links.rb
  def self.migrate_link_position!
    Link.all.each { |link| 
      if link.position == -1 && link.linkable_a_type == "Highlight" then
        links = Link.where(:linkable_a_id => link.linkable_a_id, :linkable_a_type => "Highlight")
        i = 0
        links.each { |matchlink|
          matchlink.update(:position => i)
          i = i + 1
        }
      end
    }
  end
end