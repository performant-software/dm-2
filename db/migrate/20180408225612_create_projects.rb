class CreateProjects < ActiveRecord::Migration[5.1]
  def change
    create_table :projects do |t|
      t.string :title
      t.string :description
      t.boolean :public
      t.references :owner, references: :users

      t.timestamps
    end
  end
end
