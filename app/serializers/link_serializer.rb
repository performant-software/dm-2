class LinkSerializer < ActiveModel::Serializer
  attributes :id
  has_one :created_by
  has_one :linkable_a, serializer: LinkableSerializer
  has_one :linkable_b, serializer: LinkableSerializer
end
