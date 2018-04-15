class DocumentFoldersController < ApplicationController
  before_action :set_document_folder, only: [:show, :update, :destroy]

  # GET /document_folders
  def index
    @document_folders = DocumentFolder.all

    render json: @document_folders
  end

  # GET /document_folders/1
  def show
    render json: @document_folder
  end

  # POST /document_folders
  def create
    @document_folder = DocumentFolder.new(document_folder_params)

    if @document_folder.save
      render json: @document_folder, status: :created, location: @document_folder
    else
      render json: @document_folder.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /document_folders/1
  def update
    if @document_folder.update(document_folder_params)
      render json: @document_folder
    else
      render json: @document_folder.errors, status: :unprocessable_entity
    end
  end

  # DELETE /document_folders/1
  def destroy
    @document_folder.destroy
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_document_folder
      @document_folder = DocumentFolder.find(params[:id])
    end

    # Only allow a trusted parameter "white list" through.
    def document_folder_params
      params.require(:document_folder).permit(:title, :created_by_id, :parent_id)
    end
end
