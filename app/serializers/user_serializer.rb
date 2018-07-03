class UserSerializer < ActiveModel::Serializer
  attributes :id, :name, :user_email

  def user_email
    if current_user && current_user.admin?
      return object.email
    end
    ''
  end
end
