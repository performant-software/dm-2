class RemoveBuoyancy < ActiveRecord::Migration[5.2]
  def change
    remove_column :documents, :buoyancy, :float
    remove_column :document_folders, :buoyancy, :float
  end
end
