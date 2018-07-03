class LinksController < ApplicationController
  before_action :set_link, only: [:show, :update, :destroy]
  before_action only: [:create] do
    linkable_a_type = params[:linkable_a_type]
    linkable_b_type = params[:linkable_b_type]
    if linkable_a_type == 'Document'
      @project = Document.find(params[:linkable_a_id]).project
    elsif linkable_b_type == 'Document'
      @project = Document.find(params[:linkable_b_type]).project
    elsif linkable_a_type == 'Highlight'
      @project = Highlight.find(params[:linkable_a_id]).project
    end
  end
  before_action only: [:show] do
    validate_user_read(@project)
  end
  before_action only: [:create, :update, :destroy] do
    validate_user_write(@project)
  end

  # GET /links/1
  def show
    render json: @link
  end

  # POST /links
  def create
    @link = Link.new(new_link_params)

    if @link.save
      render json: @link, status: :created, location: @link
    else
      render json: @link.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /links/1
  # def update
  #   if @link.update(link_params)
  #     render json: @link
  #   else
  #     render json: @link.errors, status: :unprocessable_entity
  #   end
  # end

  # DELETE /links/1
  def destroy
    @link.destroy
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_link
      @link = Link.find(params[:id])
      @project = @link.linkable_a.project
    end

    # Only allow a trusted parameter "white list" through.
    def new_link_params
      params.require(:link).permit(:created_by_id, :linkable_a_id, :linkable_a_type, :linkable_b_id, :linkable_b_type)
    end

    # def link_params
    #   params.require(:link).permit()
    # end
end
