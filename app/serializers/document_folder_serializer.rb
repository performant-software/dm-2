class DocumentFolderSerializer < ActiveModel::Serializer
  attributes :id, :title, :document_id, :document_title, :document_kind, :excerpt, :color, :thumbnail_url, :descendant_folder_ids, :buoyancy, :parent_id, :parent_type
  has_many :contents_children
end
