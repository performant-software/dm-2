module HighlightTitleMigrationHelper
  # One time migration function for 20210826133446_add_title_to_highlights.rb
  # Optional - only run if existing excerpts should be converted to titles
  def self.convert_excerpts_to_titles!
    Highlight.find_each do |hl|
      excerpt = hl[:excerpt]
      hl.update(:title => excerpt)
    end
  end
end