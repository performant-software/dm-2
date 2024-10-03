# frozen_string_literal: true

class DeduplicateHighlights < ActiveRecord::Migration[6.1]
  # one-time data migration to deduplicate highlights with identical UIDs
  def up
    # NOTE: Document.highlight_map would always return one record per UID, even when there were
    # multiple records with identical UIDs. As such, since Document.highlight_map was relying on
    # default database ordering with no ORDER BY, it is impossible to replicate the correct order
    # with ORDER BY; we can only use the ordering from the same SQL statement executed previosuly
    # by highlight_map. Once we retrieve the correct highlight per each UID we can delete all
    # others sharing its UID.
    Document.pluck(:id).each do |doc_id|
      # get the correct highlight database ID per each UID; MUST be in order returned by this query
      query = <<-SQL
        SELECT "highlights".* FROM "highlights" WHERE "highlights"."document_id" = #{doc_id};
      SQL
      doc_highlights = Highlight.find_by_sql(query)
      correct_highlights = doc_highlights.to_h { |hl| [hl[:uid], hl[:id]] }
      # find all highlights with matching UIDs but non-matching database IDs (i.e. unused duplicates)
      to_delete_ids= doc_highlights.select {
        |hl| correct_highlights[hl[:uid]] != hl[:id]
      }.pluck(:id)
      # destroy unused duplicate records
      Highlight.where(:id => to_delete_ids).destroy_all
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
