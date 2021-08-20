class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable,
         :confirmable
  include DeviseTokenAuth::Concerns::User

  has_many :user_project_permissions, dependent: :destroy
  has_many :projects, through: :user_project_permissions

  scope :is_approved, -> { where(approved: true) }
  scope :is_admin, -> { where(admin: true) }

  after_create :after_user_create
  before_destroy :unlock_documents

  def after_user_create
    if User.count == 1
      User.first.update({admin: true, approved: true})
    end
    AdminMailer.new_user_waiting_for_approval(self.email).deliver
  end

  def inactive_message
    if !approved?
      :not_approved
    else
      super
    end
  end

  def readable_projects
    self.projects.merge(UserProjectPermission.read)
  end

  def writable_projects
    self.projects.merge(UserProjectPermission.write)
  end

  def adminable_projects
    self.projects.merge(UserProjectPermission.admin)
  end

  def can_read(project)
    project.public? || self.admin? || self.readable_projects.include?(project)
  end

  def can_write(project)
    self.admin? || self.writable_projects.include?(project)
  end

  def can_admin(project)
    self.admin? || self.adminable_projects.include?(project)
  end

  def unlock_documents
    Document
      .where(locked_by_id: self.id)
      .update_all(locked_by_id: nil, locked: false)
  end

  def as_json(options = nil)
    super(options).merge({ "confirmed" => self.confirmed? })
  end
end
