module TreeNode
    extend ActiveSupport::Concern

    def renumber_tree_nodes( parent )
        index = 0.0
        parent.contents_children.each { |child| 
            child.bouyancy = index
            index = index + 1.0
            child.save    
        }
    end

    def move_to( destination_id, buoyancy )
        old_parent = self.parent
        destination = destination_type.nil? ? self.project : DocumentFolder.find(destination_id)
        self.parent = destination
        self.bouyancy = bouyancy        
        return false unless self.save
        renumber_tree_nodes(old_parent)
        renumber_tree_nodes(destination)
        return true
    end   
end