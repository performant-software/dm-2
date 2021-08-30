class AddIdToHighlightsLinks < ActiveRecord::Migration[5.2]
  def change
    add_column :highlights_links, :id, :primary_key, first: true
  end
end
