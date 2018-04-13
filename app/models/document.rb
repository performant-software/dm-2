class Document < Linkable
  belongs_to :project
  belongs_to :created_by, class_name: 'User', optional: true
end
