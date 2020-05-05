include Rails.application.routes.url_helpers

class Document < Linkable
  belongs_to :project, touch: true
  belongs_to :locked_by, class_name: 'User', optional: true
  belongs_to :parent, polymorphic: true, optional: true
  has_many :highlights, dependent: :destroy
  has_many_attached :images
  has_many :documents, as: :parent, dependent: :destroy
  has_many :document_folders, as: :parent, dependent: :destroy

  include PgSearch
  include TreeNode

  after_create :tree_check
  before_destroy :destroyer

  MAX_IMAGE_SIZE = 300 # MB

  pg_search_scope :search_for, against: %i(title search_text)

  def destroyer
    self.contents_children.each { |child|
      child.destroy
    }
    remove_from_tree
    purge_images
  end

  def purge_images
    self.images.each { |image| image.purge }
  end

  def tree_check
    add_to_tree unless @import_mode
  end

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

  def import_mode=(state)
    @import_mode = state
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

  def add_thumbnail( image_url )
    processed = ImageProcessing::MiniMagick.source(open(image_url))
      .resize_to_fill(80, 80)
      .convert('png')
      .call
   self.thumbnail.attach(io: processed, filename: "thumbnail-for-document-#{self.id}.png")
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
