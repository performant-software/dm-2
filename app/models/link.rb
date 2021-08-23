class Link < ApplicationRecord
  belongs_to :linkable_a, polymorphic: true, touch: true
  belongs_to :linkable_b, polymorphic: true, touch: true
  has_many :highlights_links, :dependent => :destroy
  has_many :highlights, through: :highlights_links
  has_many :documents_links, :dependent => :destroy
  has_many :documents, through: :documents_links

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

    bum_links.each { |link| 
      link.renumber_all(true)
      link.destroy 
    }
  end

  def renumber_all(remove_self)
    self.highlights_links.each { |hll| 
      if remove_self == true
        siblings = HighlightsLink.where(
          :highlight_id => hll.highlight_id
        ).where.not(
          :link_id => self.id
        ).sort_by(&:position)
      else
        siblings = HighlightsLink.where(:highlight_id => hll.highlight_id).sort_by(&:position)
      end

      # renumber them in a single transaction
      ActiveRecord::Base.transaction do
        i = 0
        siblings.each { |sibling|
          sibling.position = i
          i = i + 1
          sibling.save!
        }
      end
    }
  end

  def renumber(siblings)
    ActiveRecord::Base.transaction do
      i = 0
      siblings.each { |sibling|
        sibling.position = i
        i = i + 1
        sibling.save!
      }
    end
  end

  def move_to(target_position, highlight_id)
    siblings = HighlightsLink.where(:highlight_id => highlight_id).sort_by(&:position)
  
    siblings.each { |sibling|
      if sibling.link_id == self.id
        sibling.position = target_position
      else
        if sibling.position >= target_position
          sibling.position = sibling.position + 1
        end
      end
    }
    renumber(siblings.sort_by(&:position))
  end

end
