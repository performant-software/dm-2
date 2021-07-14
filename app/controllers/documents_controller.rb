class DocumentsController < ApplicationController
  before_action :set_document, only: [:show, :update, :move, :destroy, :add_images, :set_thumbnail, :lock]
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
    @document = Document.new(new_document_params)
    @document.adjust_lock( current_user, true )

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
      @document.destroy    
    else
      head :fobidden
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
      @document.images.each { |image|
        imagetitle, _, _ = image.filename.to_s.rpartition('.')
        @document.update(title: imagetitle)
      }
      render json: @document 
    else
      render json: @document.errors, status: :unprocessable_entity
    end 
  end

  # POST /documents/1/set_thumbnail
  def set_thumbnail
    @document.add_thumbnail( params['image_url'] )
    render json: @document
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
