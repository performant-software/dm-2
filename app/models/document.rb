include Rails.application.routes.url_helpers

class Document < Linkable
  belongs_to :project, touch: true
  belongs_to :locked_by, class_name: 'User', optional: true
  belongs_to :parent, polymorphic: true, optional: true
  has_many :highlights, dependent: :delete_all
  has_many_attached :images

  include PgSearch
  include TreeNode

  after_create :add_to_tree
  before_destroy :remove_from_tree
  # before_destroy :purge_images

  MAX_IMAGE_SIZE = 10

  pg_search_scope :search_for, against: %i(title search_text)

  # TODO this won't be called by delete_all - need a better way to clean up images
  # def purge_images
  #   self.images.each { |image| image.purge }
  # end

  # checks that all images validate, purges invalid images
  def valid_images?
    self.images.each { |image| 
      if !image.nil?
        if !image.blob.content_type.in?(%w(image/jpeg image/jpg image/png))
          image.purge_later
          errors.add(:images, 'The image wrong format')
        elsif image.blob.content_type.in?(%w(image/jpeg image/jpg image/png)) && image.blob.byte_size > (MAX_IMAGE_SIZE * 1024 * 1024) 
          image.purge_later
          errors.add(:images, "The image oversize limited (#{MAX_IMAGE_SIZE}MB)")
        end
      elsif image.attached? == false
        image.purge_later
        errors.add(:images, 'The image required.')
      end  
    }
    return !(errors && errors.size > 0)
  end

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
  
  def is_leaf?
    true
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
      thumbnail_url: self.thumbnail_url,
    }
  end

end
