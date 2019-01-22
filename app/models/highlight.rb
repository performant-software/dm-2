class Highlight < Linkable
  belongs_to :document, touch: true

  def highlight_id
    self.id
  end

  def document_title
    self.document ? self.document.title : '[unidentified document]'
  end

  def document_kind
    self.document ? self.document.document_kind : 'unknown'
  end

  def project
    self.document ? self.document.project : nil
  end

  def to_obj
    {
      id: self.id,
      highlight_id: self.highlight_id,
      document_id: self.document_id,
      document_kind: self.document_kind,
      excerpt: self.excerpt,
      color: self.color,
      thumbnail_url: self.thumbnail_url
    }
  end
end
