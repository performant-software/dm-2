class Document < Linkable
  belongs_to :project
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :parent, polymorphic: true, optional: true
  has_many :highlights, dependent: :destroy

  def document_id
    self.id
  end

  def highlight_id
    nil
  end

  def highlight_map
    Hash[self.highlights.collect { |highlight| [highlight.uid, highlight]}]
  end
end
