class HighlightsLink < ApplicationRecord
   belongs_to :highlight
   belongs_to :link
   after_create :move_to_zero

   def move_to_zero
      # move to 0 if no position specified
      if self.position.nil? || self.position == -1
         siblings = HighlightsLink.where(:highlight_id => self.highlight_id).sort_by(&:position)
         i = 0
         siblings.each { |sibling|
            sibling.position = i
            i = i + 1
            sibling.save!
         }
      end
   end
end