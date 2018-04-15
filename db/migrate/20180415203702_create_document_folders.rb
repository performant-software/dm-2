class CreateDocumentFolders < ActiveRecord::Migration[5.1]
  def change
    create_table :document_folders do |t|
      t.string :title
      t.references :created_by, references: :users
      t.references :parent, polymorphic: true

      t.timestamps
    end
  end
end
