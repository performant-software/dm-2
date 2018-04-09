class Resource < ApplicationRecord
  belongs_to :project
  belongs_to :created_by, className: 'User', optional: true
  has_many :highlights
  has_and_belongs_to_many :linkable, as: :linkable
end
