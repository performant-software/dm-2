class Project < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true
  has_many :documents, as: :parent, dependent: :destroy
  has_many :document_folders, as: :parent, dependent: :destroy
  has_many :user_project_permissions
  has_many :users, through: :user_project_permissions

  default_scope { order(updated_at: :desc) }
  scope :is_public, -> { where(public: true) }

  include TreeNode

  def can_read
    self.users.merge(UserProjectPermission.read)
  end

  def is_leaf?
    false
  end

  def can_write
    self.users.merge(UserProjectPermission.write)
  end

  def can_admin
    self.users.merge(UserProjectPermission.admin)
  end

  # one time migration function for 20190124154624_add_document_position
  def migrate_to_position_all!
    Project.all.each { |project|
      project.migrate_to_position!
    }
  end

  # one time migration function for 20190124154624_add_document_position
  def migrate_to_position!
    i = 0
    self.contents_children.each { |child|
      child.position = i
      i = i + 1
      child.save!
    }
    self.document_folders.each { |folder |
      folder.migrate_to_position!
    }
  end

end
