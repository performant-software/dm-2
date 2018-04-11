class CreateLinks < ActiveRecord::Migration[5.1]
  def change
    create_table :links do |t|
      t.references :created_by, references: :users
      t.references :linkable_a, polymorphic: true
      t.references :linkable_b, polymorphic: true

      t.timestamps
    end
  end
end
