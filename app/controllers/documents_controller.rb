class DocumentsController < ApplicationController
  before_action :set_document, only: [
    :show,
    :update,
    :move,
    :destroy,
    :add_images,
    :set_thumbnail,
    :lock,
    :move_layer,
    :delete_layer,
    :rename_layer
  ]
  before_action only: [:create] do
    @project = Project.find(params[:project_id])
  end
  before_action only: [:show] do
    validate_user_read(@project)
  end
  before_action only: [:create, :lock] do
    validate_user_write(@project)
  end
  before_action only: [:move] do
    validate_user_write(@document.project)
  end
  before_action only: [:update, :set_thumbnail] do
    validate_user_write(@project) && validate_document_lock(@document)
  end

  # GET /documents/1
  def show
    render json: @document
  end

  # POST /documents
  def create
    lock = params.fetch(:locked, true)
    @document = Document.new(new_document_params)
    @document.adjust_lock( current_user, lock )

    if !params[:images].nil? && params[:images].length() > 0
      @document.images.attach(params[:images])
      if @document.valid_images? && @document.images[0]
        image = @document.images[0]
        imagetitle, _, _ = image.filename.to_s.rpartition('.')
        @document.update(title: imagetitle)
      end
    end

    if @document.save
      render json: @document, status: :created, location: @document
    else
      render json: @document.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /documents/1
  def update
    if @document.update(document_params)
      render json: @document
    else
      render json: @document.errors, status: :unprocessable_entity
    end
  end

  # DELETE /documents/1
  def destroy
    if @document.locked_by == nil || @document.locked_by.id == current_user.id
      @links = @document.documents_links.map{ |dl| Link.where(:id => dl.link_id).first }
      @links.each { |link|
        link.renumber_all(true)
      }
      @document.destroy    
    else
      head :forbidden
    end
  end

  # PATCH /documents/1/lock
  def lock
    locked = params['locked']
    @document.adjust_lock( current_user, locked )
    if @document.save
      render json: @document
    else
      render json: @document.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /documents/1/move
  def move
    p = document_move_params    
    destination_id = p[:destination_id].nil? ? @document.project_id : p[:destination_id]
    destination_type =  p[:destination_id].nil? ? "Project" : "DocumentFolder"
    @document.move_to(p[:position],destination_id,destination_type)
  end
  
  # PUT /documents/1/add_images
  def add_images
    @document.images.attach(document_params[:images])

    if @document.valid_images?
      if @document.title == 'Untitled Image'
        image = @document.images[0]
        imagetitle, _, _ = image.filename.to_s.rpartition('.')
        @document.update(title: imagetitle)
      end
      render json: @document 
    else
      render json: @document.errors, status: :unprocessable_entity
    end 
  end

  # PATCH /documents/1/move_layer
  #   :origin - The array index of the layer to move
  #   :direction - Must be -1 for backward, 1 for forward
  def move_layer
    content = @document[:content]
    origin = Integer(params[:origin]) rescue nil
    direction = Integer(params[:direction]) rescue nil
    if origin.nil? || origin < 0 || ![-1, 1].include?(direction)
      render status: :bad_request
    elsif content["tileSources"]
      destination = origin + direction
      size = content["tileSources"].length()
      if origin >= size || destination >= size || destination < 0
        render status: :bad_request
      else
        temp = content["tileSources"][origin].dup
        content["tileSources"][origin] = content["tileSources"][destination]
        content["tileSources"][destination] = temp
        if @document.save!
          render json: @document
        else
          render json: @document.errors,  status: 500
        end
      end
    else
      render status: :bad_request
    end
  end

  # PATCH /documents/1/delete_layer
  #   :layer - The array index of the layer to delete
  def delete_layer
    content = @document[:content]
    layer = Integer(params[:layer]) rescue nil
    if layer.nil? || layer < 0
      render status: :bad_request
    elsif content["tileSources"]
      size = content["tileSources"].length()
      if layer >= size
        render status: :bad_request
      else
        tile_source = content["tileSources"][layer]
        @document.purge_image_by_tilesource!(tile_source)
        if tile_source.is_a?(String) && content.has_key?("iiifTileNames")
          content["iiifTileNames"].delete_if {|tile_name_obj|
            tile_name_obj["url"] == tile_source
          }
        end
        content["tileSources"].delete_at(layer)
        if @document.save!
          render json: @document
        else
          render json: @document.errors, status: 500
        end
      end
    else
      render status: :bad_request
    end
  end

  # PATCH /documents/1/rename_layer
  #   :layer - The array index of the layer to rename
  #   :name - The new name for that layer
  def rename_layer
    content = @document[:content]
    layer = Integer(params[:layer]) rescue nil
    new_name = params[:name]
    if layer.nil? || layer < 0 || new_name.nil?
      render status: :bad_request
    elsif !content.nil? && !content["tileSources"].nil?
      size = content["tileSources"].length()
      if layer >= size
        render status: :bad_request
      else
        @document.rename_tile_source!(layer, new_name)
        if @document.save!
          render json: @document
        else
          render json: @document.errors, status: 500
        end
      end
    else
      render status: :bad_request
    end
  end

  # POST /documents/1/set_thumbnail
  def set_thumbnail
    if @document.add_thumbnail( params['image_url'] )
      render json: @document
    else
      render status: 408
    end
  end

  # GET /image/1
  def get_image_by_signed_id
    @blob = ActiveStorage::Blob.find_signed(params['signed_id'])
    @blobject = { :blob => @blob, :url => (url_for @blob) }
    render json: @blobject
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_document
      @document = Document.find(params[:id])
      @project = @document.project
    end

    # Only allow a trusted parameter "white list" through.
    def new_document_params
      params.require(:document).permit(:project_id, :title, :parent_id, :parent_type, :document_kind, :images => [], :content => {})
    end

    def document_move_params
      params.require(:document).permit(:destination_id, :position)
    end

    def document_params
      params.require(:document).permit(:title, :parent_id, :parent_type, :search_text, :images => [], :content => {})
    end
end
