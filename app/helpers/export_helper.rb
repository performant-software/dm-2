module ExportHelper
  def self.sanitize_filename(filename)
    filename.gsub(/[\x00\/\\:\*\?\"<>\|]/, "_").strip
  end
  def self.get_path(document_id, current_depth)
    # get a relative URL to a document by id, taking into account the current location
    document = Document.find(document_id)
    filename = self.sanitize_filename(document.title).parameterize
    path_segments = ["#{filename}.html"]
    while document[:parent_type] != "Project"
      # back out from the target document until we hit the project root
      document = document.parent
      path_segments.unshift(self.sanitize_filename(document[:title]).parameterize)
    end
    to_project_root = current_depth > 0 ? Array.new(current_depth, "..").join("/") + "/" : ""
    path = to_project_root + path_segments.join("/")
    return path
  end
end
