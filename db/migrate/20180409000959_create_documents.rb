class CreateDocuments < ActiveRecord::Migration[5.1]
  def change
    create_table :documents do |t|
      t.references :project, foreign_key: true
      t.references :created_by, references: :users

      t.timestamps
    end
  end
end
