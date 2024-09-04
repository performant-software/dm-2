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

module Exportable
  extend ActiveSupport::Concern

  def sanitize_filename(filename)
    filename.gsub(/[\x00\/\\:\*\?\"<>\|]/, "_").strip
  end

  def recursively_deflate_folder(folder, zipfile_path, zipfile, depth)
    zipfile.mkdir(zipfile_path)
    subdir = folder.contents_children
    self.write_zip_entries(subdir, zipfile_path, zipfile, depth + 1)
  end

  def get_path(document_id, current_depth)
    # get a relative URL to a document by id, taking into account the current location
    document = Document.find(document_id)
    filename = sanitize_filename(document.title).parameterize
    path_segments = ["#{filename}.html"]
    while document[:parent_type] != "Project"
      # back out from the target document until we hit the project root
      document = document.parent
      path_segments.unshift(sanitize_filename(document[:title]))
    end
    to_project_root = current_depth > 0 ? Array.new(current_depth, "..").join("/") + "/" : ""
    path = to_project_root + path_segments.join("/")
    return path
  end

  def html_filename(path)
    Pathname.new(path)
    dir, base = path.split
    # use parameterize on basename to produce well-formed URLs
    base = Pathname.new(base.to_s.parameterize)
    path = dir.join(base)
    path = "#{path.to_s}.html"
  end

  def write_zip_entries(entries, path, zipfile, depth)
    entries.each do |child|
      name = sanitize_filename(child.title)
      zipfile_path = path == '' ? name : File.join(path, name)
      if child.instance_of? DocumentFolder
        # create folder AND index entry for folder item
        @index_cursor.push({ title: child.title, children: [] })
        old_index_cursor = @index_cursor
        @index_cursor = @index_cursor[-1][:children]
        self.recursively_deflate_folder(child, zipfile_path, zipfile, depth)
        @index_cursor = old_index_cursor   
      elsif child.contents_children.length() > 0
        # folder, but no index entry, should be created for non-folder item with children
        self.recursively_deflate_folder(child, zipfile_path, zipfile, depth)
      end
      if not child.instance_of? DocumentFolder
        # create an html file for all non-folder items
        zipfile_path = html_filename(zipfile_pth)
        zipfile.get_output_stream(zipfile_path) { |html_outfile|
          html_outfile.write('<head><style type="text/css">body { font-family: Roboto, sans-serif; }</style></head>')
          html_outfile.write("<body>")
          if child.document_kind == "canvas"
            # images page
            if child[:content] && child[:content]["tileSources"]
              for img_url in child.image_urls
                html_outfile.write("#{img_url}<br />")
              end
            else
              for img_url in child.image_urls
                html_outfile.write("<img src=\"#{img_url}\" /><br />")
              end
            end
          elsif child.document_kind == "text"
            # text page
            # TODO: handle multicolumn layout
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

            html = renderer.render(child[:content])
            html_outfile.write(html)
          else
            # TODO: determine if there are any of these
            html_outfile.write(child.document_kind)
          end

          # add highlights to footer
          if child.highlight_map.present?
            styles = []
            html_outfile.write("<footer><ol>")
            child.highlight_map.each do |highlight|
              # list of links on highlight
              html_outfile.write("<li id=\"#{highlight[0]}\">#{highlight[1].title || highlight[1].excerpt}")
              html_outfile.write("<ol>")
              highlight[1].links_to.each do |link|
                if link[:document_id].present?
                  html_outfile.write("<li><a href=\"#{get_path(link[:document_id], depth)}\">#{link[:title]}</a></li>")
                else
                  html_outfile.write("<li>#{link[:title]}</li>")  
                end
              end
              html_outfile.write("</ol>")
              html_outfile.write("</li>")
              # add style
              styles << "a[class*=\"#{highlight[0]}\"] { color: black; background-color: #{highlight[1].color}; }"
            end
            html_outfile.write("</ol></footer>")
            html_outfile.write("<style type=\"text/css\">#{styles.join("\n")}</style>")
          end
          html_outfile.write("</body>")
        }
        if ["DocumentFolder", "Project"].include? child.parent_type
          # only add direct descendants of project or folder to index
          @index_cursor.push({ title: child.title, href: zipfile_path })
        end
      end
    end
  end

  def render_template_to_string(template_path, data)
    lookup_context = ActionView::LookupContext.new(ActionController::Base.view_paths)
    context = ActionView::Base.with_empty_template_cache.new(lookup_context, data, nil)
    renderer = ActionView::Renderer.new(lookup_context)
    renderer.render(context, { inline: File.read(template_path) })
  end

  def export
    @index = { children: [], title: self.title }
    @index_cursor = @index[:children]

    # t = Tempfile.new("#{sanitize_filename(self.title)}.zip")
    # path = t.path

    path = "/Users/ben/Downloads/#{sanitize_filename(self.title)}-#{Time.now.to_s}.zip"

    Zip::File.open(path, ::Zip::File::CREATE) do |zipfile|
      self.write_zip_entries(self.contents_children, '', zipfile, depth=0)
      html = render_template_to_string(
        Rails.root.join("app", "views", "exports", "index.html.erb"),
        { index: @index },
      )
      zipfile.get_output_stream("index.html") { |index_html|
        index_html.write(html)
      }
    end
  end
end
