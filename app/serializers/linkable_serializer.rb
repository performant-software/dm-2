class LinkableSerializer < ActiveModel::Serializer
  attributes :id, :document_id, :highlight_id, :document_title, :document_kind, :excerpt, :color
end
