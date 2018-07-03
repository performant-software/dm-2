class UserProjectPermission < ApplicationRecord
  belongs_to :user
  belongs_to :project
  validates :user, uniqueness: { scope: :project }

  scope :read, -> { where(permission: ['read', 'write', 'admin']) }
  scope :write, -> { where(permission: ['write', 'admin']) }
  scope :admin, -> { where(permission: 'admin') }
end
