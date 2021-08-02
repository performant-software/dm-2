module TextHighlightHelper
  # One time patch function for malformed text highlights
  def self.patch_text_highlights!
    highlights = Highlight.all
    highlights.each {|h|
      if !h.uid.nil? && h.uid.include?("text_highlight") && (h.uid != h.target)
        h.update(:target => h.uid)
      end
    }
  end

  # One time patch function for duplicate text highlights
  def self.merge_duplicate_highlights!
    highlights = Highlight.all
    highlights.each {|highlight|
      if highlight[:uid].include?("text_highlight")
        duplicate_highlights = Highlight.where(:uid => highlight.uid).where.not(:id => highlight.id)
        duplicate_highlights.each {|dh|
          dh.a_links.each {|al|
            unless Link.where(
              linkable_a_id: highlight.id,
              linkable_a_type: 'Highlight',
              linkable_b_id: al.linkable_b_id,
              linkable_b_type: al.linkable_b_type,
            ).count > 0
              Link.create(
                linkable_a_id: highlight.id,
                linkable_a_type: 'Highlight',
                linkable_b_id: al.linkable_b_id,
                linkable_b_type: al.linkable_b_type,
              )
            end
          }
          dh.b_links.each {|bl|
            unless Link.where(
              linkable_a_id: bl.linkable_a_id,
              linkable_a_type: bl.linkable_a_type,
              linkable_b_id: highlight.id,
              linkable_b_type: 'Highlight',
            ).count > 0
              Link.create(
                linkable_a_id: bl.linkable_a_id,
                linkable_a_type: bl.linkable_a_type,
                linkable_b_id: highlight.id,
                linkable_b_type: 'Highlight',
              )
            end
          }
        }
      end
    }
  end
end