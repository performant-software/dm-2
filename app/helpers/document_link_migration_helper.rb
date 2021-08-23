module  DocumentLinkMigrationHelper
    # Helper function for migrate_document_links!
  def self.create_documents_link(link_id, document_id, i)
    unless DocumentsLink.where(
      :link_id => link_id, 
      :document_id => document_id
    ).count > 0
      DocumentsLink.create(
        :link_id => link_id, 
        :document_id => document_id,
        :position => i
      )
      return true
    end
    return false
  end
  # One time migration function for 20210823142423_add_document_links_table.rb
  def self.migrate_document_links!
    Document.all.each { |document|
      i = 0
      all_links = document.a_links + document.b_links
      sorted_all_links = all_links.sort_by{ |l| l.created_at }.reverse!
      sorted_all_links.each {|link|
        if create_documents_link(link[:id], document[:id], i) == true
          i = i + 1
        end
      }
    }
  end
end
