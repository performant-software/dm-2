module TreeNode
    extend ActiveSupport::Concern

    def contents_children
        return nil if self.is_leaf?
        (self.documents + self.document_folders).sort_by(&:position)
    end

    def list_positions
        self.contents_children.map { |child| [child.id, child.position] }
    end

    def same_as(node_a, node_b)
        node_a.id == node_b.id && node_a.class.to_s == node_b.class.to_s 
    end

    def move_to( destination_id, target_position )
        destination = destination_id.nil? ? self.project : DocumentFolder.find(destination_id)        
        return false if destination.nil? 
        
        if same_as(self.parent, destination)
            siblings = (destination.documents + destination.document_folders ).sort_by(&:position)
        else
            self.parent = destination
            siblings = (destination.documents + destination.document_folders + [self]).sort_by(&:position)
        end

        start_state = siblings.map { |child| [child.id, child.position] }
        logger.info "MOVING #{destination_id} to #{target_position}"
        logger.info "START STATE: #{start_state}"

        # move to right spot, note this is only saved when transaction suceeds
        siblings.each { |sibling|
            if same_as(sibling,self) 
                sibling.position = target_position
            else
                if sibling.position >= target_position
                    sibling.position = sibling.position + 1
                end
            end
        }

        end_state = siblings.map { |child| [child.id, child.position] }
        logger.info "END STATE: #{end_state}"

        # resort them again
        siblings = siblings.sort_by(&:position)

        # now renumber them in a single transaction
        ActiveRecord::Base.transaction do    
            i = 0
            siblings.each { |sibling|
                sibling.position = i
                i = i + 1
                sibling.save!
            }
        end
        
        end_state = siblings.map { |child| [child.id, child.position] }
        logger.info "RENUMBERED STATE: #{end_state}"
    end   
end