class ProjectSerializer < ActiveModel::Serializer
  attributes :id, :title, :description, :public, :created_at, :updated_at, :current_user_permissions

  has_many :contents_children, serializer: DocumentFolderSerializer
  has_many :user_project_permissions
  has_many :can_admin

  def current_user_permissions
    {
      :write => current_user && current_user.can_write(object) ? true : false,
      :admin => current_user && current_user.can_admin(object) ? true : false
    }
  end
end
