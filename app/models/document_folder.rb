class DocumentFolder < ApplicationRecord
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :parent, polymorphic: true
  has_many :documents, as: :parent
  has_many :document_folders, as: :parent

  def contents_children
    self.documents + self.document_folders
  end
end
