
class JSONImport

    attr_accessor :unguessable_password, :user_map, :project_map, :document_map, :highlight_map, :image_files, :document_to_project_map

    def initialize
        # TODO randomly generate on each run a strong password
        self.unguessable_password = 'pass12345'
    end

	def load(filepath)
		json_data = self.read_json_file(filepath)
        self.import_users json_data['users']
        self.import_projects json_data['projects']
        self.import_images json_data['images']
        self.import_documents json_data['documents']
        self.import_highlights json_data['highlights']
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
                user.save!                
            end

            self.user_map[user_obj['uri']] = user.id
        }
    end

    def import_projects(project_data)
        self.project_map = {}
        self.document_to_project_map = {}
        project_data.each { |project_obj|
            user_id = self.user_map[project_obj['userURI']]
            project = Project.new( {
                title: project_obj['name'],
                description: project_obj['description'],
                owner_id: user_id
            })
            project.save!
            self.project_map[project_obj['uri']] = project.id
            # map all the document uris to this project id
            project_obj['documents'].each { |document_uri|
                self.document_to_project_map[document_uri] = project.id            
            }
        }
    end

    def import_documents(document_data)
        self.document_map = {}
        document_data.each { |document_obj|
            project_id = self.document_to_project_map[document_obj['uri']]
            document_kind = document_obj['documentKind']

            document = Document.new({
                title: document_obj['name'],
                parent_id: project_id,
                parent_type: 'Project',
                content: document_obj['content'],
                search_text: document_obj['searchText'],
                document_kind: document_kind,
                project_id: project_id
            })
            document.save!        
            document_map[document_obj['uri']] = document.id

            if document_kind == 'canvas'
                document_obj['images'].each { |image_uri|
                    image_filename = self.image_files[image_uri]
                    image_path = "ttl/images/#{image_filename}"
                    document.images.attach(io: File.open(image_path), filename: image_filename)
                    image_content = {
                        tileSources: [ {
                            url: url_for(document.images.first),
                            type: "image"
                        }]
                    }
                    document.content = image_content
                    document.save!
                }
            end
        }
    end

    def import_images( image_data ) 
        self.image_files = {}
        image_data.each { |image_obj|
            self.image_files[ image_obj['uri'] ] = image_obj['imageFilename']
        }
    end

    def import_highlights( highlight_data )
        self.highlight_map = {}
        highlight_data.each { |highlight_obj|
            document_id = self.document_map[highlight_obj['documentURI']]
            highlight = Highlight.new({
                excerpt: highlight_obj['excerpt'],
                color: highlight_obj['color'],
                target: highlight_obj['target'],
                uid: highlight_obj['uri'],
                document_id: document_id
            })
            highlight.save!
            self.highlight_map[highlight_obj['uri']] = highlight.id
        }
    end

    def import_links( link_data )
        link_data.each { |link_obj|
            # DEBUG
            link_a_id = self.document_map[ link_obj['linkUriA'] ]
            link_b_id = self.document_map[ link_obj['linkUriB'] ]
            # Rails.logger.info  "Highlight lookup document id #{link_obj} from uri #{highlight_obj['documentURI']} in highlight #{highlight_obj['uri']}"
            link = Link.new({
                linkable_a_id: link_a_id,
                linkable_a_type: link_obj['linkTypeA'],
                linkable_b_id: link_b_id,
                linkable_b_type:link_obj['linkTypeB']
            })
            link.save!
        }    
    end


	def read_json_file( filepath )
		buf = []
		File.open(filepath, "r") do |f|
		  f.each_line do |line|
		    buf.push line
		  end
		end

		json_string = buf.join
		JSON.parse(json_string)
	end

end
