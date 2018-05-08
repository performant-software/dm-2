class ProjectSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :public, :created_at, :updated_at

  has_one :owner
  has_many :contents_children
end
