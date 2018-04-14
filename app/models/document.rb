class Document < Linkable
  belongs_to :project
  belongs_to :created_by, class_name: 'User', optional: true
  has_many :highlights

  def document_id
    self.id
  end

  def highlight_id
    nil
  end
end
