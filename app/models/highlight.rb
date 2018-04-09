class Highlight < ApplicationRecord
  belongs_to :resource
  has_and_belongs_to_many :linkable, as: :linkable
end
