require 'mini_magick'

class HighlightsController < ApplicationController
  before_action :set_highlight, only: [:show, :update, :destroy, :set_thumbnail]

  before_action only: [:create] do
    document = Document.find(params[:document_id])
    @project = document.project
  end
  before_action only: [:show] do
    validate_user_read(@project)
  end
  before_action only: [:create, :update, :destroy, :set_thumbnail] do
    validate_user_write(@project)
  end


  # GET /highlights/1
  def show
    render json: @highlight
  end

  # POST /highlights
  def create
    @highlight = Highlight.new(highlight_params)

    if @highlight.save
      render json: @highlight, status: :created, location: @highlight
    else
      render json: @highlight.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /highlights/1
  def update
    if @highlight.update(highlight_params)
      render json: @highlight
    else
      render json: @highlight.errors, status: :unprocessable_entity
    end
  end

  # DELETE /highlights/1
  def destroy
    @highlight.destroy
  end

  def duplicate
    highlight_entries = params[:highlights]
    new_document_id = params[:document_id]

    new_highlights = highlight_entries.collect{ |entry|
      highlight = Highlight.where(uid: entry[:highlightUid], document_id: entry[:documentId]).first
      new_attributes = highlight.attributes.merge({'uid' => entry[:newHighlightUid], 'document_id' => new_document_id})
      new_attributes.delete('id')
      new_highlight = Highlight.create new_attributes
      highlight.links_to.each do |linkable|
        new_highlight.add_link_to(linkable)
      end
      new_highlight
    }

    render json: new_highlights
  end

  def set_thumbnail
    pad_factor = 0.06
    base_image = MiniMagick::Image.open(params['image_url'])
    base_image.resize '200'
    coords = params['coords']
    orig_offset_x = coords['tl']['x']
    orig_offset_y = coords['tl']['y']
    orig_width = coords['tr']['x'] - orig_offset_x
    orig_height = coords['bl']['y'] - orig_offset_y
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

    # TODO: process and overlay SVG
    svg_object = params['svg_string']
    svg_document = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\" ?><!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 1.1//EN\" \"http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\"><svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" width=\"80\" height=\"80\" viewBox=\"#{adjusted_offset_x} #{adjusted_offset_y} #{crop_wh} #{crop_wh}\" xml:space=\"preserve\">#{svg_object}</svg>"
    svg_file = Tempfile.new('temp-svg')
    svg_file.write(svg_document)
    svg_file.rewind
    svg_image = MiniMagick::Image.open(svg_file.path)

    combined_image = base_image.composite(svg_image) do |c|
      c.background 'none'
    end

    path = combined_image.path
    io = File.open(path)
    @highlight.thumbnail.attach(io: io, filename: "thumbnail-for-highlight-#{@highlight.id}.png")

    render json: @highlight
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_highlight
      @highlight = Highlight.find(params[:id])
      @project = @highlight.project
    end

    # Only allow a trusted parameter "white list" through.
    def highlight_params
      params.require(:highlight).permit(:uid, :target, :document_id, :created_by_id, :excerpt, :color)
    end
end
