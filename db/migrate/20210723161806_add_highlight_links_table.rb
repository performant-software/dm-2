class AddHighlightLinksTable < ActiveRecord::Migration[5.2]
  def change
    create_join_table :highlights, :links do |t|
      t.index :highlight_id
      t.index :link_id
      t.integer "position", default: -1, null: false

      t.timestamps
    end
    remove_column :links, :position, :integer, null: false, default: -1
  end
end
