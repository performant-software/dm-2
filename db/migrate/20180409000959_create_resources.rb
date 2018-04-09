class CreateResources < ActiveRecord::Migration[5.1]
  def change
    create_table :resources do |t|
      t.string :title
      t.string :resource_type
      t.jsonb :content
      t.references :project, foreign_key: true
      t.references :created_by, references: :users

      t.timestamps
    end
  end
end
