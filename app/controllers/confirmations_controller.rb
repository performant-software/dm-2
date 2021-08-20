class ConfirmationsController < DeviseTokenAuth::ConfirmationsController
  def complete_confirmation
    render json: params, status: 200
  end
end