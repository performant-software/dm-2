class ProjectsController < ApplicationController
  before_action :set_project, only: [:show, :update, :destroy, :search, :check_in, :move_many, :create_export, :exports]
  before_action :validate_user_approved, only: [:create]

  before_action only: [:update, :destroy, :create_export] do
    validate_user_admin(@project)
  end

  # GET /projects
  def index
    # @projects = Project.all.order(updated_at: :desc)
    if user_signed_in? && current_user.approved?
      if current_user.admin
        @projects = Project.all
      else
        @projects = Project.is_public | current_user.readable_projects
      end
    else
      @projects = Project.is_public
    end

    render json: @projects
  end

  # GET /projects/1
  def show
    if validate_user_read(@project,true)
      render json: @project, include: ['user_project_permissions', 'user_project_permissions.user', 'contents_children', 'can_admin'], scope_name: :current_user
    else
      render json: { forbidden: true }
    end
  end

  # POST /projects
  def create
    @project = Project.new(project_params)
    @project.owner = current_user

    if @project.save
      UserProjectPermission.create(project: @project, user: current_user, permission: 'admin')
      render json: @project, include: ['user_project_permissions', 'user_project_permissions.user', 'contents_children', 'can_admin'], status: :created, location: @project
    else
      render json: @project.errors, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /projects/1
  def update
    if @project.update(project_params)
      render json: @project, include: ['user_project_permissions', 'user_project_permissions.user', 'contents_children', 'can_admin']
    else
      render json: @project.errors, status: :unprocessable_entity
    end
  end

  # DELETE /projects/1
  def destroy
    @project.destroy
  end

  # GET /projects/1/search?search_phrase
  def search
    documents = Document.where( project_id: params['id'] )
    results = documents.search_for( params['q'] ).limit(100)
    render json: results.map { |result| result.to_obj }
  end

  # GET /projects/1/check_in
  def check_in
    checked_in_doc_ids = @project.check_in_all(current_user)
    render json: { checked_in_docs: checked_in_doc_ids }
  end

  # GET /projects/1/exports
  def exports
    # completed exports
    @exports = @project.exports.collect do |exp|
      {
        :id => exp.id,
        :updated_at => exp.created_at,
        :status => "Complete",
        :url => Rails.application.routes.url_helpers.rails_blob_url(exp),
      }
    end
    # queued exports
    queues = Sidekiq::Queue.all
    queues.each do |queue|
      queue.each do |job|
        if job.klass == "ExportProjectWorker" and job.args[0].to_i == @project.id
          @exports.push({
            :id => job.jid,
            :status => "Queued",
            :updated_at => job.created_at,
          })
        end
      end
    end
    # in progress exports
    worker_set = Sidekiq::WorkSet.new
    worker_set.each do |_, _, worker|
      if worker.is_a? Hash and worker["payload"]["class"] == "ExportProjectWorker" and worker["payload"]["args"][0].to_i == @project.id
        exp = {
          :id => worker["payload"]["jid"],
          :updated_at => Time.at(worker["payload"]["created_at"]),
          :status => "In progress",
        }
        status = Sidekiq::Status.get_all worker["payload"]["jid"]
        if status
          exp[:status] = "In progress (#{status['pct_complete']}%)"
          exp[:updated_at] = Time.at(status["update_time"].to_f)
        end
        @exports.push(exp)
      end
    end
    # errored exports
    dead_set = Sidekiq::DeadSet.new
    dead_set.each do |job|
      if job.klass == "ExportProjectWorker" and job.args[0].to_i == @project.id
        @exports.push({
          :id => job.jid,
          :status => "Failed",
          :updated_at => job.created_at,
          :error_message => job.item["error_message"],
          :error_class => job.item["error_class"],
        })
      end
    end
    render json: @exports.sort_by { |hsh| hsh[:updated_at] }.reverse, status: 200
  end

  # POST /projects/1/create_export
  def create_export
    job_id = ExportProjectWorker.perform_async(@project.id)
    @job = { id: job_id }
    if @job
      render json: @job, status: 202
    else
      render status: 500
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_project
      @project = Project.find(params[:id])
    end

    # Only allow a trusted parameter "white list" through.
    def project_params
      params.require(:project).permit(:title, :description, :public, :owner_id)
    end
end
