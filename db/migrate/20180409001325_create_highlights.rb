class CreateHighlights < ActiveRecord::Migration[5.1]
  def change
    create_table :highlights do |t|
      t.string :uid
      t.string :target
      t.references :document, foreign_key: true

      t.timestamps
    end
  end
end
