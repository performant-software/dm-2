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
    filename.gsub(/[\x00\/\\:\*\?\"<>\|]/, "_")
  end

  def recursively_deflate_folder(folder, zipfile, zipfile_path, index_html, depth)
    zipfile.mkdir(zipfile_path)
    subdir = folder.contents_children
    self.write_zip_entries(subdir, zipfile_path, zipfile, index_html, depth + 1)
  end

  def get_path(document_id, current_depth)
    document = Document.find(document_id)
    filename = sanitize_filename(document.title).strip.parameterize
    path_segments = ["#{filename}.html"]
    while document[:parent_type] != "Project"
      document = document.parent
      path_segments.unshift(sanitize_filename(document[:title]).strip)
    end
    back_out = current_depth > 0 ? Array.new(current_depth, "..").join("/") + "/" : ""
    path = back_out + path_segments.join("/")
    return path
  end

  def write_zip_entries(entries, path, zipfile, index_html, depth)
    entries.each do |child|
      name = sanitize_filename(child.title).strip
      zipfile_path = path == '' ? name : File.join(path, name)
      if child.instance_of? DocumentFolder or child.contents_children.length() > 0
        index_html.write("<li><details><summary>#{child.title}</summary>")
        index_html.write("<ol>")
        self.recursively_deflate_folder(child, zipfile, zipfile_path, index_html, depth)
        index_html.write("</ol></details></li>")
      end
      if not child.instance_of? DocumentFolder
        # use parameterize on basename to produce well-formed URLs
        zipfile_path = Pathname.new(zipfile_path)
        dir, base = zipfile_path.split
        base = Pathname.new(base.to_s.parameterize)
        zipfile_path = dir.join(base)
        zipfile_path = "#{zipfile_path.to_s}.html"

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
        index_html.write("<li><a href=\"#{zipfile_path}\">#{child.title}</a></li>")
      end
    end
  end
  
  def front_matter
    [
      '<style type="text/css">body { font-family: Roboto, sans-serif; }</style>',
      "<body>",
      "<h1>#{self.title}</h1>",
      "<nav>",
      "<h2>Table of Contents</h2>",
      "<ol>",
    ]
  end

  def export
    # t = Tempfile.new("#{sanitize_filename(self.title).strip}.zip")
    # path = t.path
    path = "/Users/ben/Downloads/#{sanitize_filename(self.title).strip}.zip"
    Zip::File.open(path, ::Zip::File::CREATE) do |zipfile|
      zipfile.get_output_stream("index.html") { |index_html|
        for tag in self.front_matter
          index_html.write(tag)
        end
        self.write_zip_entries(self.contents_children, '', zipfile, index_html, depth=0)
        index_html.write("</ol>")
        index_html.write("</nav>")
        index_html.write("</body>")
      }
    end
  end
end