class DocumentSerializer < ActiveModel::Serializer
  attributes :id, :title, :document_kind, :project_id, :locked, :locked_by_user_name, :locked_by_me, :content, :highlight_map, :document_id, :document_title, :thumbnail_url, :image_urls, :image_thumbnail_urls, :parent_id, :parent_type
  has_many :links_to, serializer: LinkableSerializer

  def locked_by_user_name
    return nil if object.locked_by.nil?
    object.locked_by.name
  end

  def locked_by_me
    return false if object.locked_by.nil?
    !current_user.nil? && !object.locked_by.nil? && object.locked_by.id == current_user.id
  end
end
