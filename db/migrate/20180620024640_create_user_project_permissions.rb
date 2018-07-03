class CreateUserProjectPermissions < ActiveRecord::Migration[5.2]
  def change
    create_table :user_project_permissions do |t|
      t.references :user
      t.references :project
      t.string :permission

      t.timestamps
    end
  end
end
