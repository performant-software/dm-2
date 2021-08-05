class Linkable < ApplicationRecord
  self.abstract_class = true

  has_many :a_links, class_name: 'Link', as: :linkable_a, dependent: :destroy
  has_many :b_links, class_name: 'Link', as: :linkable_b, dependent: :destroy
  has_one_attached :thumbnail

  def links
    self.a_links.or self.b_links
  end

  def to_link_obj(link)
    # we want to find the target linkable item that is being point at by this item
    # compare ids first to determine which one is the target before instantiating 
    # the active record from the DB (which might be large)
    target = (link.linkable_a_id == self.id && link.linkable_a_type == self.class.to_s) ? link.linkable_b : link.linkable_a 
    target_obj = target.to_obj
    # include link id so we can access it directly later
    target_obj[:link_id] = link.id
    target_obj
  end

  def links_to    
    all_links = self.a_links + self.b_links
    all_links.map { |link| to_link_obj(link) }.compact
  end

  def thumbnail_url
    self.thumbnail.attached? ? url_for(self.thumbnail) : nil
  end
end
