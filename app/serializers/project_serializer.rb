class ProjectSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :public, :owner
end
