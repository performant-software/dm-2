class ApplicationMailer < ActionMailer::Base
  default from: "DigitalMappa@#{ENV['HOSTNAME']}"
  layout 'mailer'
end
