class HighlightSerializer < ActiveModel::Serializer
  attributes :id, :uid, :target
  has_one :document
  has_many :links_to, serializer: LinkableSerializer
end
