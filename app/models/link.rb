class Link < ApplicationRecord
  belongs_to :linkable_a, polymorphic: true, touch: true
  belongs_to :linkable_b, polymorphic: true, touch: true
end
