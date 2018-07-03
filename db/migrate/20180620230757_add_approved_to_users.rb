class AddApprovedToUsers < ActiveRecord::Migration[5.2]
  def change
    add_column :users, :approved, :boolean, :default => false, :null => false
  end
end
