class DocumentsController < ApplicationController
  before_action :set_document, only: [:show, :update, :destroy, :add_images, :set_thumbnail]

  # GET /documents
  def index
    @documents = Document.all

    render json: @documents
  end

  # GET /documents/1
  def show
    render json: @document, include: ['project_id', 'created_by', 'highlights', 'highlights.links_to', 'links_to']
  end

  # POST /documents
  def create
    @document = Document.new(document_params)

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
    end

    # Only allow a trusted parameter "white list" through.
    def document_params
      params.require(:document).permit(:project_id, :created_by_id, :title, :document_kind, :parent_id, :parent_type, :images => [], :content => {})
    end
end
