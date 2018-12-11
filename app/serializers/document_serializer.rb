class DocumentSerializer < ActiveModel::Serializer
  attributes :id, :title, :document_kind, :project_id, :locked, :content, :highlight_map, :document_id, :document_title, :thumbnail_url, :image_urls, :image_thumbnail_urls, :parent_id, :parent_type
  has_one :locked_by
  has_many :links_to, serializer: LinkableSerializer
end
