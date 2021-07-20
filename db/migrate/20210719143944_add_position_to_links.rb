class AddPositionToLinks < ActiveRecord::Migration[5.2]
  def change
    add_column :links, :position, :integer, null: false, default: -1
  end
end
