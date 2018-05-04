class Linkable < ApplicationRecord
  self.abstract_class = true

  has_many :a_links, class_name: 'Link', as: :linkable_a, dependent: :destroy
  has_many :b_links, class_name: 'Link', as: :linkable_b, dependent: :destroy
  has_many :a_linked_highlights, through: :a_links, source: :linkable_b, source_type: 'Highlight'
  has_many :b_linked_highlights, through: :b_links, source: :linkable_a, source_type: 'Highlight'
  has_many :a_linked_documents, through: :a_links, source: :linkable_b, source_type: 'Document'
  has_many :b_linked_documents, through: :b_links, source: :linkable_a, source_type: 'Document'

  def links
    self.a_links.or self.b_links
  end

  def links_to
    #TODO: make this more efficient, e.g. a merged collection rather than evaluated array?
    (a_linked_documents.all + b_linked_documents.all + a_linked_highlights.all + b_linked_highlights.all).uniq
  end

  def add_link_to(linked)
    unless self.links_to.include? linked #TODO: make more efficient, e.g. by validating uniqueness
      link = Link.create(linkable_a: self, linkable_b: linked)
    end
  end
end
