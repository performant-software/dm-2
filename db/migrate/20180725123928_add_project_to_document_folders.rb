class AddProjectToDocumentFolders < ActiveRecord::Migration[5.2]
  def change
    add_reference :document_folders, :project, foreign_key: true
  end
end
