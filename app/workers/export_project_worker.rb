require 'zip'
require 'storyblok/richtext'
require 'storyblok_richtext/marks/color'
require 'storyblok_richtext/marks/em'
require 'storyblok_richtext/marks/font_family'
require 'storyblok_richtext/marks/font_size'
require 'storyblok_richtext/marks/highlight'
require 'storyblok_richtext/marks/strikethrough'
require 'storyblok_richtext/marks/text_style'
require 'storyblok_richtext/nodes/image'
require 'storyblok_richtext/nodes/paragraph'
require 'storyblok_richtext/nodes/table'
require 'storyblok_richtext/nodes/table_cell'
require 'storyblok_richtext/nodes/table_header'
require 'storyblok_richtext/nodes/table_row'
require 'table_saw'
require 'table_saw/create_dump_file'

class ViewContext < ActionView::Base
  # required to prevent template cache bug; see
  # https://github.com/rails/rails/issues/40613#issuecomment-900192395
  def compiled_method_container
    self.class
  end
end

class ExportProjectWorker
  include Sidekiq::Worker
  include Sidekiq::Status::Worker
  sidekiq_options :retry => 0

  def perform(project_id)
    @project = Project.find(project_id.to_i)
    if @project.present?
      self.export
    end
  end

  def export
    # main export function: set up, create zipfile, write entries, attach zipfile
    @index = { children: [], title: @project.title }
    @index_cursor = @index[:children]
    @errors = []
    total Document.where(:project_id => @project.id).count
    @current = 0

    # create tempfile
    filename = "#{ExportHelper.sanitize_filename(@project.title)}.zip"
    tempfile = Tempfile.new(filename)
    path = tempfile.path

    begin
      Zip::OutputStream.open(tempfile) { |zos| }
      # write entries to zip
      Zip::File.open(path, ::Zip::File::CREATE) do |zipfile|
        self.write_zip_entries(@project.contents_children, '', zipfile, depth=0)
        html = render_template_to_string(
          Rails.root.join("app", "views", "exports", "index.html.erb"),
          { index: @index },
        )
        zipfile.get_output_stream("index.html") { |index_html|
          index_html.write(html)
        }
        if @errors.length > 0
          # output to error log if there are any errors
          zipfile.get_output_stream("error_log.txt") { |errlog_txt|
            errlog_txt.write(@errors.join("\r\n"))
          }
        end
        # prep sql dump
        records = self.get_sql_records()
        sqldump_outfile = Tempfile.new("sql.dump")
        TableSaw::CreateDumpFile.new(
          records, output: sqldump_outfile.path, format: { "type" => "copy" }
        ).call
        # write sql dump to zip
        zipfile.add("sql.dump", sqldump_outfile.path)
        zipfile.commit
      end
      zip_data = File.open(tempfile.path)
      # attach to project (create blob and upload to storage)
      @project.exports.attach(io: zip_data, filename: filename, content_type: 'application/zip')
    ensure
      tempfile.close
      tempfile.unlink
    end
  end

  def write_zip_entries(entries, path, zipfile, depth)
    # handle each entry in @project.contents_children
    entries.each do |child|
      name = ExportHelper.sanitize_filename(child.title).parameterize
      zipfile_path = path == '' ? name : File.join(path, name)
      if child.instance_of? DocumentFolder
        # folder item: create filesystem folder AND index entry
        @index_cursor.push({ title: child.title, children: [] })
        old_index_cursor = @index_cursor
        @index_cursor = @index_cursor[-1][:children]
        self.recursively_deflate_folder(child, zipfile_path, zipfile, depth)
        @index_cursor = old_index_cursor
      elsif child.contents_children.length() > 0
        # non-folder item w/ children: create filesystem folder, but no index entry
        self.recursively_deflate_folder(child, zipfile_path, zipfile, depth)
      end
      if not child.instance_of? DocumentFolder
        # prepare a path for images in case there are any
        images_path = Pathname.new(zipfile_path).split()[0].to_s + "/images"
        # create an html file for all non-folder items
        zipfile_path = html_filename(zipfile_path)

        if child.document_kind == "text"
          # text page
          # render text documents from prosemirror/storyblok to html
          renderer = Storyblok::Richtext::HtmlRenderer.new
          renderer.add_mark(Storyblok::Richtext::Marks::Color)
          renderer.add_mark(Storyblok::Richtext::Marks::Em)
          renderer.add_mark(Storyblok::Richtext::Marks::FontFamily)
          renderer.add_mark(Storyblok::Richtext::Marks::FontSize)
          renderer.add_mark(Storyblok::Richtext::Marks::Highlight)
          renderer.add_mark(Storyblok::Richtext::Marks::Strikethrough)
          renderer.add_mark(Storyblok::Richtext::Marks::TextStyle)
          renderer.add_node(Storyblok::Richtext::Nodes::Image)
          renderer.add_node(Storyblok::Richtext::Nodes::Paragraph)
          renderer.add_node(Storyblok::Richtext::Nodes::Table)
          renderer.add_node(Storyblok::Richtext::Nodes::TableCell)
          renderer.add_node(Storyblok::Richtext::Nodes::TableHeader)
          renderer.add_node(Storyblok::Richtext::Nodes::TableRow)

          content = renderer.render(child[:content])
        else
          images = download_images(child, zipfile, images_path)
          svg_highlights = ExportHelper.fabric_to_svg(child.highlight_map)
          content = nil
        end
        html = render_template_to_string(
          Rails.root.join("app", "views", "exports", "page.html.erb"),
          {
            highlights: ExportHelper.order_highlights(
              child.highlight_map, child.document_kind, content,
            ),
            images: (images || []),
            svg_highlights: (svg_highlights || []),
            content: (content || "").html_safe,
            document_kind: child.document_kind,
            depth: depth,
            title: child.title,
            # handle multicolumn layout and margins
            style: {
              column_count: child[:content]["columnCount"].present? ? child[:content]["columnCount"] : 1,
              margin_top: child[:content]["marginTop"].present? ? child[:content]["marginTop"] : 0,
              margin_right: child[:content]["marginRight"].present? ? child[:content]["marginRight"] : 0,
              margin_bottom: child[:content]["marginBottom"].present? ? child[:content]["marginBottom"] : 0,
              margin_left: child[:content]["marginLeft"].present? ? child[:content]["marginLeft"] : 0,
            }
          },
        )
        @current += 1
        at @current
        zipfile.get_output_stream(zipfile_path) { |html_outfile|
          html_outfile.write(html)
        }
        if ["DocumentFolder", "Project"].include? child.parent_type
          # only add direct descendants of project or folder to index
          @index_cursor.push({ title: child.title, href: zipfile_path })
        end
      end
    end
  end

  def recursively_deflate_folder(folder, zipfile_path, zipfile, depth)
    # from rubyzip docs https://github.com/rubyzip/rubyzip
    zipfile.mkdir(zipfile_path)
    subdir = folder.contents_children
    self.write_zip_entries(subdir, zipfile_path, zipfile, depth + 1)
  end

  def html_filename(path)
    path = Pathname.new(path)
    dir, base = path.split
    # use parameterize on basename to produce well-formed URLs
    base = Pathname.new(base.to_s.parameterize)
    path = dir.join(base)
    "#{path.to_s}.html"
  end

  def download_images(doc, zipfile, images_path)
    # download all images and store in zip file;
    # return a list of hashes of their relative urls and names
    images = []
    doc_images = doc.image_urls
    doc_images = doc.content["tileSources"] if doc.content["tileSources"].present?
    if doc_images.present? and doc_images.length > 0
      begin
        # make the images directory
        zipfile.mkdir(images_path)
      rescue Errno::EEXIST
        # ignore error if it already exists
      end
    end
    dupe_filename_count = 0
    doc_images.each { |tileSource|
      # try to get url and name for every image
      name = nil
      if tileSource.is_a?(String)
        url = tileSource
      else
        url = tileSource["url"]
        name = tileSource["name"]
      end
      if url.present?
        if name.nil? && !doc.content["iiifTileNames"].nil? && doc.content["iiifTileNames"].length > 0
          # get name from iiifTileNames, if possible
          doc.content["iiifTileNames"].each {|tile_name_obj|
            if tile_name_obj["url"] == url && tile_name_obj.has_key?("name")
              name = tile_name_obj["name"]
            end
          }
        elsif name.nil?
          # otherwise just use filename without extension
          name = url.rpartition('/').last.rpartition('.').first.sub("%20", " ")
        end
        begin
          # attempt to open url
          stream = URI.open(url, :read_timeout => 10)
          if stream.content_type.include? "json"
            # get max resolution from iiif json
            url.sub!("/info.json", "")
            url = "#{url}/full/max/0/default.jpg"
          end

          # download file
          file = DownloadHelper.download_to_file(url)
          if file == "failed"
            @errors.push("Error: Failed to download image #{url}, to be stored in #{images_path}")
            next
          end
          # determine dimensions and get scale factor for svg display
          image_dims = MiniMagick::Image.open(file.path)
          scale_factor = 2000.0 / image_dims[:width]
          # construct local file path
          filename = "#{name.parameterize}.#{url.rpartition('.').last}"
          path = "#{images_path}/#{filename}"
          begin
            # add to zip
            zipfile.add(path, file.path)
          rescue Zip::EntryExistsError
            # handle duplicate filenames by adding numbers to the end
            while not zipfile.find_entry(path).nil?
              dupe_filename_count += 1
              path_parts = path.rpartition(".")
              new_filename = path_parts.first + "-" + dupe_filename_count.to_s
              path = "#{new_filename}.#{path_parts.last}"
            end
            zipfile.add(path, file.path)
          end
          # have to "commit" so that tempfile is zipped before it is deleted
          zipfile.commit
          # parameterize final filename
          filename = path.rpartition("/").last
          fn_parts = filename.rpartition(".")
          filename = [fn_parts.first.parameterize, *fn_parts[1..-1]].join("")
          # add to array of hashes
          images.push({
            url: "images/#{filename}",
            name: name,
            height: image_dims[:height] * scale_factor,
          })
        rescue Net::ReadTimeout, OpenURI::HTTPError
          @errors.push("Error: Failed to download image #{url}, to be stored in #{images_path}")
        end
      end
    }
    return images
  end

  def render_template_to_string(template_path, data)
    # helper function to render a template to string outside of controller
    lookup_context = ActionView::LookupContext.new(ActionController::Base.view_paths)
    context = ViewContext.new(lookup_context, data, nil)
    renderer = ActionView::Renderer.new(lookup_context)
    renderer.render(context, { inline: File.read(template_path) })
  end

  def get_sql_records
    manifest = {
      "variables" => { "project_id" => @project.id },
      "tables" => [
        {
          "table" => "projects",
          "query" => "select * from projects where id = %{project_id}",
          "has_many" => ["document_folders", "documents"]
        },
        {
          "table" => "document_folders",
          "query" => "select * from document_folders where project_id = %{project_id}",
        },
        {
          "table" => "documents",
          "query" => "select * from documents where project_id = %{project_id}",
          "has_many" => ["documents_links", "highlights"]
        },
        {
          "table" => "documents_links",
          "query" => "select * from documents_links where document_id in (select id from documents where project_id = %{project_id})",
        },
        {
          "table" => "highlights",
          "query" => "select * from highlights where document_id in (select id from documents where project_id = %{project_id})",
        },
        {
          "table" => "links",
          "query" => "select * from links where id in (select link_id from documents_links where document_id in (select id from documents where project_id = %{project_id}))",
        },
      ],
    }
    manifest_yml = Tempfile.new("manifest.yml")
    File.write(manifest_yml.path, manifest.to_yaml)
    dbname = ENV["DATABASE_URL"] ? ENV["DATABASE_URL"].split('/')[-1] : Project.connection.current_database
    TableSaw.configure({
      manifest: manifest_yml.path,
      dbname: dbname,
    })
    TableSaw::DependencyGraph::Build.new(TableSaw::Manifest.instance).call
  end
end
