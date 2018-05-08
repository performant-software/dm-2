class DocumentSerializer < ActiveModel::Serializer
  attributes :id, :title, :document_kind, :project_id, :content, :highlight_map
  has_one :created_by
  # has_many :highlights
  has_many :links_to, serializer: LinkableSerializer
end
