class AddTitleToHighlights < ActiveRecord::Migration[5.2]
  def change
    add_column :highlights, :title, :string
  end
end
