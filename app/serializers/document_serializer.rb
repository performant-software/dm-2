class DocumentSerializer < ActiveModel::Serializer
  attributes :id
  has_one :project
  has_one :created_by
end
