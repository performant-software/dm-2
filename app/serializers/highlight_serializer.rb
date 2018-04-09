class HighlightSerializer < ActiveModel::Serializer
  attributes :id, :uid, :target
  has_one :resource
end
