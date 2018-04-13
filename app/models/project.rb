class Project < ApplicationRecord
  belongs_to :owner, class_name: 'User', optional: true
  has_many :documents
end
