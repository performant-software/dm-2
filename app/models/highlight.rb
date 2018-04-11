class Highlight < ApplicationRecord
  belongs_to :resource
  has_many :a_links, as: :linkable_a
  has_many :b_links, as: :linkable
end
