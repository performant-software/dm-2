class RemoveCreatedBy < ActiveRecord::Migration[5.2]
  def change
    remove_column :documents, :created_by_id, :int
    remove_column :document_folders, :created_by_id, :int
    remove_column :highlights, :created_by_id, :int
    remove_column :links, :created_by_id, :int
  end
end
