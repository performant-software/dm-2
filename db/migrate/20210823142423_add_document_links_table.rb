class AddDocumentLinksTable < ActiveRecord::Migration[5.2]
  def change
    create_join_table :documents, :links do |t|                  
      t.primary_key :id
      t.index :document_id
      t.index :link_id
      t.integer "position", default: -1, null: false

      t.timestamps
    end
  end
end
