module ExportHelper
  def self.sanitize_filename(filename)
    filename.gsub(/[\x00\/\\:\*\?\"<>\|]/, "_").strip
  end

  def self.get_path(link, current_depth)
    document_id = link[:document_id]
    highlight_uid = link[:highlight_uid]
    # get a relative URL to a document by id, taking into account the current location
    begin
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
      if highlight_uid.present?
        # append #highlight_uid to url if present in order to target the highlight
        path = "#{path}#highlight-#{highlight_uid}"
      end
      return path
    rescue ActiveRecord::RecordNotFound
      return "#"
    end
  end

  def self.get_svg_styles(obj)
    # convert fabric object style properties to css
    styles = [
      "stroke: #{obj['stroke']};",
      "fill: #{obj['fill'] || 'transparent'};",
      "stroke-width: 3px;",
      "stroke-linecap: #{obj['strokeLineCap'] || 'butt'};",
      "stroke-dashoffset: #{obj['strokeDashOffset'] || '0'};",
      "stroke-linejoin: #{obj['strokeLineJoin'] || 'miter'};",
      "stroke-miterlimit: #{obj['strokeMiterLimit'] || '4'};",
      "opacity: #{obj['opacity'] || '1'};",
      "visibility: #{obj['visible'] ? 'visible' : 'hidden'};",
    ]
    styles.push("stroke-dasharray: #{obj['strokeDashArray']};") if obj['strokeDashArray']
    styles.join(" ")
  end

  def self.get_svg_path(paths)
    # convert fabric object path property to svg path
    path = ''
    paths.each_with_index do |ls, i|
      path += " " unless i == 0
      if ls[0] == "C"
        # C x1 y1, x2 y2, x y
        path += "#{ls[0]} #{ls[1]} #{ls[2]}, #{ls[3]} #{ls[4]}, #{ls[5]} #{ls[6]}"
      elsif ls[0] == "S" or ls[0] == "Q"
        # S x2 y2, x y || Q x1 y1, x y
        path += "#{ls[0]} #{ls[1]} #{ls[2]}, #{ls[3]} #{ls[4]}"
      else
        # M x y || L x y || T x y, etc
        path += ls.join(" ")
      end
    end
    path
  end

  def self.fabric_to_svg(highlights)
    # convert image annotation highlights (fabric objects) to svgs
    svgs = []
    highlights.each do |uid, hl|
      svg_hash = JSON.parse(hl[:target])
      elm = "#{svg_hash['type']}"
      if svg_hash["path"]
        # path
        elm += " d=\"#{self.get_svg_path(svg_hash['path'])}\""
      elsif svg_hash["points"]
        # polyline
        elm += ' points="'
        elm += svg_hash["points"].map { |pt| "#{pt['x']},#{pt['y']}" }.join(" ")
        elm += '"'
      elsif svg_hash["type"] == "circle"
        # circle
        elm += " r=\"#{svg_hash['radius']}\""
        cx = svg_hash["left"]
        cy = svg_hash["top"]
        if svg_hash["originX"] == "left"
          cx += svg_hash["radius"]
          cy += svg_hash["radius"]
        end
        elm += " cx=\"#{cx}\" cy=\"#{cy}\""
      elsif svg_hash["type"] == "rect"
        # rect
        elm += " x=\"#{svg_hash['left']}\" y=\"#{svg_hash['top']}\""
        elm += " width=\"#{svg_hash['width']}\" height=\"#{svg_hash['height']}\""
      end
      # common styles
      elm += " style=\"#{self.get_svg_styles(svg_hash)}\""
      svg_elm = "<#{elm} vector-effect=\"non-scaling-stroke\" />"
      # add link to highlight in footer
      svgs.push("<a id=\"highlight-#{uid}\" href=\"##{uid}\">#{svg_elm}</a>")
    end
    return svgs
  end
end
