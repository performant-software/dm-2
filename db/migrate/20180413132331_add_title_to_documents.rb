class AddTitleToDocuments < ActiveRecord::Migration[5.1]
  def change
    add_column :documents, :title, :string
    add_column :documents, :document_kind, :string
  end
end
