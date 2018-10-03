class AddBuoyancyToDocumentFolders < ActiveRecord::Migration[5.2]
  def change
    add_column :document_folders, :buoyancy, :float, :default => 0.0, :null => false
    add_column :documents, :buoyancy, :float, :default => 0.0, :null => false
  end
end
