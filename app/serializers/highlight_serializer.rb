class HighlightSerializer < ActiveModel::Serializer
  attributes :id, :uid, :target, :document_id, :document_title, :excerpt, :color, :thumbnail_url, :links_to, :title
end
