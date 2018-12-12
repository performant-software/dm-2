class DocumentsController < ApplicationController
  before_action :set_document, only: [:show, :update, :destroy, :add_images, :set_thumbnail, :lock]
  before_action only: [:create] do
    @project = Project.find(params[:project_id])
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
    @document.destroy
  end

  # PATCH /documents/1/lock
  def lock
    locked = params['locked']
    if @document.adjust_lock( current_user, locked ) && @document.save
      render json: @document
    else
      render json: @document.errors, status: :unprocessable_entity
    end
  end
  
  # PUT /documents/1/add_images
  def add_images
    @document.images.attach(document_params[:images])
    render json: @document
  end

  # POST /documents/1/set_thumbnail
  def set_thumbnail
    processed = ImageProcessing::MiniMagick.source(open(params['image_url']))
      .resize_to_fill(80, 80)
      .convert('png')
      .call
    @document.thumbnail.attach(io: processed, filename: "thumbnail-for-document-#{@document.id}.png")
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
      params.require(:document).permit(:project_id, :title, :document_kind, :parent_id, :parent_type, :images => [], :content => {})
    end

    def document_params
      params.require(:document).permit(:title, :parent_id, :parent_type, :buoyancy, :images => [], :content => {})
    end
end
