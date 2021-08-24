const MAX_IIIF_CANVASES = 250;

export function checkTileSource(tileSource, successCallBack, errorCallback) {
  const retryWithInfoJSON = function (initialResponse) {
    const withInfoJson = `${tileSource}/info.json`;
    fetch(withInfoJson).then((response) => {
      if (response.ok) {
        console.log(`Found image info at: ${withInfoJson}`);
        successCallBack(withInfoJson);
      } else {
        errorCallback(response.statusText);
      }
    });
  };

  fetch(tileSource).then((response) => {
    if (!response.ok) {
      console.log(response.statusText);
      retryWithInfoJSON(response);
    } else {
      successCallBack(tileSource);
    }
  }).catch((e) => {
    console.error(e);
    retryWithInfoJSON(e);
  });
}

export function parseIIIFManifest(manifestJSON) {
  const manifest = JSON.parse(manifestJSON);
  if (!manifest) {
    return null;
  }

  // IIIF presentation 2.1
  let canvasCount = 0;
  const sequences = manifest.sequences.map((sequence) => {
    const sequenceLabel = sequence.label ? sequence.label : 'unnamed sequence';
    const newSequence = { name: sequenceLabel, children: [] };
    if (sequence.canvases) {
      const canvases = [];
      sequence.canvases.forEach((canvas) => {
        const image = canvas.images ? canvas.images[0] : null;
        if (image
              && image.resource
              && image.resource.service
              && image.resource.service['@id']) {
          const canvasLabel = canvas.label ? canvas.label : 'unnamed canvas';
          canvasCount++;
          canvases.push({
            name: canvasLabel,
            image_info_uri: image.resource.service['@id'],
          });
        }
      });
      newSequence.children = canvases;
    }
    return newSequence;
  });

  // don't parse this file if it exceeds limits
  if (canvasCount > MAX_IIIF_CANVASES) {
    console.log('Maximum number of IIIF canvases exceeded.');
    return null;
  }

  return sequences;
}
