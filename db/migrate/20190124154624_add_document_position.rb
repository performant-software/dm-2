class AddDocumentPosition < ActiveRecord::Migration[5.2]
  def change
    add_column :documents, :position, :integer, :default => 0
    add_column :document_folders, :position, :integer, :default => 0
  end
end
