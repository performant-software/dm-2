class UserAdminSerializer < ActiveModel::Serializer
  attributes :id, :email, :name, :created_at, :approved, :admin
end
