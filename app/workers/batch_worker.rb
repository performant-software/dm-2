class BatchWorker
  include Sidekiq::Worker
  include Sidekiq::Status::Worker

  def perform(new_document_params, images, current_user_id)
    @document = Document.new(new_document_params)
    @document.adjust_lock( User.find(current_user_id), false )

    if !images.nil? && images.length() > 0
      @document.images.attach(images)
      image = @document.images[0]
      imagetitle, _, _ = image.filename.to_s.rpartition('.')
      @document.title = imagetitle
    end
    @document.add_thumbnail(url_for(@document.images[0]))
    @document.save!
  end
end
