class DocumentSerializer < ActiveModel::Serializer
  attributes :id, :title, :document_kind
  has_one :project
  has_one :created_by
  has_many :highlights
  has_many :links_to, serializer: LinkableSerializer
end
