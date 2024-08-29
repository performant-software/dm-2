# content security policy (CSP) settings for the application
Rails.application.config.content_security_policy do |policy|
  # allow all sites as frame_ancestors in order to allow iframe embeds
  policy.frame_ancestors :self, "*"
end
