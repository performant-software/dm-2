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
end
