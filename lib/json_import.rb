
class JSONImport

    attr_accessor :unguessable_password, :user_map, :project_map, :document_map, :document_to_project_map

    def initialize
        # TODO randomly generate on each run a strong password
        self.unguessable_password = 'pass12345'
    end

	def load(filepath)
		json_data = self.read_json_file(filepath)
        self.import_users json_data['users']
        self.import_projects json_data['projects']
        self.import_documents json_data['documents']
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
            document = Document.new({
                title: document_obj['name'],
                parent_id: project_id,
                parent_type: 'Project',
                content: document_obj['content'],
                search_text: document_obj['searchText'],
                document_kind: 'text', # or canvas 
                project_id: project_id
            })
            document.save!        
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
