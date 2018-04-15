class DocumentFolderSerializer < ActiveModel::Serializer
  attributes :id, :title
  has_one :created_by
  has_one :parent
end
