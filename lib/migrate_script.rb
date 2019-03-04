 # one time migration script
 def migrate_to_https!
    documents = Document.where(document_kind: 'canvas')
    documents.each { |document|
      content = document.content
      if content["tileSources"] 
        changed = false
        content["tileSources"].each { |tileSource|
          url = tileSource["url"]
          if url && url.match?(/http:/)
            tileSource["url"] = url.sub(/http:/,'https:')
            changed = true
          end
        }
        document.save! if changed
      end
    }
  end