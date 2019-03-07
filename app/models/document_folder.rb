class DocumentFolder < ApplicationRecord
  belongs_to :project, touch: true
  belongs_to :parent, polymorphic: true, optional: true
  has_many :documents, as: :parent, dependent: :destroy
  has_many :document_folders, as: :parent, dependent: :destroy

  include TreeNode

  after_create :add_to_tree
  before_destroy :destroyer

  def destroyer
    self.contents_children.each { |child|
      child.destroy
    }
    remove_from_tree
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

   # one time migration function for 20190124154624_add_document_position
  def migrate_to_position!
    i = 0
    self.contents_children.reverse.each { |child|
      child.position = i
      i = i + 1
      child.save!
    }
  end

end
