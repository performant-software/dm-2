const MAX_IIIF_CANVASES = 1000

export function checkTileSource( tileSource, isImageInfoURI, successCallBack, errorCallback ) {
  fetch(tileSource).then(response => {
      if (!response.ok) {
        // if it isn't ok, try again with info.json if this is an info uri
        if( isImageInfoURI ) {
          const initialResponse = response
          const withInfoJson = tileSource+'/info.json'
          fetch(withInfoJson).then(response => {
            if( response.ok ) {
              console.log(`Found image info at: ${withInfoJson}`)
              successCallBack( withInfoJson )
            } else {
              errorCallback(initialResponse.statusText)
            }            
          })
        }
        else {
          errorCallback(response.statusText)
        }
      } else {
        successCallBack( tileSource )
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
  