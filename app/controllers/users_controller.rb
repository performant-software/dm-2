class UsersController < ApplicationController
  before_action :set_user, only: [:admin_update, :destroy]
  before_action :authenticate_user!, only: [:list_admin, :admin_update, :destroy]
  before_action :authenticate_user_admin, only: [:list_admin, :admin_update, :destroy]

  def list_admin
    @users = User.all.order(approved: :asc, admin: :desc, email: :asc)

    render json: @users, each_serializer: UserAdminSerializer
  end

  def admin_update
    if @user.update(user_params)
      @users = User.all.order(approved: :asc, admin: :desc, email: :asc)
      render json: @users, each_serializer: UserAdminSerializer
    else
      render json: @user.errors, status: :unprocessable_entity
    end
  end

  def destroy
    if @user.destroy
      @users = User.all.order(approved: :asc, admin: :desc, email: :asc)
      render json: @users, each_serializer: UserAdminSerializer
    else
      render json: @user.errors, status: :unprocessable_entity
    end
  end

  private
    def authenticate_user_admin
      unless user_signed_in? && current_user.admin
        head :forbidden
      end
    end

    def set_user
      @user = User.find(params[:id])
    end

    def user_params
      params.require(:user).permit(:approved, :admin)
    end
end
