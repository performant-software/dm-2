class AddUniqueIndexToUserProjectPermissions < ActiveRecord::Migration[5.2]
  def change
    add_index :user_project_permissions, [:user_id, :project_id], unique: true
  end
end
