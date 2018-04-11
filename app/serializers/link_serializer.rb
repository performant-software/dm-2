class LinkSerializer < ActiveModel::Serializer
  attributes :id, :linkable_a
  has_one :created_by
  has_one :linkable_b
end
