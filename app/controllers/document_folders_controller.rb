class DocumentFoldersController < ApplicationController
  before_action :set_document_folder, only: [:show, :update, :move, :destroy]
  before_action only: [:create] do
    @project = Project.find(params[:project_id])
  end
  before_action only: [:show] do
    validate_user_read(@project)
  end
  before_action only: [:create, :update, :destroy, :set_thumbnail, :move] do
    validate_user_write(@project)
  end

  #TODO: validate permissions for (recursively determined?) containing project

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
    if params[:parent_type] == 'DocumentFolder' && (@document_folder.id == params[:parent_id] || @document_folder.descendant_folder_ids.include?(params[:parent_id]))
      head :method_not_allowed
      return false
    end
    if @document_folder.update(document_folder_params)
      render json: @document_folder
    else
      render json: @document_folder.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /document_folders/1/move
  def move
    p = document_folder_move_params
    if @document_folder.move_to(p[:destination_id], p[:position])
      head :ok
    else
      render json: @document_folder.errors, status: :unprocessable_entity
    end
  end

  # DELETE /document_folders/1
  def destroy
    descendants = @document_folder.descendant_folder_ids
    @document_folder.destroy
    render json: descendants
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_document_folder
      @document_folder = DocumentFolder.find(params[:id])
      @project = @document_folder.project
    end

    def document_folder_move_params
      params.require(:document_folder).permit(:destination_id, :position)
    end

    # Only allow a trusted parameter "white list" through.
    def document_folder_params
      params.require(:document_folder).permit(:project_id, :title, :parent_id, :parent_type )
    end
end
