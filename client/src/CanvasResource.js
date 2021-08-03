import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import OpenSeadragon from 'openseadragon-fabricjs-overlay/openseadragon/openseadragon';
import { fabric } from 'openseadragon-fabricjs-overlay/fabric/fabric.adapted';
import { openSeaDragonFabricOverlay } from 'openseadragon-fabricjs-overlay/openseadragon-fabricjs-overlay';
import Slider from 'material-ui/Slider';
import IconButton from 'material-ui/IconButton';
import PanTool from 'material-ui/svg-icons/action/pan-tool';
import CropFree from 'material-ui/svg-icons/image/crop-free';
import CropSquare from 'material-ui/svg-icons/image/crop-square';
import PanoramaFishEye from 'material-ui/svg-icons/image/panorama-fish-eye';
import Place from 'material-ui/svg-icons/maps/place';
import Edit from 'material-ui/svg-icons/image/edit';
import Colorize from 'material-ui/svg-icons/image/colorize';
import ShowChart from 'material-ui/svg-icons/editor/show-chart';
import DeleteForever from 'material-ui/svg-icons/action/delete-forever';
import AddToPhotos from 'material-ui/svg-icons/image/add-to-photos';
import RemoveFromPhotos from './icons/RemoveFromPhotos';
import Done from 'material-ui/svg-icons/action/done';
import Cancel from 'material-ui/svg-icons/navigation/close';
import { LayerBackward, LayerForward } from 'react-bootstrap-icons';
import { yellow500, cyan100 } from 'material-ui/styles/colors';
import {
  setCanvasHighlightColor,
  toggleCanvasColorPicker,
  setImageUrl,
  setIsPencilMode,
  setAddTileSourceMode,
  UPLOAD_SOURCE_TYPE,
  setZoomControl,
  toggleEditLayerName,
} from './modules/canvasEditor';
import {
  addHighlight,
  updateHighlight,
  setHighlightThumbnail,
  openDeleteDialog,
  CANVAS_HIGHLIGHT_DELETE,
  moveLayer,
  CANVAS_LAYER_DELETE,
  renameLayer,
} from './modules/documentGrid';
import { checkTileSource } from './modules/iiif';
import HighlightColorSelect from './HighlightColorSelect';
import AddImageLayer from './AddImageLayer';
import TextField from 'material-ui/TextField';
import deepEqual from 'deep-equal';

// overlay these modules
openSeaDragonFabricOverlay(OpenSeadragon, fabric);

// from https://stackoverflow.com/a/48343346/6126327 - show consistent stroke width regardless of object scaling
fabric.Object.prototype._renderStroke = function(ctx) {
    if (!this.stroke || this.strokeWidth === 0) {
        return;
    }
    if (this.shadow && !this.shadow.affectStroke) {
        this._removeShadow(ctx);
    }
    ctx.save();
    ctx.scale(1 / this.scaleX, 1 / this.scaleY);
    this._setLineDash(ctx, this.strokeDashArray, this._renderDashedStroke);
    this._applyPatternGradientTransform(ctx, this.stroke);
    ctx.stroke();
    ctx.restore();
};

const strokeWidth = 3.0;
const markerRadius = 4.0;
const doubleClickTimeout = 500;
const markerThumbnailSize = 100
const fabricViewportScale = 2000
const minZoomImageRatio = 0.9
const maxZoomPixelRatio = 10.0

