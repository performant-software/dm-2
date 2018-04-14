class Highlight < Linkable
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :document

  def highlight_id
    self.id
  end
end
