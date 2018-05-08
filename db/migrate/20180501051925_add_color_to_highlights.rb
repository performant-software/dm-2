class AddColorToHighlights < ActiveRecord::Migration[5.1]
  def change
    add_column :highlights, :color, :string
  end
end
