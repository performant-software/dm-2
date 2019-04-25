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
  before_action only: [:create] do
    validate_user_write(@project)
  end
  before_action only: [:update, :destroy, :set_thumbnail] do
    validate_user_write(@project) && validate_document_lock(@document)
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
    coords = params['coords']
    thumb_rect = { 
      'left': coords['tl']['x'],
      'top': coords['tl']['y'],
      'width': coords['tr']['x'] - coords['tl']['x'],
      'height': coords['bl']['y'] - coords['tl']['y']
    }

    @highlight.set_thumbnail( params['image_url'], thumb_rect )
    render json: @highlight
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_highlight
      @highlight = Highlight.find(params[:id])
      @project = @highlight.project
      @document = @highlight.document
    end

    # Only allow a trusted parameter "white list" through.
    def highlight_params
      params.require(:highlight).permit(:uid, :target, :document_id, :excerpt, :color)
    end
end
