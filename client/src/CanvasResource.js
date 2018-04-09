import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { addHighlight } from './modules/resourceGrid';
import OpenSeadragon from 'openseadragon';
import { fabric } from 'openseadragon-fabricjs-overlay/fabric/fabric.adapted.js';
import 'openseadragon-fabricjs-overlay';

class CanvasResource extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    return false;
  }

  componentDidMount() {
    const {content, highlights} = this.props;

    const tileSource = content;
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
    const overlay = this.overlay = viewer.fabricjsOverlay({scale: 2000});
    viewer.addHandler('update-viewport', function() {
      overlay.resize();
      overlay.resizecanvas();
    });
    this.renderHighlights(this.overlay, highlights);
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

  renderHighlights(overlay, highlights) {
    const { resourceId } = this.props;
    // const svgString = '<svg><rect x="-150" y="-150" rx="0" ry="0" width="300" height="300" style="stroke: rgb(0,0,255); stroke-width: 5; stroke-dasharray: none; stroke-linecap: butt; stroke-linejoin: miter; stroke-miterlimit: 10; fill: rgb(255,255,255); fill-opacity: 0; fill-rule: nonzero; opacity: 1;" transform="translate(1002.5 1152.5)"/></svg>';
    // const jsonString = '{"objects":[{"type":"rect","originX":"left","originY":"top","left":850,"top":1000,"width":300,"height":300,"fill":"transparent","stroke":"blue","strokeWidth":5,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":0,"ry":0}]}';
    // let rect = new fabric.Rect({
    //   left: 850,
    //   top: 1000,
    //   stroke: color,
    //   strokeWidth: 5,
    //   fill: 'transparent',
    //   width: 300,
    //   height: 300,
    //   selectable: true,
    //   highlightId: 'dm_canvas_highlight_' + color
    // });
    // overlay.fabricCanvas().add(rect);
    // fabric.loadSVGFromString(svgString, function(objects, options) {
    //   console.log(objects);
    //   var obj = fabric.util.groupSVGElements(objects, options);
    //   overlay.fabricCanvas().add(obj).renderAll();
    // });
    for (const highlightId in highlights) {
      const highlight = highlights[highlightId];
      const jsonString = `{"objects":[${highlight.target}]}`;
      overlay.fabricCanvas().loadFromJSON(jsonString, null, (o, object) => {
        console.log(object);
        object.on('mousedown', () => {
          window.setFocusHighlight(resourceId, highlightId);
        });
      });
    }
  }

  rectClick() {
    const highlightId = `dm_canvas_highlight_${Date.now()}`;
    const { resourceId } = this.props;
    let rect = new fabric.Rect({
      left: 650,
      top: 700,
      stroke: 'red',
      strokeWidth: 5,
      fill: 'transparent',
      width: 300,
      height: 300,
      selectable: true,
      highlightId: 'dm_canvas_highlight_new'
    });
    this.overlay.fabricCanvas().add(rect);
    this.overlay.fabricCanvas().setActiveObject(rect);
    this.props.addHighlight(resourceId, highlightId, JSON.stringify(rect.toJSON()));
    rect.on('mousedown', () => {
      window.setFocusHighlight(resourceId, highlightId);
    });
  }

  render() {
    return (
      <div>
        <div>
          <button onClick={this.rectClick.bind(this)} style={{ marginBottom: '10px' }}>Rectangle</button>
        </div>
        <div id={`openseadragon-${this.props.resourceName}`} style={{ height: '400px' }}></div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
});

const mapDispatchToProps = dispatch => bindActionCreators({
  addHighlight
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CanvasResource);
