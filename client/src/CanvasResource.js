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
import { yellow500, cyan100 } from 'material-ui/styles/colors';

import { setCanvasHighlightColor, toggleCanvasColorPicker, setImageUrl, setIsPencilMode, setAddTileSourceMode, UPLOAD_SOURCE_TYPE, setZoomControl } from './modules/canvasEditor';
import { addHighlight, updateHighlight, setHighlightThumbnail, openDeleteDialog, CANVAS_HIGHLIGHT_DELETE } from './modules/documentGrid';
import HighlightColorSelect from './HighlightColorSelect';
import AddImageLayer from './AddImageLayer';

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
    this.highlight_map = {};
    this.viewportUpdatedYet = false;
    this.currentMode = 'pan';
  }

  componentDidMount() {
    const {content, highlight_map, document_id, setCanvasHighlightColor, setAddTileSourceMode, updateHighlight, addHighlight, setHighlightThumbnail} = this.props;
    this.highlight_map = highlight_map;

    const initialColor = yellow500;
    const key = this.getInstanceKey();
    setCanvasHighlightColor(key, initialColor);
    let tileSources = [];
    if (content && content.tileSources) tileSources = content.tileSources;
    let imageUrlForThumbnail = null;

    const firstTileSource = tileSources[0];

    // TODO check the tile source before we get into this, it should at least 
    // resolve to a 200 response.

    if (firstTileSource) {
      if (firstTileSource.type === 'image' && firstTileSource.url)
        imageUrlForThumbnail = firstTileSource.url
      else {
        imageUrlForThumbnail = firstTileSource + '/full/!400,400/0/default.png'
      }
      this.props.setImageUrl(key, imageUrlForThumbnail);
    } else {
      // we don't have an image yet, so this causes AddImageLayer to display
      setAddTileSourceMode(document_id, UPLOAD_SOURCE_TYPE);
    } 

    const viewer = this.osdViewer = OpenSeadragon({
      id: this.osdId,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      showNavigationControl: false,
      tileSources,
      minZoomImageRatio: minZoomImageRatio,
      maxZoomPixelRatio: maxZoomPixelRatio,
      navigatorSizeRatio: 0.15,
      // sequenceMode: true,
      gestureSettingsMouse: { clickToZoom: false },
      showNavigator: true
    });

    const overlay = this.overlay = viewer.fabricjsOverlay({scale: fabricViewportScale});

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
    
    viewer.addHandler('page', () => {
      this.markObjectsDirtyNextUpdate = true;
    });

    viewer.addHandler('open', this.onOpen.bind(this) );

    viewer.addHandler('zoom', event => {
      const max = this.osdViewer.viewport.getMaxZoom();
      const min = this.osdViewer.viewport.getMinZoom();
      this.props.setZoomControl(this.getInstanceKey(), Math.min(Math.max((event.zoom - min) / (max - min), 0.0), 1.0));
    });

    overlay.fabricCanvas().freeDrawingBrush.color = initialColor;
    overlay.fabricCanvas().freeDrawingBrush.width = strokeWidth / overlay.fabricCanvas().getZoom();

    overlay.fabricCanvas().on('object:selected', event => {
      if (this.currentMode === 'pan' && event.target && event.target._highlightUid) {
          window.setFocusHighlight(document_id, event.target._highlightUid); // the code that pops up the annotation
          overlay.fabricCanvas().discardActiveObject();
      }
    });
    overlay.fabricCanvas().on('mouse:down', this.canvasMouseDown.bind(this) );
    overlay.fabricCanvas().on('mouse:move', this.canvasMouseMove.bind(this) );
    overlay.fabricCanvas().on('mouse:up', this.canvasMouseUp.bind(this) );
    overlay.fabricCanvas().on('object:modified', event => {
      if( this.currentMode === 'edit' && event && event.target && event.target._highlightUid ) {
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

  // if a first target for this window has been specified, pan and zoom to it.
  onOpen() {
    if( this.props.firstTarget ) {
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
        viewport.fitBoundsWithConstraints( targetRect )
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
          this.endLineMode();
        } else {
          this.drawLine(this.pointerCoords);
        }
        break;
      default:
        break;
    }
  }

  canvasMouseMove(o) {
    if( this.currentMode === 'edit' || this.currentMode === 'pan' ) return;

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
    if( this.currentMode !== 'rect' && this.currentMode !== 'circle' ) return;

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
    
    this.newShape = null;
  }

  renderHighlights(overlay, highlight_map) {
    const jsonBlob = {objects: []};
    for (const highlightUid in highlight_map) {
      const highlight = highlight_map[highlightUid];
      jsonBlob.objects.push(JSON.parse(highlight.target));
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
        object.selectable = true;

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

  drawLine(pointer) {
    const key = this.getInstanceKey();
    const lineOptions = {
      fill: 'transparent',
      selectable: false,
      stroke: this.props.highlightColors[key],
      strokeWidth: strokeWidth / this.overlay.fabricCanvas().getZoom()
    };

    if( this.lineInProgress ) {
      if (this.lineInProgress.radius) {
        // if we have a circle, replace it with a line
        const centerPoint = this.lineInProgress.getCenterPoint();
        const oldCircle = this.lineInProgress;
        this.lineInProgress = new fabric.Polyline(
          [{ x: centerPoint.x, y: centerPoint.y}, { x: pointer.x, y: pointer.y }], 
          lineOptions
        );
        this.overlay.fabricCanvas().remove(oldCircle);
        this.overlay.fabricCanvas().add(this.lineInProgress);  
      } 
      else {
        // otherwise, add to the line
        const oldPolyline = this.lineInProgress;
        const points = oldPolyline.points.concat({ x: pointer.x, y: pointer.y });
        this.lineInProgress = new fabric.Polyline( points, lineOptions );
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

  zoomControlChange(event, value) {
    if (this.osdViewer && this.osdViewer.viewport) {
      const max = this.osdViewer.viewport.getMaxZoom();
      const min = this.osdViewer.viewport.getMinZoom();
      this.osdViewer.viewport.zoomTo(min + ((max - min) * value));
    }
  }

  getInstanceKey() {
    const { document_id, timeOpened } = this.props;
    return `${document_id}-${timeOpened}`;
  }

  render() {
    const { document_id, content, image_thumbnail_urls, addTileSourceMode, image_urls, highlightsHidden, displayColorPickers, highlightColors, toggleCanvasColorPicker, setCanvasHighlightColor, writeEnabled, lockedByMe, globalCanvasDisplay } = this.props;
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

    const iconStyle = {
      width: '18px',
      height: '18px'
    }

    let editable = ( writeEnabled && lockedByMe );
    const mode = addTileSourceMode[document_id];
    const highlightHidden = !editable && highlightsHidden[key]

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
              <IconButton tooltip='Pan the image.' onClick={this.panClick.bind(this)} style={this.currentMode === 'pan' ? iconBackdropStyleActive : iconBackdropStyle} iconStyle={iconStyle}>
                <PanTool />
              </IconButton>
              <IconButton tooltip='Move and resize shapes.' onClick={this.editShapeClick.bind(this)} style={this.currentMode === 'edit' ? iconBackdropStyleActive : iconBackdropStyle} iconStyle={iconStyle}>
                <CropFree />
              </IconButton>
              <IconButton tooltip='Draw rectangular shapes.' onClick={this.rectClick.bind(this)} style={this.currentMode === 'rect' ? iconBackdropStyleActive : iconBackdropStyle} iconStyle={iconStyle}>
                <CropSquare />
              </IconButton>
              <IconButton tooltip='Draw circular shapes.' onClick={this.circleClick.bind(this)} style={this.currentMode === 'circle' ? iconBackdropStyleActive : iconBackdropStyle} iconStyle={iconStyle}>
                <PanoramaFishEye />
              </IconButton>
              <IconButton tooltip='Add markers.' onClick={this.markerClick.bind(this)} style={this.currentMode === 'marker' ? iconBackdropStyleActive : iconBackdropStyle} iconStyle={iconStyle}>
                <Place />
              </IconButton>
              <IconButton tooltip='Enter free drawing mode.' onClick={this.pencilClick.bind(this)} style={this.currentMode === 'freeDraw' ? iconBackdropStyleActive : iconBackdropStyle} iconStyle={iconStyle}>
                <Edit />
              </IconButton>
              <IconButton tooltip='Draw lines.' onClick={this.lineClick.bind(this)} style={this.currentMode === 'lineDraw' ? iconBackdropStyleActive : iconBackdropStyle} iconStyle={iconStyle}>
                <ShowChart />
              </IconButton>
              <IconButton tooltip='Change the color of a shape.' onClick={this.colorizeClick.bind(this)} style={this.currentMode === 'colorize' ? iconBackdropStyleActive : iconBackdropStyle} iconStyle={iconStyle}>
                <Colorize />
              </IconButton>
              <IconButton tooltip='Delete selected highlight.' onClick={this.deleteHighlightClick.bind(this)} style={iconBackdropStyleSpaced} iconStyle={iconStyle}>
                <DeleteForever />
              </IconButton>
              {/* <IconButton tooltip='Add more layers to image.' onClick={() => {setAddTileSourceMode(document_id, UPLOAD_SOURCE_TYPE);}} style={iconBackdropStyleSpaced} iconStyle={iconStyle}>
                <AddToPhotos />
              </IconButton> */}
            </div>
          }
          <div style={{ width: '100%', display: 'flex', alignItems: 'stretch', flexGrow: '1' }}>
            <Slider sliderStyle={{marginTop: '0'}} axis='y' step={0.1} value={this.props.zoomControls[key] || 0} onChange={this.zoomControlChange.bind(this)} />
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
          osdViewer={this.osdViewer}
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
  globalCanvasDisplay: state.canvasEditor.globalCanvasDisplay
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
  openDeleteDialog
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CanvasResource);