class CanvasResource extends Component {
  constructor(props) {
    super(props);
    this.osdId =`openseadragon-${this.props.document_id}-${Date.now()}`;
    this.osdViewer = null;
    this.upButton = null;
    this.downButton = null;
    this.layerSelect = null;
    this.imageLayerControls = null;
    this.highlight_map = {};
    this.viewportUpdatedYet = false;
    this.currentMode = 'pan';
    this.hasOpenedOnce = false;

    this.state = {
      currentPage: 0,
      layerName: '',
    };
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.content && this.props.content 
        && !deepEqual(prevProps.content.tileSources, this.props.content.tileSources)) {
      this.openTileSources(this.props.content.tileSources);
      if (this.props.content.tileSources.length !== prevProps.content.tileSources.length) {
        this.osdViewer.goToPage(0);
      } else {
        this.osdViewer.goToPage(this.props.pageToChange[this.getInstanceKey()] || 0);
      }
      const hasLayerControls = this.osdViewer.controls 
        && this.osdViewer.controls.find(ctrl => ctrl.element.className === 'image-layer-controls');
      if (this.hasLayers() && !hasLayerControls) {
        this.osdViewer.addControl(this.imageLayerControls, {
          anchor: OpenSeadragon.ControlAnchor.TOP_LEFT,
          autoFade: true,
        });
      } else if (!this.hasLayers() && hasLayerControls) {
        this.osdViewer.removeControl(this.imageLayerControls);
      }
    }
    if (this.layerSelect 
        && prevProps.content && this.props.content 
        && !deepEqual(prevProps.content.iiifTileNames, this.props.content.iiifTileNames)) {
      this.refreshLayerSelect(this.props.content.tileSources);
    }
    if (prevProps.pageToChange[this.getInstanceKey()] !== this.props.pageToChange[this.getInstanceKey()]) {
      this.osdViewer.goToPage(this.props.pageToChange[this.getInstanceKey()] || 0);
    }
    if (this.props.highlightsHidden[this.getInstanceKey()] !== prevProps.highlightsHidden[this.getInstanceKey()]
      && !this.props.highlightsHidden[this.getInstanceKey()]) {
      this.osdViewer.raiseEvent( 'update-viewport', {} );
    }
  }

  componentDidMount() {
    const {content, highlight_map, document_id, setCanvasHighlightColor, setAddTileSourceMode, updateHighlight, addHighlight, setHighlightThumbnail} = this.props;
    this.highlight_map = highlight_map;

    const initialColor = yellow500;
    const key = this.getInstanceKey();
    setCanvasHighlightColor(key, initialColor);

    const viewer = this.osdViewer = OpenSeadragon({
      id: this.osdId,
      prefixUrl: '/images/',
      showNavigationControl: false,
      tileSources: [],
      minZoomImageRatio: minZoomImageRatio,
      maxZoomPixelRatio: maxZoomPixelRatio,
      navigatorSizeRatio: 0.15,
      gestureSettingsMouse: { clickToZoom: false },
      showNavigator: true,
      sequenceMode: true,
      showSequenceControl: false,
      preserveViewport: true,
    });
    const hasLayers = this.hasLayers();

    const upButton = this.upButton = new OpenSeadragon.Button({
      tooltip: "Previous layer",
      srcRest: "/images/up_rest.png",
      srcGroup: "/images/up_grouphover.png",
      srcHover: "/images/up_hover.png",
      srcDown: "/images/up_pressed.png",
      onRelease: (e) => {
        viewer.goToPage(this.state.currentPage - 1);
      },
    });
    const layerSelect = this.layerSelect = OpenSeadragon.makeNeutralElement('select');
    layerSelect.style = '';
    layerSelect.className = 'image-layer-select';
    layerSelect.name = `${this.getInstanceKey()}-layer-select`;
    layerSelect.addEventListener('change', () => {
      viewer.goToPage(parseInt(layerSelect.value, 10));
    });
    
    if (hasLayers) {
      content.tileSources.forEach((tileSource, index) => {
        const opt = OpenSeadragon.makeNeutralElement('option');
        opt.value = index;
        opt.label = `${index+1}: ${this.getLayerName(index)}`;
        layerSelect.appendChild(opt);
      });
    }

    const downButton = this.downButton = new OpenSeadragon.Button({
      tooltip: "Next layer",
      srcRest: "/images/down_rest.png",
      srcGroup: "/images/down_grouphover.png",
      srcHover: "/images/down_hover.png",
      srcDown: "/images/down_pressed.png",
      onRelease: (e) => {
        viewer.goToPage(this.state.currentPage + 1);
      },
    });
    upButton.disable();
    if (!(content && content.tileSources && this.state && this.state.currentPage !== content.tileSources.length-1)) {
      downButton.disable();
    }

    const wrapper = this.imageLayerControls = OpenSeadragon.makeNeutralElement('div');
    wrapper.className = 'image-layer-controls';
    const buttons = [upButton, downButton];
    const buttonGroup = new OpenSeadragon.ButtonGroup({ buttons });
    buttonGroup.element.className = 'layer-button-group';
    wrapper.appendChild(buttonGroup.element);
    wrapper.appendChild(layerSelect);
    wrapper.innerTracker = new OpenSeadragon.MouseTracker({
      element: wrapper,
    });
    if (hasLayers) {
      viewer.addControl(wrapper, {
        anchor: OpenSeadragon.ControlAnchor.TOP_LEFT,
        autoFade: true,
      });
    }

    const overlay = this.overlay = viewer.fabricjsOverlay({scale: fabricViewportScale});

    let tileSources = (content && content.tileSources) ? content.tileSources : [];
    let imageUrlForThumbnail = null
    const firstTileSource = tileSources[0];

    if (firstTileSource) {
      imageUrlForThumbnail = this.openTileSources(tileSources)
    } else {
      // we don't have an image yet, so this causes AddImageLayer to display
      setAddTileSourceMode(document_id, UPLOAD_SOURCE_TYPE);
    }

    viewer.addHandler('update-viewport', () => {
      if (!this.viewportUpdatedForPageYet) {
        this.renderHighlights(overlay, highlight_map);
        this.viewportUpdatedForPageYet = true;
      }
      const zoom = overlay.fabricCanvas().getZoom();
      overlay.fabricCanvas().forEachObject(object => {
        if (object._isMarker) {
          object.radius = markerRadius / zoom;
        }
        object.strokeWidth = strokeWidth / zoom;
        if (this.markObjectsDirtyNextUpdate) object.dirty = true;
      });
      this.markObjectsDirtyNextUpdate = false;
      overlay.fabricCanvas().freeDrawingBrush.width = strokeWidth / overlay.fabricCanvas().getZoom();
      overlay.resize();
      overlay.resizecanvas();
    });

    viewer.addHandler('page', (event) => {
      const pageNumber = parseInt(event.page, 10);
      if (this.upButton && pageNumber <= 0) {
        this.upButton.disable();
      } else if (this.upButton) {
        this.upButton.enable();
      }
      if (this.downButton && !(
          this.props.content
          && this.props.content.tileSources
          && pageNumber !== (this.props.content.tileSources.length-1)
        )) {
        this.downButton.disable();
      } else if (this.downButton) {
        this.downButton.enable();
      }
      if (this.layerSelect) {
        this.layerSelect.selectedIndex = pageNumber;
      }

      this.markObjectsDirtyNextUpdate = true;
      this.setState({
        currentPage: pageNumber,
        layerName: this.getLayerName(pageNumber),
      });
    });

    viewer.addHandler('open', this.onOpen.bind(this) );

    viewer.addHandler('zoom', event => {
      const max = this.osdViewer.viewport.getMaxZoom();
      const min = this.osdViewer.viewport.getMinZoom();
      //JONAH const exponential_range = (value-Math.log1p(value));  // flattens out default exponential zoom. zoom now fairly linear -Jonah
      //JONAH this.osdViewer.viewport.zoomTo(min + ((max - min) * exponential_range));
      // this sets the zoom control based on zoom level (when adjusted through mouse wheel)
      this.props.setZoomControl(this.getInstanceKey(), Math.min(Math.max((event.zoom - min) / (max - min), 0.0), 1.0));
    });

    overlay.fabricCanvas().freeDrawingBrush.color = initialColor;
    overlay.fabricCanvas().freeDrawingBrush.width = strokeWidth / overlay.fabricCanvas().getZoom();

    overlay.fabricCanvas().on('object:selected', event => {
      if (this.currentMode === 'pan' && event.target && event.target._highlightUid) {
          window.setFocusHighlight(document_id, event.target._highlightUid); // the code that pops up the annotation
          overlay.fabricCanvas().discardActiveObject();
      } else if (this.currentMode === 'edit' && event && event.target._isTarget) {
        for (let i = 0; i < 3; i++){ // For some reason it's necessary to do this multiple times
          overlay.fabricCanvas().forEachObject((obj) => {
            if (obj && obj._isTargetChild) {
              overlay.fabricCanvas().remove(obj);
            }
          });
        }
      }
    });
    overlay.fabricCanvas().on('mouse:down', this.canvasMouseDown.bind(this) );
    overlay.fabricCanvas().on('mouse:move', this.canvasMouseMove.bind(this) );
    overlay.fabricCanvas().on('mouse:up', this.canvasMouseUp.bind(this) );
    overlay.fabricCanvas().on('object:modified', event => {
      if( this.currentMode === 'edit' && event && event.target && event.target._highlightUid && !event.target._isTargetChild ) {
          const highlight_id = this.highlight_map[event.target._highlightUid].id;
          if (highlight_id && imageUrlForThumbnail) {
            const highlightCoords = event.target._isMarker ?
              this.computeMarkerThumbBounds(event.target) :
              event.target.aCoords
            updateHighlight(highlight_id, {target: JSON.stringify(event.target.toJSON(['_highlightUid', '_isMarker']))});
            setHighlightThumbnail(highlight_id, imageUrlForThumbnail, highlightCoords, event.target.toSVG());
          }
      }
    });

    // rollover highlights
    overlay.fabricCanvas().on('mouse:over', event => {
      if (this.currentMode === 'pan' && event.target && event.target._highlightUid) {
        window.showRollover(this.props.document_id, event.target._highlightUid);
      }
    });
    overlay.fabricCanvas().on('mouse:out', function(event) {
      if (this.currentMode === 'pan' && event.target && event.target._highlightUid) {
        window.hideRollover(event.target._highlightUid);
      }
    }.bind(this));

    // process paths created with pencil tool
    overlay.fabricCanvas().on('path:created', event => {
      if (event.path) {
        let path = event.path;
        const highlightUid = `dm_canvas_highlight_${Date.now()}`;
        path._highlightUid = highlightUid;
        path.perPixelTargetFind = true;
        this.overlay.fabricCanvas().setActiveObject(path);
        addHighlight(
          document_id,
          highlightUid,
          JSON.stringify(path.toJSON(['_highlightUid', '_isMarker'])),
          this.overlay.fabricCanvas().freeDrawingBrush.color,
          'Pencil highlight',
          savedHighlight => {
            setHighlightThumbnail(savedHighlight.id, imageUrlForThumbnail, path.aCoords, path.toSVG());
          });
      }
    });

    // handle window resize
    window.onresize = function() {
      overlay.resize();
      overlay.resizecanvas();
    };
  }

  openTileSources(tileSources) {
    const key = this.getInstanceKey()
    let imageUrlForThumbnail;
    let firstTileSource = tileSources[0];

    if (firstTileSource.type === 'image' && firstTileSource.url) {
      imageUrlForThumbnail = firstTileSource.url
      // don't force ssl for localhost
      if( imageUrlForThumbnail.match(/^http:\/\/localhost/) ) {
        this.props.setImageUrl(key, imageUrlForThumbnail);
        if (tileSources.length > 1) {
          const newTileSources = [{ type: 'image', url: imageUrlForThumbnail }, ...tileSources.slice(1)]
          this.osdViewer.open(newTileSources);
        } else this.osdViewer.open([{ type: 'image', url: imageUrlForThumbnail }]);
      } else {
        const tileSourceSSL = imageUrlForThumbnail.replace('http:', 'https:')
        this.props.setImageUrl(key, tileSourceSSL);
        if (tileSources.length > 1) {
          const newTileSources = [{ type: 'image', url: tileSourceSSL }, ...tileSources.slice(1)]
          this.osdViewer.open(newTileSources);
        } else this.osdViewer.open([{ type: 'image', url: tileSourceSSL }]);
      }
    }
    else {
      let resourceURL = firstTileSource.replace('http:', 'https:')
      imageUrlForThumbnail = resourceURL + '/full/!400,400/0/default.png'
      this.props.setImageUrl(key, imageUrlForThumbnail);
      checkTileSource(
        resourceURL,
        (validResourceURL) => { 
          if (tileSources.length > 1) {
            const newTileSources = [validResourceURL, ...tileSources.slice(1)]
            this.osdViewer.open(newTileSources);
          } else this.osdViewer.open([validResourceURL]);
        },
        (errorResponse) => { console.log( errorResponse ) }
      )
    }
    this.refreshLayerSelect(tileSources);

    return imageUrlForThumbnail;
  }

  refreshLayerSelect(tileSources) {
    const selected = this.layerSelect.selectedIndex;
    while (this.layerSelect.firstChild) {
      this.layerSelect.removeChild(this.layerSelect.lastChild);
    }
    tileSources.forEach((tileSource, index) => {
      const opt = OpenSeadragon.makeNeutralElement('option');
      opt.value = index;
      opt.label = `${index+1}: ${this.getLayerName(index)}`;
      this.layerSelect.appendChild(opt);
    });
    this.layerSelect.selectedIndex = selected;
  }

  // if a first target for this window has been specified, pan and zoom to it.
  onOpen() {
    if( this.props.firstTarget && !this.hasOpenedOnce ) {
      let targetHighLight = null;
      for( let key in this.props.highlight_map ) {
        let currentHighlight = this.props.highlight_map[key]
        if( currentHighlight.id === this.props.firstTarget ) {
          targetHighLight = currentHighlight
          break
        }
      }
      if( targetHighLight ) {
        const target = JSON.parse(targetHighLight.target)
        const x = target.left / fabricViewportScale
        const y = target.top / fabricViewportScale
        const w = target.width / fabricViewportScale
        const h = target.height / fabricViewportScale
        // back out a little so we can see highlight in context
        const targetRect = new OpenSeadragon.Rect(x-0.1,y-0.1,w+0.2,h+0.2)
        const viewport = this.osdViewer.viewport;
        viewport.fitBoundsWithConstraints( targetRect );
        this.hasOpenedOnce = true;
        // console.log(`tr: ${targetRect.toString()} tr2: ${targetRect2.toString()}`)
      }
    }
  }

  canvasMouseDown(event) {

    if( this.currentMode === 'edit' || this.currentMode === 'pan' ) return;

    this.isMouseDown = true;
    this.pointerCoords = this.overlay.fabricCanvas().getPointer(event.e);

    switch(this.currentMode) {
      case 'marker':
        this.drawMarker(this.pointerCoords);
        break;

      case 'rect':
        this.newShape = new fabric.Rect({
          left: this.pointerCoords.x,
          top: this.pointerCoords.y,
          width: 20,
          height: 20,
          fill: 'transparent'
        });
        this.addShape(this.newShape);
        break;

      case 'circle':
        this.newShape = new fabric.Circle({
          radius: 15,
          left: this.pointerCoords.x,
          top: this.pointerCoords.y,
          fill: 'transparent',
          originX: 'center', originY: 'center' // when circle is resized, the center remains constant
        });
        this.addShape(this.newShape);
        break;

      case 'colorize':
          // select new color
          const newColor = this.props.highlightColors[this.getInstanceKey()]
          // get object, if one is clicked
          const selectedObject = this.overlay.fabricCanvas().getActiveObject();

          // make sure the click selected an object
          if(selectedObject) {
            selectedObject.set({ stroke: newColor });
            // this deselects the highlight, which causes the color change to take place
            //  without this line, a object that was previously selected prior to use of the tool would not change color until deselected
            this.overlay.fabricCanvas().discardActiveObject();

            const highlight_id = this.highlight_map[selectedObject._highlightUid].id;
            this.props.updateHighlight(highlight_id, {color: newColor, target: JSON.stringify(selectedObject.toJSON(['_highlightUid', '_isMarker']))});
          }
          break;

      case 'lineDraw':
        if( this.checkDoubleClick() ) {
          this.drawLine(this.pointerCoords, true);
          this.endLineMode();
        } else {
          this.drawLine(this.pointerCoords, true);
          this.prevLineEndPoint = this.pointerCoords;
        }
        break;
      default:
        break;
    }
  }

  canvasMouseMove(o) {
    if( this.currentMode === 'edit' || this.currentMode === 'pan' ) return;

    if (this.currentMode === 'lineDraw' && this.lineInProgress) {
      this.pointerCoords = this.overlay.fabricCanvas().getPointer(o.e);
      this.drawLine(this.pointerCoords, false);
    }

    if( this.newShape && this.isMouseDown ) {
      const mouse = this.overlay.fabricCanvas().getPointer(o.e);
      switch(this.currentMode) {
        case 'rect':
          if(mouse.x < this.pointerCoords.x) {
            this.newShape.set({left: mouse.x });
          }
          if(mouse.y < this.pointerCoords.y) {
            this.newShape.set({top: mouse.y });
          }

          this.newShape.set({width: Math.abs(this.pointerCoords.x - mouse.x) });
          this.newShape.set({height: Math.abs(this.pointerCoords.y - mouse.y) });

          this.overlay.fabricCanvas().renderAll();
          break;
        case 'circle':
          if( Math.abs(mouse.x - this.pointerCoords.x) > Math.abs(mouse.y - this.pointerCoords.y) ) {
            this.newShape.set({radius: Math.abs( mouse.x - this.pointerCoords.x ) });
          } else {
            this.newShape.set({radius: Math.abs( mouse.y - this.pointerCoords.y ) });
          }

          this.overlay.fabricCanvas().renderAll();
          break;
        default:
          break;

      }
    }
  }

  canvasMouseUp() {
    if( this.currentMode !== 'rect' && this.currentMode !== 'circle') {
      if( this.currentMode !== 'edit' && this.currentMode !== 'colorize' && this.currentMode !== 'pan' && this.currentMode !== 'lineDraw') {
        this.panClick(); // jonah *** change here the current mode to 'pan'
      }
      return;
    }

    // needed for new shape to respond to mouse clicks
    this.osdViewer.forceRedraw();
    const label = this.currentMode === 'rect' ? 'Rectangular highlight' : 'Circular highlight';
    this.isMouseDown = false;
    const key = this.getInstanceKey();
    const aCoords = this.newShape.calcCoords(true);
    const svg = this.newShape.toSVG();
    const imageUrlForThumbnail = this.props.imageURLs[key]

    this.props.addHighlight(
      this.props.document_id,
      this.newShape._highlightUid,
      JSON.stringify(this.newShape.toJSON(['_highlightUid', '_isMarker'])),
      this.props.highlightColors[key],
      label,
      savedHighlight => {
          this.props.setHighlightThumbnail(
            savedHighlight.id,
            imageUrlForThumbnail,
            aCoords,
            svg
          );
      });
    this.panClick(); // jonah *** change here the current mode to 'pan'
    this.newShape = null;
  }

  renderHighlights(overlay, highlight_map) {
    const jsonBlob = {objects: []};
    for (const highlightUid in highlight_map) {
      const highlight = highlight_map[highlightUid];
      const parsedHighlight = JSON.parse(highlight.target);
      if( this.props.firstTarget ) {
        if( highlight.id === this.props.firstTarget ) {
          for (let i = 0; i < 3; i += 1) {
            // Copy the object 3 times to make the glow more visible
            jsonBlob.objects.push({ ...parsedHighlight,
              selectable: false,
              hoverCursor: 'default',
              _isTargetChild: true,
              shadow: new fabric.Shadow({
                color: 'blue',
                blur: 10,
              }),
            });
          }
          parsedHighlight._isTarget = true;
        }
      }
      jsonBlob.objects.push(parsedHighlight);
    }
    const jsonString = JSON.stringify(jsonBlob);
    const zoom = overlay.fabricCanvas().getZoom();
    overlay.fabricCanvas().loadFromJSON(jsonString, () => {
      overlay.fabricCanvas().forEachObject(object => {
        this.lockCanvasObject(object, true);
        if (object._isMarker) {
          object.radius = markerRadius / zoom;
        }
        object.strokeWidth = strokeWidth / zoom;
        object.dirty = true;
        object.perPixelTargetFind = true;
        if (!object._isTargetChild) object.selectable = true;

        if (!this.props.writeEnabled) {
          object.hoverCursor = 'default';
        }
      });
    });
  }

  // doing it this way because double click events are not reliably
  // processed by osdViewer or fabric js.
  checkDoubleClick() {
    if( this.lastTime ) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - this.lastTime;
      this.lastTime = currentTime;
      return ( elapsedTime < doubleClickTimeout );
    } else {
      this.lastTime = Date.now();
      return false;
    }
  }

  drawLine(pointer, activeShape) {
    // draw first segment normally
    // draw a line connecting most recent segment to current mouse position
    // on click add that line to points array
    const key = this.getInstanceKey();
    const lineOptions = {
      fill: 'transparent',
      selectable: false,
      stroke: this.props.highlightColors[key],
      strokeWidth: strokeWidth / this.overlay.fabricCanvas().getZoom()
    };

    if( this.lineInProgress ) {
      if (this.lineInProgress.radius) { // drawing first line segment
        // if we have a circle, replace it with a line
        const centerPoint = this.lineInProgress.getCenterPoint();
        const oldCircle = this.lineInProgress;
        this.lineInProgress = new fabric.Polyline(
          [{ x: centerPoint.x, y: centerPoint.y}, { x: pointer.x, y: pointer.y }],
          lineOptions
        );
          this.overlay.fabricCanvas().remove(oldCircle);
          this.overlay.fabricCanvas().add(this.lineInProgress);
      } else if (this.prevLineEndPoint && !activeShape) {
        // if we are just hovering make a line
        const oldHoverLine = this.hoverLine;
        this.hoverLine = new fabric.Polyline(
          [{ x: this.prevLineEndPoint.x, y: this.prevLineEndPoint.y}, { x: pointer.x, y: pointer.y }],
          lineOptions
        );
        this.overlay.fabricCanvas().remove(oldHoverLine);
        this.overlay.fabricCanvas().add(this.hoverLine);
        
      } else {
        // otherwise, add to the line
          const oldPolyline = this.lineInProgress;
          const oldHoverLine = this.hoverLine;
          const points = oldPolyline.points.concat({ x: pointer.x, y: pointer.y });
          this.lineInProgress = new fabric.Polyline( points, lineOptions );
          this.overlay.fabricCanvas().remove(oldHoverLine);
          this.overlay.fabricCanvas().remove(oldPolyline);
          this.overlay.fabricCanvas().add(this.lineInProgress);
      }
    }
    else {
      // start with a circle
      let radius = markerRadius / this.overlay.fabricCanvas().getZoom()
      this.lineInProgress = new fabric.Circle({
        radius,
        left: pointer.x - radius,
        top: pointer.y - radius,
        selectable: false,
        fill: this.props.highlightColors[key],
        stroke: 'transparent',
        _isMarker: true
      });
      this.overlay.fabricCanvas().add(this.lineInProgress);
    }
  }

  computeMarkerThumbBounds(markerCoords) {
    return {
      tl: { x: markerCoords.left - markerThumbnailSize, y: markerCoords.top - markerThumbnailSize },
      tr: { x: markerCoords.left + markerThumbnailSize, y: markerCoords.top - markerThumbnailSize },
      bl: { x: markerCoords.left - markerThumbnailSize, y: markerCoords.top + markerThumbnailSize },
      br: { x: markerCoords.left + markerThumbnailSize, y: markerCoords.top + markerThumbnailSize }
    }
  }

  drawMarker(pCoords) {
    const imageUrlForThumbnail = this.props.imageURLs[this.getInstanceKey()];

    // create marker shape on canvas
    let markerFill = fabric.Color.fromHex(this.props.highlightColors[this.getInstanceKey()]);
    markerFill.setAlpha(0.3);
    var rad = markerRadius / this.overlay.fabricCanvas().getZoom();
    let markerCoords = { left: pCoords.x - rad, top:  pCoords.y - rad }
    let marker = new fabric.Circle({
      radius: rad,
      left: markerCoords.left, // offset to put marker at center of click
      top: markerCoords.top,
      fill: markerFill.toRgba(),
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      lockScalingFlip: true,
      lockSkewingX: true,
      lockSkewingY: true,
      lockUniScaling: true,
      hasControls: false,
      _isMarker: true
    });
    this.addShape(marker);
    const highlightCoords = this.computeMarkerThumbBounds(markerCoords)

    // save as a highlight
    this.props.addHighlight(
      this.props.document_id,
      marker._highlightUid,
      JSON.stringify(marker.toJSON(['_highlightUid', '_isMarker'])),
      this.props.highlightColors[this.getInstanceKey()],
      'Marker highlight',
      savedHighlight => {
          this.props.setHighlightThumbnail(
            savedHighlight.id,
            imageUrlForThumbnail,
            highlightCoords,
            marker.toSVG()
          );
    });
  }

  endLineMode() {
    if( !this.lineInProgress ) return;
    const aCoords = this.lineInProgress.aCoords;
    const svg = this.lineInProgress.toSVG();
    const imageUrlForThumbnail = this.props.imageURLs[this.getInstanceKey()];

    // now act like other shapes, assign a unique id
    this.lineInProgress.perPixelTargetFind = true;
    this.lineInProgress.selectable = true;
    this.lockCanvasObject(this.lineInProgress, true);
    const highlightUid = `dm_canvas_highlight_${Date.now()}`;
    this.lineInProgress['_highlightUid'] = highlightUid;

    this.props.addHighlight(
      this.props.document_id,
      this.lineInProgress._highlightUid,
      JSON.stringify(this.lineInProgress.toJSON(['_highlightUid', '_isMarker'])),
      this.props.highlightColors[this.getInstanceKey()],
      'Line highlight',
      savedHighlight => {
        this.props.setHighlightThumbnail(
          savedHighlight.id,
          imageUrlForThumbnail,
          aCoords,
          svg
        );
    });
    this.lineInProgress = null;
    this.overlay.fabricCanvas().defaultCursor = 'default';
    this.osdViewer.forceRedraw();
    this.panClick(); // jonah *** change here the current mode to 'pan'
  }

  addShape(fabricObject) {
    const highlightUid = `dm_canvas_highlight_${Date.now()}`;
    const { highlightColors } = this.props;
    const instanceKey = this.getInstanceKey();
    fabricObject['_highlightUid'] = highlightUid;
    fabricObject.stroke = highlightColors[instanceKey];
    fabricObject.strokeWidth = strokeWidth / this.overlay.fabricCanvas().getZoom();
    fabricObject.perPixelTargetFind = true;
    fabricObject.selectable = true;
    this.lockCanvasObject(fabricObject, true);
    this.overlay.fabricCanvas().add(fabricObject);
  }

  lockCanvasObject( object, lock ) {
    if( lock ) {
      object.lockScalingX = true;
      object.lockScalingY = true;
      object.lockRotation = true;
      object.lockScalingFlip = true;
      object.lockSkewingX = true;
      object.lockSkewingY = true;
      object.lockUniScaling = true;
      object.lockMovementX = true;
      object.lockMovementY = true;
      object.hasControls = false;
    } else {
      if( !object._isMarker ) {
        object.lockScalingX = false;
        object.lockScalingY = false;
        object.lockRotation = false;
        object.lockScalingFlip = false;
        object.lockSkewingX = false;
        object.lockSkewingY = false;
        object.lockUniScaling = false;
        object.hasControls = true;
      }
      object.lockMovementX = false;
      object.lockMovementY = false;
    }
  }

  lockCanvasObjects( lock ) {
    const canvasObjects = this.overlay.fabricCanvas().getObjects();
    canvasObjects.forEach( object => {
      this.lockCanvasObject( object, lock );
    });
  }

  stopDrawing() {
    this.endLineMode();
    // turn off pencil mode
    this.overlay.fabricCanvas().isDrawingMode = false;
    this.props.setIsPencilMode(this.props.document_id, false);
  }

  panClick() {
    // deselect highlight to ensure resize handles behave properly
    this.overlay.fabricCanvas().discardActiveObject();
    this.stopDrawing()
    this.lockCanvasObjects(true);
    this.currentMode = 'pan';
    this.osdViewer.setMouseNavEnabled(true);
  }

  editShapeClick() {
    this.stopDrawing()
    this.currentMode = 'edit';
    this.lockCanvasObjects(false);
    this.osdViewer.setMouseNavEnabled(false);

    // deselect highlight to ensure resize handles behave properly
    this.overlay.fabricCanvas().discardActiveObject();
  }

  rectClick() {
    this.stopDrawing()
    this.currentMode = 'rect';
    this.lockCanvasObjects(true);
    this.osdViewer.setMouseNavEnabled(false);
  }

  circleClick() {
    this.stopDrawing()
    this.currentMode = 'circle';
    this.lockCanvasObjects(true);
    this.osdViewer.setMouseNavEnabled(false);
  }

  markerClick() {
    this.stopDrawing()
    this.currentMode = 'marker';
    this.lockCanvasObjects(true);
    this.osdViewer.setMouseNavEnabled(false);
  }

  pencilClick() {
    this.currentMode = 'freeDraw';
    this.osdViewer.setMouseNavEnabled(false);
    this.stopDrawing()

    this.lockCanvasObjects(true);
    this.overlay.fabricCanvas().isDrawingMode = true;
    this.props.setIsPencilMode(this.props.document_id, true);
  }

  lineClick() {
    this.currentMode = 'lineDraw';
    this.osdViewer.setMouseNavEnabled(false);
    this.stopDrawing()
    this.lockCanvasObjects(true);
    this.overlay.fabricCanvas().defaultCursor = 'crosshair';
  }

  colorizeClick() {
    this.stopDrawing()
    this.currentMode = 'colorize';
    this.lockCanvasObjects(true);
    this.osdViewer.setMouseNavEnabled(false);
  }

  deleteHighlightClick() {
    const selectedObject = this.overlay.fabricCanvas().getActiveObject();
    let selectedObjects = [];
    if (selectedObject) selectedObjects.push(selectedObject);
    if (selectedObjects.length > 0) {
      this.props.openDeleteDialog(
        'Removing highlight' + (selectedObjects.length > 1 ? 's' : ''),
        'Deleting the selection will destroy ' + (selectedObjects.length > 1 ? (selectedObjects.length) + ' highlights and their ' : 'a highlight and its ') + 'links.',
        'Destroy ' + (selectedObjects.length > 1 ? (selectedObjects.length) + ' highlights' : 'highlight'),
        {
          highlights: selectedObjects.map(object => this.props.highlight_map[object._highlightUid]),
          fabricObjects: selectedObjects,
          canvas: this.overlay.fabricCanvas()
        },
        CANVAS_HIGHLIGHT_DELETE
      );
    }

  }

  moveLayerClick(direction) {
    this.props.moveLayer({
      documentId: this.props.document_id,
      origin: this.state.currentPage,
      direction,
      editorKey: this.getInstanceKey(),
    });
  }

  deleteLayerClick() {
    this.props.openDeleteDialog(
      'Deleting layer',
      `This will delete layer ${this.state.currentPage + 1}, ${this.getLayerName(this.state.currentPage)}, from the stack.`,
      'Delete layer',
      {
        documentId: this.props.document_id,
        layer: this.state.currentPage,
        editorKey: this.getInstanceKey(),
      },
      CANVAS_LAYER_DELETE
    );
  }

  editLayerNameClick() {
    this.props.toggleEditLayerName({
      editorKey: this.getInstanceKey(),
      value: true,
    });
    this.setState({
      layerName: this.getLayerName(this.state.currentPage),
    })
  }

  cancelEditLayerName() {
    this.props.toggleEditLayerName({
      editorKey: this.getInstanceKey(),
      value: false,
    });
  }

  getLayerName(page) {
    const { content } = this.props;
    const currentLayer = content.tileSources[page];
    let currentLayerName = 'Untitled image layer';
    if (typeof currentLayer === 'string' && currentLayer.includes('.json')) {
      if (content.iiifTileNames && content.iiifTileNames.find(tile => tile.url === currentLayer)) {
        currentLayerName = content.iiifTileNames.find(tile => tile.url === currentLayer).name;
      } else {
        currentLayerName = 'IIIF layer';
      }
    } else if (typeof currentLayer === 'string' && currentLayer.includes('http')) {
      const url = currentLayer;
      currentLayerName = decodeURIComponent(url.substring(url.lastIndexOf('/')+1, url.lastIndexOf('.')));
    } else if (currentLayer && currentLayer.name) {
      currentLayerName = currentLayer.name;
    } else if (currentLayer && currentLayer.url) {
      const url = currentLayer.url;
      currentLayerName = decodeURIComponent(url.substring(url.lastIndexOf('/')+1, url.lastIndexOf('.')));
    }
    return currentLayerName;
  }

  onChangeLayerName(event, newValue) {
    this.setState({
      layerName: newValue,
    })
  }

  submitLayerName(e) {
    e.preventDefault();
    const target = e.currentTarget[`layer${this.state.currentPage}-name`];
    let layerNamePayload = {};
    if (target && target.value) {
      layerNamePayload = {
        documentId: this.props.document_id,
        layer: this.state.currentPage,
        name: target.value,
        editorKey: this.getInstanceKey(),
      };
      this.props.renameLayer(layerNamePayload);
    }
  }

  zoomControlChange(event, value) {
    if (this.osdViewer && this.osdViewer.viewport) {
      const max = this.osdViewer.viewport.getMaxZoom();
      const min = this.osdViewer.viewport.getMinZoom();
      const exponential_range = (value-Math.log1p(value));  // flattens out default exponential zoom. zoom now fairly linear -Jonah
      this.osdViewer.viewport.zoomTo(min + ((max - min) * exponential_range));
    }
  }

  getInstanceKey() {
    const { document_id, timeOpened } = this.props;
    return `${document_id}-${timeOpened}`;
  }

  hasLayers() {
    const { content } = this.props;
    return (
      content 
      && content.tileSources 
      && Array.isArray(content.tileSources) 
      && content.tileSources.length > 1
    );
  }

  render() {
    const {
      loading,
      document_id,
      content,
      image_thumbnail_urls,
      addTileSourceMode,
      setAddTileSourceMode,
      image_urls,
      highlightsHidden,
      displayColorPickers,
      highlightColors,
      toggleCanvasColorPicker,
      setCanvasHighlightColor,
      writeEnabled,
      lockedByMe,
      globalCanvasDisplay,
    } = this.props;
    const key = this.getInstanceKey();

    this.highlight_map = this.props.highlight_map;

    const iconBackdropStyle = {
      width: '20px',
      height: '20px',
      marginBottom: '10px',
      marginLeft: '5px',
      background: 'white',
      padding: '1px',
      borderRadius: '1px'
    };
    const iconBackdropStyleActive = Object.assign({}, iconBackdropStyle);
    iconBackdropStyleActive.background = cyan100;
    const iconBackdropStyleSpaced = Object.assign({}, iconBackdropStyle);
    iconBackdropStyleSpaced.marginLeft = '12px';

    const floatingIconBackdropStyle = {
      width: '16px',
      height: '16px',
      paddingTop: '2px',
      paddingLeft: '5px',
    };

    const iconStyle = {
      width: '18px',
      height: '18px'
    };

    const smallIconStyle = {
      width: '16px',
      height: '16px',
    };

    const tooltipStyle = {
      pointerEvents: 'none',
    }

    let editable = ( writeEnabled && lockedByMe );
    const mode = addTileSourceMode[document_id];
    const highlightHidden = !editable && highlightsHidden[key]
    const hasLayers = this.hasLayers();

    if( !editable && this.currentMode !== 'pan' ) {
      this.panClick();
    }
    // don't render highlights if they are hidden
    if( !lockedByMe && this.overlay ) {
      const canvas = this.overlay.fabricCanvas()
      if( highlightHidden && !canvas.isEmpty() ) {
        canvas.clear();
      } else {
        if( !highlightHidden && canvas.isEmpty() ) {
          this.renderHighlights(this.overlay,this.highlight_map)
        }
      }
    }
    
    const currentLayerName = this.getLayerName(this.state.currentPage);
    const editingLayerName = this.props.editingLayerName[key];

    return (
      <div style={{ display: 'flex', flexGrow: '1', padding: '10px' }}>
        <div style={{ display: (mode || !globalCanvasDisplay) ? 'none' : 'flex', flexDirection: 'column', width: '100%' }}>
          {editable &&
            <div style={{ display: 'flex' }}>
              <HighlightColorSelect
                highlightColor={highlightColors[key]}
                displayColorPicker={displayColorPickers[key]}
                setHighlightColor={(color) => {
                  setCanvasHighlightColor(key, color);
                  if (this.overlay) {
                    this.overlay.fabricCanvas().freeDrawingBrush.color = color;
                  }
                }}
                toggleColorPicker={() => {toggleCanvasColorPicker(key);}}
              />
              <IconButton
                tooltip="Open highlight and navigate image"
                onClick={this.panClick.bind(this)}
                style={this.currentMode === 'pan' ? iconBackdropStyleActive : iconBackdropStyle}
                iconStyle={iconStyle}
                tooltipStyles={tooltipStyle}
                disabled={loading}
              >
                <PanTool />
              </IconButton>
              <IconButton
                tooltip="Select and change highlight shape"
                onClick={this.editShapeClick.bind(this)}
                style={this.currentMode === 'edit' ? iconBackdropStyleActive : iconBackdropStyle}
                iconStyle={iconStyle}
                tooltipStyles={tooltipStyle}
                disabled={loading}
              >
                <CropFree />
              </IconButton>
              <IconButton
                tooltip="Draw rectangular shapes"
                onClick={this.rectClick.bind(this)}
                style={this.currentMode === 'rect' ? iconBackdropStyleActive : iconBackdropStyle}
                iconStyle={iconStyle}
                tooltipStyles={tooltipStyle}
                disabled={loading}
              >
                <CropSquare />
              </IconButton>
              <IconButton
                tooltip="Draw circular shapes"
                onClick={this.circleClick.bind(this)}
                style={this.currentMode === 'circle' ? iconBackdropStyleActive : iconBackdropStyle}
                iconStyle={iconStyle}
                tooltipStyles={tooltipStyle}
                disabled={loading}
              >
                <PanoramaFishEye />
              </IconButton>
              <IconButton
                tooltip="Add markers"
                onClick={this.markerClick.bind(this)}
                style={this.currentMode === 'marker' ? iconBackdropStyleActive : iconBackdropStyle}
                iconStyle={iconStyle}
                tooltipStyles={tooltipStyle}
                disabled={loading}
              >
                <Place />
              </IconButton>
              <IconButton
                tooltip="Enter free drawing mode"
                onClick={this.pencilClick.bind(this)}
                style={this.currentMode === 'freeDraw' ? iconBackdropStyleActive : iconBackdropStyle}
                iconStyle={iconStyle}
                tooltipStyles={tooltipStyle}
                disabled={loading}
              >
                <Edit />
              </IconButton>
              <IconButton
                tooltip="Draw lines"
                onClick={this.lineClick.bind(this)}
                style={this.currentMode === 'lineDraw' ? iconBackdropStyleActive : iconBackdropStyle}
                iconStyle={iconStyle}
                tooltipStyles={tooltipStyle}
                disabled={loading}
              >
                <ShowChart />
              </IconButton>
              <IconButton
                tooltip="Change the color of a shape"
                onClick={this.colorizeClick.bind(this)}
                style={this.currentMode === 'colorize' ? iconBackdropStyleActive : iconBackdropStyle}
                iconStyle={iconStyle}
                tooltipStyles={tooltipStyle}
                disabled={loading}
              >
                <Colorize />
              </IconButton>
              <IconButton
                tooltip="Delete selected highlight"
                onClick={this.deleteHighlightClick.bind(this)}
                style={iconBackdropStyleSpaced}
                iconStyle={iconStyle}
                tooltipStyles={tooltipStyle}
                disabled={loading}
              >
                <DeleteForever />
              </IconButton>
              <IconButton
                tooltip="Add more layers to image"
                onClick={() => setAddTileSourceMode(document_id, UPLOAD_SOURCE_TYPE)}
                style={iconBackdropStyleSpaced}
                iconStyle={iconStyle}
                tooltipStyles={tooltipStyle}
                disabled={loading}
              >
                <AddToPhotos />
              </IconButton>
              <IconButton
                disabled={!hasLayers || (this.state && this.state.currentPage === 0) || loading}
                tooltip="Move layer up"
                onClick={() => this.moveLayerClick(-1)}
                style={iconBackdropStyle}
                tooltipStyles={tooltipStyle}
              >
                <LayerForward size={16} />
              </IconButton>
              <IconButton
                disabled={!hasLayers || !(content && content.tileSources && this.state && this.state.currentPage !== content.tileSources.length-1) || loading}
                tooltip="Move layer down"
                onClick={() => this.moveLayerClick(1)}
                style={iconBackdropStyle}
                tooltipStyles={tooltipStyle}
              >
                <LayerBackward size={16} />
              </IconButton>
              <IconButton
                disabled={!hasLayers || loading}
                tooltip="Delete layer"
                onClick={this.deleteLayerClick.bind(this)}
                style={iconBackdropStyle}
                iconStyle={iconStyle}
                tooltipStyles={tooltipStyle}
              >
                <RemoveFromPhotos />
              </IconButton>
              {hasLayers && (
                <form 
                  className="tile-name-form"
                  onSubmit={this.submitLayerName.bind(this)}
                  style={editingLayerName ? {} : { overflow: 'hidden' }}
                >
                  <div
                    className="current-tile"
                    style={editingLayerName ? {} : { overflow: 'hidden' }}
                  >
                    <span className="current-tile-page">
                      {this.state.currentPage+1}
                    </span>
                    <span className="current-tile-name">
                      {`: ${!editingLayerName ? currentLayerName : ''}`}
                    </span>
                  </div>
                  {editingLayerName && (
                    <TextField
                      name={`layer${this.state.currentPage}-name`}
                      disabled={loading}
                      value={this.state.layerName}
                      inputStyle={{
                        color: 'white',
                        fontSize: '0.8rem',
                        paddingLeft: '5px',
                        flex: '1 1 auto',
                      }}
                      style={{
                        overflow: 'hidden',
                        borderBottom: '1px solid white',
                        height: '24px',
                        width: 'auto',
                        flex: '1 1 auto',
                        maxWidth: '100%',
                      }}
                      underlineShow={false}
                      autoComplete='off'
                      onChange={this.onChangeLayerName.bind(this)}
                    />
                  )}
                  {!editingLayerName && (
                    <IconButton
                      disabled={loading}
                      tooltip="Edit layer name"
                      type="button"
                      onClick={this.editLayerNameClick.bind(this)}
                      style={{ width: '16px', height: 'auto', paddingLeft: '2px' }}
                      iconStyle={smallIconStyle}
                      tooltipStyles={tooltipStyle}
                    >
                      <Edit color="white" />
                    </IconButton>
                  )}
                  {editingLayerName && (
                    <>
                      <IconButton
                        disabled={loading}
                        tooltip="Save"
                        type="submit"
                        style={floatingIconBackdropStyle}
                        iconStyle={smallIconStyle}
                        tooltipStyles={tooltipStyle}
                      >
                        <Done color="green" />
                      </IconButton>
                      <IconButton
                        disabled={loading}
                        tooltip="Cancel"
                        type="button"
                        onClick={this.cancelEditLayerName.bind(this)}
                        style={floatingIconBackdropStyle}
                        iconStyle={smallIconStyle}
                        tooltipStyles={tooltipStyle}
                      >
                        <Cancel color="red" />
                      </IconButton>
                    </>
                  )}
                </form>
              )}

            </div>
          }
          <div style={{ width: '100%', display: 'flex', alignItems: 'stretch', flexGrow: '1' }}>
            <Slider sliderStyle={{marginTop: '0'}} axis='y' step={0.01} value={this.props.zoomControls[key] || 0} onChange={this.zoomControlChange.bind(this)} />
            <div id={this.osdId} style={{ flexGrow: 1 }}></div>
          </div>
        </div>
        <AddImageLayer
          editorKey={key}
          writeEnabled={writeEnabled}
          image_urls={image_urls}
          image_thumbnail_urls={image_thumbnail_urls}
          document_id={document_id}
          content={content}
          openTileSources={this.openTileSources.bind(this)}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  highlightColors: state.canvasEditor.highlightColors,
  highlightsHidden: state.canvasEditor.highlightsHidden,
  displayColorPickers: state.canvasEditor.displayColorPickers,
  addTileSourceMode: state.canvasEditor.addTileSourceMode,
  imageURLs: state.canvasEditor.imageURLs,
  isPencilMode: state.canvasEditor.isPencilMode,
  zoomControls: state.canvasEditor.zoomControls,
  globalCanvasDisplay: state.canvasEditor.globalCanvasDisplay,
  pageToChange: state.canvasEditor.pageToChange,
  loading: state.documentGrid.loading,
  editingLayerName: state.canvasEditor.editingLayerName,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  addHighlight,
  updateHighlight,
  setAddTileSourceMode,
  setImageUrl,
  setHighlightThumbnail,
  setCanvasHighlightColor,
  toggleCanvasColorPicker,
  setIsPencilMode,
  setZoomControl,
  openDeleteDialog,
  moveLayer,
  renameLayer,
  toggleEditLayerName,
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CanvasResource);
