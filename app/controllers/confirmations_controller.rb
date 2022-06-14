class ConfirmationsController < DeviseTokenAuth::ConfirmationsController
  def create
    unless resource_params[:email]
      return render json: {
        success: false,
        errors: ['You must provide an email address.']
      }, status: 400
    end

    if resource_class.case_insensitive_keys.include?(:email)
      email = resource_params[:email].downcase
    else
      email = resource_params[:email]
    end

    q = "uid = ? AND provider='email'"

    @resource = resource_class.where(q, email).first

    errors = nil

    if @resource
      if !@resource.confirmed?
        @resource.send_confirmation_instructions({
          redirect_url: "#{ENV['PROTOCOL'] || 'http'}://#{ENV['HOSTNAME']}/confirmed"
        })
      else
        errors = ["User with email '#{email} already confirmed."]
      end
    else
      errors = ["Unable to find user with email '#{email}'."]
    end

    if errors
      render json: {
        success: false,
        errors: errors
      }, status: 400
    else
      render json: {
        status: 'success',
        data:   @resource.as_json
      }
    end

  end
  def complete_confirmation
    render json: params, status: 200
  end
end