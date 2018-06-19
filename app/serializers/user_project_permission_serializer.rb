class UserProjectPermissionSerializer < ActiveModel::Serializer
  attributes :id, :permission
  has_one :user
end
