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

  def purge_image_by_tilesource!(tile_source)
    if !tile_source.is_a?(String) && tile_source.has_key?("url")
      tile_source_url = tile_source["url"]
    else
      tile_source_url = tile_source
    end
    hostname = ENV['HOSTNAME']
    if tile_source_url.include?(hostname)
      spl = tile_source_url.split(hostname)
      tile_source_url = '/' + spl[1]
    elsif /(localhost)(\:[0-9]+)?(\/)(.+)/.match(tile_source_url)
      capt = /(localhost)(\:[0-9]+)?(\/)(.+)/.match(tile_source_url).captures
      tile_source_url =  '/' + capt[-1]
    else
      spl = tile_source_url.split('/')
      tile_source_url = '/' + spl[3...(spl.length)].join('/')
    end
    self.images.each { |image|
      url = polymorphic_url(image, :only_path => true)
      if url == tile_source_url
        image.purge
      end
    }
  end

  def rename_tile_source!(layer, new_name)
    tile_source = self.content["tileSources"][layer]
    if !tile_source.is_a?(String)
      new_tile_source = tile_source
      new_tile_source["name"] = new_name
      self.content["tileSources"][layer] = new_tile_source
    elsif tile_source.end_with?(".json")
      self.content["iiifTileNames"].each {|tile_name_obj|
        if tile_name_obj["url"] == tile_source
          tile_name_obj["name"] = new_name
        end
      }
    else
      new_tile_source = {
        "url" => tile_source,
        "name" => new_name,
        "type"=>"image",
        "useCanvas" => true,
        "crossOriginPolicy" => false,
        "ajaxWithCredentials" => false
      }
      self.content["tileSources"][layer] = new_tile_source
    end
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
    urls = self.images.collect { |image| url_for image }
    if self[:content] && self[:content]["tileSources"]
      ordered_urls = []
      self[:content]["tileSources"].each {|tileSource|
        if tileSource["url"] && urls.include?(tileSource["url"])
          ordered_urls.push(tileSource["url"])
        elsif tileSource && urls.include?(tileSource)
          ordered_urls.push(tileSource)
        end
      }
      urls.each { |url| 
        if !ordered_urls.include?(url)
          ordered_urls.push(url)
        end
      }
      return ordered_urls
    else
      return urls
    end
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
