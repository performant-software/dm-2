class UserProjectPermissionsController < ApplicationController
  before_action :set_user_project_permission, only: [:show, :update, :destroy]
  before_action only: [:create] do
    @project = Project.find(params[:project_id])
    @user = User.find_by( email: params[:email] )
  end
  before_action only: [:show, :create, :update, :destroy] do
    validate_user_admin(@project)
  end

  # GET /user_project_permissions/1
  def show
    render json: @user_project_permission
  end

  # POST /user_project_permissions
  def create
    user_params = {
      user_id: @user.nil? ? nil : @user.id,
      permission: user_project_permission_params[:permission],
      project_id: @project.id
    }
    @user_project_permission = UserProjectPermission.new(user_params)
    if @user_project_permission.save
      render json: @user_project_permission, status: :created, location: @user_project_permission
    else
      render json: @user_project_permission.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /user_project_permissions/1
  def update
    if @user_project_permission.update(user_project_permission_params)
      render json: @user_project_permission
    else
      render json: @user_project_permission.errors, status: :unprocessable_entity
    end
  end

  # DELETE /user_project_permissions/1
  def destroy
    @user_project_permission.destroy
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_user_project_permission
      @user_project_permission = UserProjectPermission.find(params[:id])
      @project = @user_project_permission.project
    end

    # Only allow a trusted parameter "white list" through.
    def user_project_permission_params
      params.require(:user_project_permission).permit(:project_id, :email, :permission)
    end
end
