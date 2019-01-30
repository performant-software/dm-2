class ApplicationController < ActionController::API
  include DeviseTokenAuth::Concerns::SetUserByToken
  include ActionController::MimeResponds

  before_action :configure_permitted_parameters, if: :devise_controller?

  def fallback_index_html
    respond_to do |format|
      format.html { render body: Rails.root.join('public/index.html').read }
    end
  end
  

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name])
  end

  def validate_user_approved
    if user_signed_in? && current_user.approved?
      return true
    else
      head :forbidden
    end
    false
  end

  def validate_user_read(project,check_only=false)
    if project.public? || (user_signed_in? && current_user.approved? && (current_user.admin? || project.can_read.exists?(:id => current_user.id)))
      return true
    else
      return false if check_only
      head :forbidden
    end
    false
  end

  def validate_user_write(project)
    if user_signed_in? && current_user.approved? && (current_user.admin? || project.can_write.exists?(:id => current_user.id))
      return true
    else
      head :forbidden
    end
    false
  end

  def validate_document_lock(document)
    if document.locked_by == nil || document.locked_by.id != current_user.id
      head :fobidden
      return false
    else
      return true
    end
  end

  def validate_user_admin(project)
    if user_signed_in? && current_user.approved? && (current_user.admin? || project.can_admin.exists?(:id => current_user.id))
      return true
    else
      head :forbidden
    end
    false
  end
end
