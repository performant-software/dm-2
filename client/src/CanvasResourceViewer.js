import React, {Component} from 'react';
import OpenSeadragon from 'openseadragon';
// import Annotations from 'openseadragon-annotations';
import paper from 'paper';
import paperjsOverlay from 'openseadragon-paperjs-overlay';

export default class CanvasResourceViewer extends Component {
  componentDidMount() {
    const viewer = OpenSeadragon({
      id: 'openseadragon1',
      prefixUrl: 'img/openseadragon',
      tileSources: {
        type: 'image',
        url: 'https://upload.wikimedia.org/wikipedia/commons/9/94/USS_Lexington_%28CV-2%29_leaving_San_Diego_on_14_October_1941_%2880-G-416362%29.jpg'
      },
      debugMode: true
    });
    // new OpenSeadragon.Annotations({ viewer });
  }

  render() {
    return (
      <div id='openseadragon1' style={{ height: '500px' }}></div>
    );
  }
}
