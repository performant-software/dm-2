class Link < ApplicationRecord
  belongs_to :created_by
  belongs_to :linkable_b
end
