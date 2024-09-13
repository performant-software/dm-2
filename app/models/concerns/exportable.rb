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

module Exportable
  extend ActiveSupport::Concern

  def recursively_deflate_folder(folder, zipfile_path, zipfile, depth)
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

  def write_zip_entries(entries, path, zipfile, depth)
    entries.each do |child|
      name = ExportHelper.sanitize_filename(child.title).parameterize
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
        zipfile_path = html_filename(zipfile_path)

        if child.document_kind == "text"
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
          renderer.add_node(Storyblok::Richtext::Nodes::Table)
          renderer.add_node(Storyblok::Richtext::Nodes::TableCell)
          renderer.add_node(Storyblok::Richtext::Nodes::TableHeader)
          renderer.add_node(Storyblok::Richtext::Nodes::TableRow)

          content = renderer.render(child[:content])
        end

        html = render_template_to_string(
          Rails.root.join("app", "views", "exports", "page.html.erb"),
          {
            highlights: child.highlight_map,
            images: child.image_urls,
            content: (content || "").html_safe,
            depth: depth,
          },
        )
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

  def render_template_to_string(template_path, data)
    lookup_context = ActionView::LookupContext.new(ActionController::Base.view_paths)
    context = ActionView::Base.with_empty_template_cache.new(lookup_context, data, nil)
    renderer = ActionView::Renderer.new(lookup_context)
    renderer.render(context, { inline: File.read(template_path) })
  end

  def export
    @index = { children: [], title: self.title }
    @index_cursor = @index[:children]

    # t = Tempfile.new("#{ExportHelper.sanitize_filename(self.title)}.zip")
    # path = t.path

    path = "/Users/ben/Downloads/#{ExportHelper.sanitize_filename(self.title)}-#{Time.now.to_s}.zip"

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
