class Project < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true
  has_many :documents, as: :parent
  has_many :document_folders, as: :parent
  has_many :user_project_permissions, dependent: :destroy
  has_many :users, through: :user_project_permissions
  
  default_scope { order(updated_at: :desc) }
  scope :is_public, -> { where(public: true) }

  before_destroy :destroyer

  include TreeNode

  def destroyer
    self.contents_children.each { |child|
      child.destroy
    }
  end

  def check_in_all(user)
    checked_in_doc_ids = []
    docs = Document.where(project_id: self.id)
    docs.each { |document|
      if user.id == document.locked_by_id then
        document.locked = false
        document.locked_by_id = nil
        document.save!
        checked_in_doc_ids.push(document.id)
      end
    }
    checked_in_doc_ids
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

  def document_kind
    "Project"
  end

  # one time migration function for 20190124154624_add_document_position
  def self.migrate_to_position_all!
    Project.all.each { |project|
      project.migrate_to_position!
    }
  end

  # one time migration function for 20190124154624_add_document_position
  def migrate_to_position!
    i = 0
    self.contents_children.reverse.each { |child|
      child.position = i
      i = i + 1
      child.save!
    }
    self.document_folders.each { |folder |
      folder.migrate_to_position!
    }
  end
end
