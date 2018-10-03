class Project < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true
  has_many :documents, as: :parent, dependent: :destroy
  has_many :document_folders, as: :parent, dependent: :destroy
  has_many :user_project_permissions
  has_many :users, through: :user_project_permissions

  default_scope { order(updated_at: :desc) }
  scope :is_public, -> { where(public: true) }

  def contents_children
    (self.documents + self.document_folders).sort_by(&:buoyancy).reverse
  end

  def can_read
    self.users.merge(UserProjectPermission.read)
  end

  def can_write
    self.users.merge(UserProjectPermission.write)
  end

  def can_admin
    self.users.merge(UserProjectPermission.admin)
  end
end
