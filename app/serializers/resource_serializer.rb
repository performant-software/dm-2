class ResourceSerializer < ActiveModel::Serializer
  attributes :id, :title, :resource_type, :content
  has_one :project
  has_one :created_by
end
