class AddParentToDocuments < ActiveRecord::Migration[5.1]
  def change
    add_reference :documents, :parent, polymorphic: true
    add_column :documents, :content, :jsonb
  end
end
