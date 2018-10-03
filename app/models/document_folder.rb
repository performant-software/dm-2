class DocumentFolder < ApplicationRecord
  belongs_to :project, touch: true
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :parent, polymorphic: true
  has_many :documents, as: :parent, dependent: :destroy
  has_many :document_folders, as: :parent, dependent: :destroy

  def contents_children
    (self.documents + self.document_folders).sort_by(&:buoyancy).reverse
  end

  def document_id
    nil
  end

  def document_title
    self.title
  end

  def document_kind
    'folder'
  end

  def thumbnail_url
    nil
  end

  def excerpt
    nil
  end

  def color
    nil
  end

  def descendant_folder_ids
    if self.document_folders.length < 1
      return []
    end
    self.document_folders.map { |folder| [folder.id].concat(folder.descendant_folder_ids) }.flatten!
  end
end
