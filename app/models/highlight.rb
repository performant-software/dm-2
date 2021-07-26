require 'mini_magick'

class Highlight < Linkable
  belongs_to :document, touch: true
  has_many :highlights_links, :dependent => :destroy
  has_many :links, through: :highlights_links

  def links_to
    all_links = self.highlights_links.sort_by{ |hll| hll.position }.map{ |hll| Link.where(:id => hll.link_id).first }
    all_links.map { |link| self.to_link_obj(link) }.compact
  end

  def highlight_id
    self.id
  end

  def set_thumbnail( image_url, thumb_rect )
    pad_factor = 0.06
    base_image = MiniMagick::Image.open(image_url)
    base_image.resize '200'
    orig_offset_x = thumb_rect[:left] != nil ? thumb_rect[:left] : thumb_rect['left']
    orig_offset_y = thumb_rect[:top] != nil ? thumb_rect[:top] : thumb_rect['top']
    orig_width = thumb_rect[:width] != nil ? thumb_rect[:width] : thumb_rect['width']
    orig_height = thumb_rect[:height] != nil ? thumb_rect[:height] : thumb_rect['height']
    is_wider_than_long = orig_width > orig_height
    min_max = [orig_width, orig_height].minmax
    greater_of_width_and_height = min_max[1]
    lesser_of_width_and_height = min_max[0]
    offset_subtract = (greater_of_width_and_height - lesser_of_width_and_height) / 2.0
    pad_subtract = greater_of_width_and_height * pad_factor
    crop_wh = greater_of_width_and_height * (1 + pad_factor * 2.0)
    adjusted_offset_x = orig_offset_x - pad_subtract
    adjusted_offset_y = orig_offset_y - pad_subtract
    if is_wider_than_long
      adjusted_offset_y = adjusted_offset_y - offset_subtract
    else
      adjusted_offset_x = adjusted_offset_x - offset_subtract
    end
    base_image.crop "#{crop_wh * 0.1}x#{crop_wh * 0.1}+#{adjusted_offset_x * 0.1}+#{adjusted_offset_y * 0.1}"
    base_image.resize '80x80'
    base_image.format 'png'
    io = File.open(base_image.path)
    self.thumbnail.attach(io: io, filename: "thumbnail-for-highlight-#{self.id}.png")
  end

  def document_title
    self.document ? self.document.title : '[unidentified document]'
  end

  def document_kind
    self.document ? self.document.document_kind : 'unknown'
  end

  def project
    self.document ? self.document.project : nil
  end

  def to_obj
    {
      id: self.id,
      highlight_id: self.highlight_id,
      document_id: self.document_id,
      document_kind: self.document_kind,
      document_title: self.document_title,
      excerpt: self.excerpt,
      color: self.color,
      thumbnail_url: self.thumbnail_url
    }
  end
end
