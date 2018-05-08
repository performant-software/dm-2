import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { addHighlight } from './modules/documentGrid';
import { setCanvasHighlightColor, toggleCanvasColorPicker } from './modules/canvasEditor';
import OpenSeadragon from 'openseadragon';
import { fabric } from './fabricAdapted';//'openseadragon-fabricjs-overlay/fabric/fabric.adapted';
import 'openseadragon-fabricjs-overlay';
import { yellow500 } from 'material-ui/styles/colors';
import HighlightColorSelect from './HighlightColorSelect';

class CanvasResource extends Component {
  componentDidMount() {
    const {content, highlight_map, resourceId, setCanvasHighlightColor} = this.props;

    setCanvasHighlightColor(resourceId, yellow500);

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
    this.renderHighlights(this.overlay, highlight_map);
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

  renderHighlights(overlay, highlight_map) {
    const { resourceId } = this.props;
    for (const highlightId in highlight_map) {
      const highlight = highlight_map[highlightId];
      const jsonString = `{"objects":[${highlight.target}]}`;
      overlay.fabricCanvas().loadFromJSON(jsonString, null, (o, object) => {
        object.on('mousedown', () => {
          window.setFocusHighlight(resourceId, highlightId);
        });
      });
    }
  }

  rectClick() {
    const highlightId = `dm_canvas_highlight_${Date.now()}`;
    const { resourceId, highlightColors } = this.props;
    let rect = new fabric.Rect({
      left: 650,
      top: 700,
      stroke: highlightColors[resourceId],
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
    const { resourceId, displayColorPickers, highlightColors, toggleCanvasColorPicker, setCanvasHighlightColor } = this.props;

    return (
      <div>
        <div>
          <HighlightColorSelect
            highlightColor={highlightColors[resourceId]}
            displayColorPicker={displayColorPickers[resourceId]}
            setHighlightColor={(color) => {setCanvasHighlightColor(resourceId, color);}}
            toggleColorPicker={() => {toggleCanvasColorPicker(resourceId);}}
          />
          <button onClick={this.rectClick.bind(this)} style={{ marginBottom: '10px', verticalAlign: 'top' }}>Rectangle</button>
        </div>
        <div id={`openseadragon-${this.props.resourceName}`} style={{ height: '400px' }}></div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  highlightColors: state.canvasEditor.highlightColors,
  displayColorPickers: state.canvasEditor.displayColorPickers
});

const mapDispatchToProps = dispatch => bindActionCreators({
  addHighlight,
  setCanvasHighlightColor,
  toggleCanvasColorPicker
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CanvasResource);
