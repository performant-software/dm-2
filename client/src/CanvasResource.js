import React, { Component } from 'react';
import OpenSeadragon from 'openseadragon';
import { fabric } from 'openseadragon-fabricjs-overlay/fabric/fabric.adapted.js';
import 'openseadragon-fabricjs-overlay';

export default class CanvasResourceViewer extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return false;
  }

  componentDidMount() {
    let tileSource = {
        Image: {
            xmlns: "http://schemas.microsoft.com/deepzoom/2008",
            Url: "http://openseadragon.github.io/example-images/highsmith/highsmith_files/",
            Format: "jpg",
            Overlap: "2",
            TileSize: "256",
            Size: {
                Height: "9221",
                Width:  "7026"
            }
        }
    };
    const viewer = OpenSeadragon({
      id: `openseadragon-${this.props.resourceName}`,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      tileSources: [{
          tileSource: tileSource,
          width: 1,
          y: 0,
          x: 0
      }]
    });
    const overlay = viewer.fabricjsOverlay({scale: 2000});
    viewer.addHandler('update-viewport', function() {
        overlay.resize();
        overlay.resizecanvas();
    });
    this.renderShapes(this.props.debugColor, overlay);
    overlay.fabricCanvas().on('mouse:move', function(options) {
      if (options.target && options.target.highlightId) {
        window.setFocusHighlight(options.target.highlightId);
      }
    })
    window.onresize = function() {
      overlay.resize();
      overlay.resizecanvas();
    };
  }

  renderShapes(color, overlay) {
    // const svgString = '<svg><rect x="-150" y="-150" rx="0" ry="0" width="300" height="300" style="stroke: rgb(0,0,255); stroke-width: 5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(255,255,255); fill-opacity: 0; fill-rule: nonzero; opacity: 1;" transform="translate(1002.5 1152.5)"/></svg>';
    let rect = new fabric.Rect({
      left: 850,
      top: 1000,
      stroke: color,
      strokeWidth: 5,
      fill: 'transparent',
      width: 300,
      height: 300,
      selectable: true,
      highlightId: 'dm_canvas_highlight_' + color
    });
    overlay.fabricCanvas().add(rect);
    // fabric.loadSVGFromString(svgString, function(objects, options) {
    //   console.log(objects);
    //   var obj = fabric.util.groupSVGElements(objects, options);
    //   overlay.fabricCanvas().add(obj).renderAll();
    // });
    // console.log(rect.toSVG());
  }

  render() {
    return (
      <div id={`openseadragon-${this.props.resourceName}`} style={{ height: '448px' }}></div>
    );
  }
}
