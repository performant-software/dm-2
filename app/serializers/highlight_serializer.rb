class HighlightSerializer < ActiveModel::Serializer
  attributes :id, :uid, :target, :document_id
  has_many :links_to, serializer: LinkableSerializer
end
