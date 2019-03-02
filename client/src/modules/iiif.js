const MAX_IIIF_CANVASES = 1000

export function checkTileSource( tileSource, successCallBack, errorCallback ) {

    // TODO implement this and call before rendering the tile source.

    // is it a valid url?
    // it shouldn't let you put images into the system that you can't reach
    
    // tile source could be a image URL or an info json URI, or a JSON obj
    // if this is a url .. then deref it.. if not, just pass on success
    // http vs https?

    fetch(tileSource).then(response => {
        if (!response.ok) {
            // if it errors out, try appending /info.json on there, see if that helps?
            errorCallback(response.statusText);
        } else {
            successCallBack( )
        }
    })
}

export function parseIIIFManifest(manifestJSON) {
    const manifest = JSON.parse(manifestJSON);
    if( !manifest ) {
        return null
    }
  
    // IIIF presentation 2.1
    let canvasCount = 0
    const sequences = manifest.sequences.map( (sequence) => {
      let sequenceLabel = sequence.label ? sequence.label : 'unnamed sequence'
      let newSequence = { name: sequenceLabel, children: [] }
      if( sequence.canvases ) {
        let canvases = []
        sequence.canvases.forEach( (canvas) => {
          let image = canvas.images ? canvas.images[0] : null
          if( image && 
              image.resource &&
              image.resource.service &&
              image.resource.service["@id"] ) {
              let canvasLabel = canvas.label ? canvas.label : 'unnamed canvas'
              canvasCount++
              canvases.push( {
                  name: canvasLabel,
                  image_info_uri: image.resource.service["@id"]
              })
          }
        });
        newSequence.children = canvases
      } 
      return newSequence
    })
  
    // don't parse this file if it exceeds limits
    if( canvasCount > MAX_IIIF_CANVASES ) {
      console.log("Maximum number of IIIF canvases exceeded.")
      return null
    }

    return sequences;
  }
  