class Link < ApplicationRecord
  belongs_to :linkable_a, polymorphic: true, touch: true
  belongs_to :linkable_b, polymorphic: true, touch: true

  # This script deletes links that have been orphaned from Documents and Highlight targets
  def self.destroy_dead_links!

    # pull down a list of all document and document_folder ids
    doc_ids = Document.all.pluck(:id)
    highlight_ids = Highlight.all.pluck(:id)

    bum_links = []

    # for each link, ensure that the id+type is found
    Link.all.each { |link|
      if link.linkable_a_type == "Document" then
        unless doc_ids.include? link.linkable_a_id
          bum_links.push(link)
          next
        end
      else
        unless highlight_ids.include? link.linkable_a_id
          bum_links.push(link)
          next
        end
      end
      
      if link.linkable_b_type == "Document" then
        unless doc_ids.include? link.linkable_b_id
          bum_links.push(link)
          next
        end
      else
        unless highlight_ids.include? link.linkable_b_id
          bum_links.push(link)
          next
        end
      end    
    }

    bum_links.each { |link| link.destroy }
  end

end
