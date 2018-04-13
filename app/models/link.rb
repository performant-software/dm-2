class Link < ApplicationRecord
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :linkable_a, polymorphic: true
  belongs_to :linkable_b, polymorphic: true
end
