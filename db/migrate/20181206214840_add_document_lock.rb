class AddDocumentLock < ActiveRecord::Migration[5.2]
  def change
    add_reference :documents, :locked_by, references: :users
    add_column :documents, :locked, :boolean, :default => false, :null => false
  end
end
