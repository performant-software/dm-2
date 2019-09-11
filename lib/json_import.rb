
class JSONImport

    attr_accessor :unguessable_password, :user_map, :project_map, :document_map, :highlight_map, :image_files, :document_to_project_map

    def initialize
        # TODO randomly generate on each run a strong password
        self.unguessable_password = 'pass12345'
    end

	def load(filepath,image_path)
        json_data = self.read_json_file(filepath)
        self.import_users json_data['users']
        self.import_projects json_data['projects']
        self.import_images json_data['images']
        self.import_documents( json_data['documents'], image_path )
        self.import_highlights( json_data['highlights'], image_path )
        self.import_links json_data['links']
    end

    def import_users(user_data)
        self.user_map = {}
        user_data.each { |user_obj| 
            # look the user up by email
            user = User.find_by(email: user_obj['email'])
            if user.nil?
                user = User.new
                user.name = user_obj['name']
                user.email = user_obj['email']
                user.password = self.unguessable_password
                user.approved = false
                user.save!                
            end

            self.user_map[user_obj['uri']] = user.id
        }
    end

    def import_projects(project_data)
        self.project_map = {}
        project_data.each { |project_obj|
            user_id = self.user_map[project_obj['userURI']] || 1  # assign to admin if no user record
            project = Project.new( {
                title: project_obj['name'],
                description: project_obj['description'],
                owner_id: user_id
            })
            project.save!
            self.project_map[project_obj['uri']] = project.id
            permission = UserProjectPermission.new( {
                user_id: user_id,
                project_id: project.id,
                permission: 'admin'
            })
            permission.save!
        }
    end

    def import_documents(document_data, images_path)
        self.document_map = {}
        document_bridge = []
        document_data.each { |document_obj|
            begin
                project_id = self.project_map[document_obj['projectURI']]
                document_kind = document_obj['documentKind']

                # temporarily have all docs in root project folder when created
                document = Document.new({
                    title: document_obj['name'],
                    content: document_obj['content'].blank? ? '' : JSON.parse(document_obj['content']),
                    search_text: document_obj['searchText'],
                    document_kind: document_kind,
                    project_id: project_id
                })
                # import mode bypasses placing doc in tree for efficiency
                document.import_mode = true  
                document.save!        
                document_map[document_obj['uri']] = document.id

                if document_kind == 'canvas'
                    document_obj['images'].each { |image_uri|
                        image_filename = self.image_files[image_uri]
                        image_path = "#{images_path}/#{image_filename}"
                        if File.exist?(image_path)
                            document.images.attach(io: open(image_path), filename: image_filename)
                            document.content = {
                                tileSources: [ {
                                    url: url_for(document.images.first),
                                    type: "image"
                                }]
                            }
                            
                            thumb_file = ImageProcessing::MiniMagick.source(image_path) #url_for(document.images.first))
                            .resize_to_fill(80, 80)
                            .convert('png')
                            .call
                            document.thumbnail.attach(io: thumb_file, filename: "thumbnail-for-document-#{document.id}.png")
                            document.save!
                        else
                            Rails.logger.info( "Image file not found: #{image_path}")
                        end
                    }
                end
                document_bridge.push( { doc: document.id, obj: document_obj })
            rescue Exception => e 
                # log error and continue
                Rails.logger.info( "Unable to load document with URI: #{document_obj['uri']} Reason: #{e}")
            end
        }

        # now that everything has ids, move docs to the correct place in the tree
        document_bridge.each { |bridge|
            document = Document.find(bridge[:doc])
            document_obj = bridge[:obj]            
            if document_obj['parentType'] != 'Project'
                document.parent_type = 'Document'
                document.parent_id = self.document_map[document_obj['parentURI']]
                if document.parent_id.nil?
                    Rails.logger.info("Unable to find parent doc: #{document_obj['parentURI']} for document #{document.id}")
                    document.parent_type = 'Project'
                    document.parent_id = document.project_id                     
                end
                document.save!
                document.move_to( :end )    
            else
                document.parent_type = 'Project'
                document.parent_id = self.project_map[document_obj['parentURI']]
                document.save!
                document.move_to( :end )
            end
        }
    end

    def import_images( image_data )
        self.image_files = {}
        image_data.each { |image_obj|
            self.image_files[ image_obj['uri'] ] = image_obj['imageFilename']
        }
    end


    def import_highlights( highlight_data, images_path )
        self.highlight_map = {}
        highlight_data.each { |highlight_obj|
            document_id = self.document_map[highlight_obj['documentURI']]
            unless document_id.nil?
                target = highlight_obj['target']
                highlight = Highlight.new({
                    excerpt: highlight_obj['excerpt'],
                    color: highlight_obj['color'],
                    target: target, 
                    uid: highlight_obj['uri'],
                    document_id: document_id
                })
                highlight.save!

                # create a thumbnail for this highlight if it is in SVG
                if highlight_obj['svg'] 
                    begin
                        image_filename = self.image_files[ highlight_obj['imageURI'] ]
                        if image_filename != nil
                            image_path = "#{images_path}/#{image_filename}"
                            highlight.set_thumbnail( image_path, highlight_obj['thumbnailRect'] )    
                        end    
                    rescue Exception => e 
                        # log error and continue
                        Rails.logger.info( "Unable to create thumbnail with URI: #{highlight_obj['imageURI']} Reason: #{e}")
                    end        
                end

                self.highlight_map[highlight_obj['uri']] = highlight.id
            end
        }
    end

    def import_links( link_data )
        link_data.each { |link_obj|
            link_a_id = link_obj['linkTypeA'] == 'Highlight' ? 
                self.highlight_map[ link_obj['linkUriA'] ] : 
                self.document_map[ link_obj['linkUriA'] ]
                
            link_b_id = link_obj['linkTypeB'] == 'Highlight' ? 
                self.highlight_map[ link_obj['linkUriB'] ] : 
                self.document_map[ link_obj['linkUriB'] ]
            
            if link_a_id && link_b_id
                link = Link.new({
                    linkable_a_id: link_a_id,
                    linkable_a_type: link_obj['linkTypeA'],
                    linkable_b_id: link_b_id,
                    linkable_b_type:link_obj['linkTypeB']
                })
                link.save!
            end
        }    
    end


	def read_json_file( url )
        JSON.parse open(url).read
	end

end
