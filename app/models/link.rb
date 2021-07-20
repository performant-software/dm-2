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

    bum_links.each { |link| 
      link.renumber_all(true)
      link.destroy 
    }
  end

  def renumber_all(remove_self)
    if remove_self == true
      siblings = Link.where.not(:id => self.id).where(
        :linkable_a_id => self.linkable_a_id,
        :linkable_a_type => "Highlight"
      ).sort_by(&:position)
    else
      siblings = Link.where(
        :linkable_a_id => self.linkable_a_id,
        :linkable_a_type => "Highlight"
      ).sort_by(&:position)
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
  end

  def move_to(target_position)
    unless target_position == self.position || (self.position != -1 && target_position == self.position + 1)
      siblings = Link.where(
        :linkable_a_id => self.linkable_a_id,
        :linkable_a_type => "Highlight"
      ).sort_by(&:position)

      if target_position > self.position
        target_position = target_position - 1
      end
      if target_position >= siblings.count
        target_position = siblings.count-1
      elsif target_position < 0
        target_position = 0
      end
      
      siblings.each { |sibling|
        if sibling.id != self.id
          if self.position == -1
            sibling.position = sibling.position + 1
          elsif sibling.position >= target_position && sibling.position < self.position
            sibling.position = sibling.position + 1
          elsif sibling.position <= target_position && sibling.position > self.position
            sibling.position = sibling.position - 1
          end
          sibling.save!
        end
      }
      self.position = target_position
      self.save!
      self.renumber_all(false)
    end
  end

end
