class AddCreatedbyToHighlights < ActiveRecord::Migration[5.1]
  def change
    add_reference :highlights, :created_by, references: :users
  end
end
