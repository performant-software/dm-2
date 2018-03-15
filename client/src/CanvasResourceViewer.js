import React, {Component} from 'react';
import OpenSeadragon from 'openseadragon';
import 'openseadragon-paperjs-overlay';
import paper from 'paper';

export default class CanvasResourceViewer extends Component {
  componentDidMount() {
    const viewer = OpenSeadragon({
      id: 'openseadragon1',
      prefixUrl: 'openseadragon/build/openseadragon/images',
      tileSources: {
        type: 'image',
        url: 'https://upload.wikimedia.org/wikipedia/commons/9/94/USS_Lexington_%28CV-2%29_leaving_San_Diego_on_14_October_1941_%2880-G-416362%29.jpg'
      },
      debugMode: false
    });
      const overlay = viewer.paperjsOverlay();
      let circle = new paper.Path.Circle(new paper.Point(1000, 1000), 200);
      circle.fillColor = 'red';
      overlay.resize();
      overlay.resizecanvas();
  }

  render() {
    return (
      <div id='openseadragon1' style={{ height: '500px' }}></div>
    );
  }
}
