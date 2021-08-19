module UserConfirmationMigrationHelper
  # One time migration function for user confirmations
  def self.confirm_approved_users!
    approved_users = User.all.where(:approved => true)
    approved_users.each {|user|
      user.confirm
      user.save
    }
  end
end