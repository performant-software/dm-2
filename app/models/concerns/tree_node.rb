module TreeNode
    extend ActiveSupport::Concern

    def add_to_tree
        self.move_to( 0 )
    end

    def remove_from_tree
        children = self.parent.contents_children
        ActiveRecord::Base.transaction do    
            i = 0
            children.each { |child|
                unless same_as( self, child )
                    child.position = i
                    i = i + 1
                else
                    child.parent = nil
                end                    
                child.save!
            }
        end    
    end

    def add_subtree( tree )
        project_id = self.document_kind == 'Project' ?  self.id : self.project_id
        document_folder = DocumentFolder.new({
            project_id: project_id,
            title: tree['name'],
            parent_id: self.id,
            parent_type: self.document_kind == 'Project' ? 'Project' : 'DocumentFolder'
        })
        document_folder.save!
        document_folder.move_to( :end, self.id )
        tree['children'].each { |child|
            image_url = child['image_info_uri']
            document = Document.new({
                project_id: project_id,
                title: child['name'],
                document_kind: 'canvas',
                content: {
                    tileSources: [ image_url ]
                }
            })
            document.save!
            document.add_thumbnail( image_url + '/full/!160,160/0/default.png')
            document.move_to( :end, document_folder.id )
        }
    end
  
    def contents_children
        (self.documents + self.document_folders).sort_by(&:position)
    end

    def renumber_children( children=nil )
        children = contents_children if children.nil?
        # renumber them in a single transaction
        ActiveRecord::Base.transaction do    
            i = 0
            children.each { |child|
                child.position = i
                i = i + 1
                child.save!
            }
        end        
    end

    def list_positions
        self.contents_children.map { |child| [child.id, child.position] }
    end

    def same_as(node_a, node_b)
        return true if node_a.nil? && node_b.nil?
        return false if node_a.nil? || node_b.nil?        
        node_a.id == node_b.id && node_a.class.to_s == node_b.class.to_s 
    end

    def get_tree_node_record( record_id, record_type )
        if record_type == "Project" 
            return Project.find(record_id)
        elsif record_type == "DocumentFolder"
            return DocumentFolder.find(record_id)
        elsif record_type == "Document"
            return Document.find(record_id)
        end
    end

    def move_to( target_position, destination_id=nil, destination_type='DocumentFolder' )
        destination = destination_id.nil? ? 
            self.get_tree_node_record(self.parent_id, self.parent_type) : 
            self.get_tree_node_record(destination_id, destination_type)      

        if same_as(self.parent, destination)
            siblings = (destination.documents + destination.document_folders ).sort_by(&:position)
        else
            old_parent = self.parent
            self.parent = destination
            siblings = (destination.documents + destination.document_folders + [self]).sort_by(&:position)
        end

        target_position = siblings.length + 1 if target_position == :end

        # start_state = siblings.map { |child| [child.id, child.position] }
        # logger.info "MOVING #{destination_id} to #{target_position}"
        # logger.info "START STATE: #{start_state}"

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

        # end_state = siblings.map { |child| [child.id, child.position] }
        # logger.info "END STATE: #{end_state}"

        # resort them again
        siblings = siblings.sort_by(&:position)

        # renumber the leafs
        renumber_children(siblings)
        old_parent.renumber_children() unless old_parent.nil?
        
        # end_state = siblings.map { |child| [child.id, child.position] }
        # logger.info "RENUMBERED STATE: #{end_state}"
    end   
end