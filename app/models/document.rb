include Rails.application.routes.url_helpers

class Document < Linkable
  belongs_to :project, touch: true
  belongs_to :locked_by, class_name: 'User', optional: true
  belongs_to :parent, polymorphic: true, optional: true
  has_many :highlights, dependent: :destroy
  has_many_attached :images

  include PgSearch

  pg_search_scope :search_for, against: %i(title search_text)

  def adjust_lock( user, state )
    if locked_by == nil || locked_by.id == user.id
      if( state == true )
        self.locked = true
        self.locked_by = user
      else
        self.locked = false
        self.locked_by = nil
      end
      return true
    else
      # if it is locked by someone else
      return false
    end
  end
  
  def document_id
    self.id
  end

  def document_title
    self.title
  end

  def highlight_id
    nil
  end

  def excerpt
    nil
  end

  def color
    nil
  end

  def highlight_map
    Hash[self.highlights.collect { |highlight| [highlight.uid, highlight]}]
  end

  def image_urls
    self.images.collect { |image| url_for image }
  end

  def image_thumbnail_urls
    self.images.collect { |image| url_for image.variant(thumbnail: '80x80') }
  end

  def descendant_folder_ids
    nil
  end

  def to_obj
    {
      id: self.id, 
      title: self.title, 
      document_id: self.id, 
      document_title: self.title, 
      document_kind: self.document_kind, 
      excerpt: self.excerpt,
      color: self.color,
      thumbnail_url: self.image_thumbnail_urls.nil? ? nil : self.image_thumbnail_urls.first,
      buoyancy: self.buoyancy
    }
  end

end
