class ProjectSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :public, :owner

  has_many :documents
end
