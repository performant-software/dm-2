class Document < Linkable
  belongs_to :project, touch: true
  belongs_to :created_by, class_name: 'User', optional: true
  belongs_to :parent, polymorphic: true, optional: true
  has_many :highlights, dependent: :destroy

  def document_id
    self.id
  end

  def document_title
    self.title
  end

  def highlight_id
    nil
  end

  def excerpt
    nil
  end

  def color
    nil
  end

  def highlight_map
    Hash[self.highlights.collect { |highlight| [highlight.uid, highlight]}]
  end
end
