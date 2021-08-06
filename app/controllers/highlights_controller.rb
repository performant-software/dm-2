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
    @links = Link.where(:linkable_b_type => 'Highlight', :linkable_b_id => @highlight.id)
    @links.each { |link|
      link.renumber_all(true)
    }
    @highlight.destroy
  end

  def duplicate
    highlight_entries = params[:highlights]
    new_document_id = params[:document_id]

    new_highlights = highlight_entries.collect{ |entry|
      highlight = Highlight.where(uid: entry[:highlightUid], document_id: entry[:documentId]).first
      if !highlight.nil?
        if highlight.uid.include?("text_highlight")
          new_attributes = highlight.attributes.merge({
            'uid' => entry[:newHighlightUid],
            'target' => entry[:newHighlightUid], 
            'document_id' => new_document_id
          })
        else
          new_attributes = highlight.attributes.merge({
            'uid' => entry[:newHighlightUid], 
            'document_id' => new_document_id
          })
        end
        new_attributes.delete('id')
        new_highlight = Highlight.create new_attributes
        if !highlight.highlights_links.nil? && highlight.highlights_links.length() > 0
          all_links = highlight.highlights_links.sort_by{ |hll| hll.position }.map{ |hll| { :link => Link.where(:id => hll.link_id).first, :position => hll.position } }
          all_links.each do |linkable_obj|
            if !linkable_obj[:link].nil?
              new_highlight.add_link_from_duplication(linkable_obj[:link], highlight[:id], linkable_obj[:position])
            end
          end
          if new_highlight.highlights_links.length() > 0
            sorted_hlls = new_highlight.highlights_links.sort_by{ |hll| hll.position }
            Link.renumber(sorted_hlls)
          end
        end
        new_highlight
      end
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
