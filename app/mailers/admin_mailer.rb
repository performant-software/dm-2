class AdminMailer < Devise::Mailer
  default from: ENV['EMAIL_FROM']
  layout 'mailer'

  def new_user_waiting_for_approval(email)
    @email = email
    recipients = User.is_admin.collect(&:email)
    if recipients.length > 0
      mail(to: recipients, subject: 'New User Awaiting Admin Approval')
    end
  end
end
