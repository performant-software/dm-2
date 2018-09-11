import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import OpenSeadragon from 'openseadragon';
import { fabric } from './fabricAdapted';//'openseadragon-fabricjs-overlay/fabric/fabric.adapted';
import 'openseadragon-fabricjs-overlay';
import ActiveStorageProvider from 'react-activestorage-provider';
import SelectField from 'material-ui/SelectField';
import Slider from 'material-ui/Slider';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
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
import { yellow500, cyan100 } from 'material-ui/styles/colors';

import { setCanvasHighlightColor, toggleCanvasColorPicker, setAddTileSourceMode, setIsPencilMode, setLineInProgress, setZoomControl, IIIF_TILE_SOURCE_TYPE, IMAGE_URL_SOURCE_TYPE, UPLOAD_SOURCE_TYPE } from './modules/canvasEditor';
import { replaceDocument, updateDocument, setDocumentThumbnail, addHighlight, updateHighlight, setHighlightThumbnail, openDeleteDialog, CANVAS_HIGHLIGHT_DELETE } from './modules/documentGrid';
import HighlightColorSelect from './HighlightColorSelect';

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

const tileSourceTypeLabels = {};
tileSourceTypeLabels[IIIF_TILE_SOURCE_TYPE] = {select: 'IIIF', textField: 'IIIF info.json URL'};
tileSourceTypeLabels[IMAGE_URL_SOURCE_TYPE] = {select: 'Image URL', textField: 'External static image URL'};
tileSourceTypeLabels[UPLOAD_SOURCE_TYPE] = {select: 'Upload image', textField: 'Choose files'};

const strokeWidth = 2.0;
const markerRadius = 8.0;

class CanvasResource extends Component {
  constructor(props) {
    super(props);
    this.osdId =`openseadragon-${this.props.document_id}-${Date.now()}`;
    this.osdViewer = null;
    this.highlight_map = {};
    this.viewportUpdatedYet = false;
    this.imageUrlForThumbnail = null;
    this.currentMode = 'pan';
  }

  componentDidMount() {
    const {content, highlight_map, document_id, setCanvasHighlightColor, updateHighlight, addHighlight, setHighlightThumbnail} = this.props;
    this.highlight_map = highlight_map;

    const initialColor = yellow500;
    const key = this.getInstanceKey();
    setCanvasHighlightColor(key, initialColor);
    let tileSources = [];
    if (content && content.tileSources) tileSources = content.tileSources;

    const firstTileSource = tileSources[0];
    if (firstTileSource) {
      if (firstTileSource.type === 'image' && firstTileSource.url)
        this.imageUrlForThumbnail = firstTileSource.url;
      else {
        const baseUrl = firstTileSource.split('info.json')[0];
        this.imageUrlForThumbnail = baseUrl + 'full/!400,400/0/default.png';
      }
    }

    const viewer = OpenSeadragon({
      id: this.osdId,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      showNavigationControl: false,
      tileSources,
      sequenceMode: true,
      gestureSettingsMouse: { clickToZoom: false },
      showNavigator: true
    });

    const overlay = this.overlay = viewer.fabricjsOverlay({scale: 2000});

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

    viewer.addHandler('zoom', event => {
      const max = this.osdViewer.viewport.getMaxZoom();
      const min = this.osdViewer.viewport.getMinZoom();
      this.props.setZoomControl(document_id, Math.min(Math.max((event.zoom - min) / (max - min), 0.0), 1.0));
    });

    // overlay.fabricCanvas().on('mouse:move', function(options) {
    //   if (options.target && options.target.highlightUid) {
    //     window.setFocusHighlight(options.target.highlightUid);
    //   }
    // });

    overlay.fabricCanvas().freeDrawingBrush.color = initialColor;
    overlay.fabricCanvas().freeDrawingBrush.width = strokeWidth / overlay.fabricCanvas().getZoom();

    // overlay.fabricCanvas().on('mouse:dblclick', event => {
    //   if (event.target && event.target._highlightUid) {
    //     // this.highlightFocusTimeout = window.setTimeout(() => {
    //       window.setFocusHighlight(document_id, event.target._highlightUid);
    //     // }, 1000);
    //   }
    // });
    overlay.fabricCanvas().on('mouse:out', this.clearFocusHighlightTimeout.bind(this));
    overlay.fabricCanvas().on('mouse:down', this.canvasMouseDown.bind(this) );
    overlay.fabricCanvas().on('mouse:move', this.canvasMouseMove.bind(this) );
    overlay.fabricCanvas().on('mouse:up', this.canvasMouseUp.bind(this) );
    overlay.fabricCanvas().on('object:modified', event => {
      if( this.currentMode === 'edit' && event && event.target && event.target._highlightUid ) {
          const highlight_id = this.highlight_map[event.target._highlightUid].id;
          if (highlight_id && this.imageUrlForThumbnail) {
            updateHighlight(highlight_id, {target: JSON.stringify(event.target.toJSON(['_highlightUid', '_isMarker']))});
            setHighlightThumbnail(highlight_id, this.imageUrlForThumbnail, event.target.aCoords, event.target.toSVG());
          }
      }
    });
    // process paths created with pencil tool
    overlay.fabricCanvas().on('path:created', event => {
      if (event.path) {
        let path = event.path;
        const highlightUid = `dm_canvas_highlight_${Date.now()}`;
        path._highlightUid = highlightUid;
        this.overlay.fabricCanvas().setActiveObject(path);
        let imageUrlForThumbnail = this.imageUrlForThumbnail;
        addHighlight(document_id, highlightUid, JSON.stringify(path.toJSON(['_highlightUid', '_isMarker'])), this.overlay.fabricCanvas().freeDrawingBrush.color, 'Pencil highlight', savedHighlight => {setHighlightThumbnail(savedHighlight.id, imageUrlForThumbnail, path.aCoords, path.toSVG());});
      }
    });
    window.onresize = function() {
      overlay.resize();
      overlay.resizecanvas();
    };

    this.osdViewer = viewer;
  }

  canvasMouseDown(event) {
    
    if( this.currentMode === 'edit' || this.currentMode === 'pan' ) return;

    const key = this.getInstanceKey();
    this.isMouseDown = true;
    this.pointerCoords = this.overlay.fabricCanvas().getPointer(event.e);
    this.clearFocusHighlightTimeout();

    switch(this.currentMode) {
      case 'marker':
        this.markerClickHelper(this.pointerCoords);
        break;

      case 'rect':
        this.newRect = new fabric.Rect({
          left: this.pointerCoords.x,
          top: this.pointerCoords.y,
          width: 20,
          height: 20,
          fill: 'transparent'
        });
        this.createHighlight(this.newRect);
        break;

      case 'circle':
        this.newCircle = new fabric.Circle({
          radius: 15,
          left: this.pointerCoords.x,
          top: this.pointerCoords.y,
          fill: 'transparent',
          originX: 'center', originY: 'center' // when circle is resized, the center remains constant
        });
        this.createHighlight(this.newCircle);
        break;

      case 'lineDraw':
        const lineInProgress = this.props.linesInProgress[this.props.document_id];
        if (lineInProgress) {
          if (this.tempPolyline) this.overlay.fabricCanvas().remove(this.tempPolyline);
          const pointer = this.overlay.fabricCanvas().getPointer(event.e);
          const newLineInProgress = lineInProgress.concat([{ x: pointer.x, y: pointer.y }]);
          if (newLineInProgress.length > 1) {
            this.tempPolyline = new fabric.Polyline(newLineInProgress, {
              fill: 'transparent',
              selectable: false,
              stroke: this.props.highlightColors[key],
              strokeWidth: strokeWidth / this.overlay.fabricCanvas().getZoom()
            });
          }
          else {
            let radius = markerRadius / this.overlay.fabricCanvas().getZoom()
            this.tempPolyline = new fabric.Circle({
              radius,
              left: pointer.x - radius,
              top: pointer.y - radius,
              selectable: false,
              fill: this.props.highlightColors[key],
              stroke: 'transparent',
              _isMarker: true
            });
          }
          this.overlay.fabricCanvas().add(this.tempPolyline);
          this.props.setLineInProgress(this.props.document_id, newLineInProgress);
        }
        break;
    }
  }

  canvasMouseMove(o) {
    if( this.currentMode === 'edit' || this.currentMode === 'pan' ) return;

    if( this.isMouseDown ) {
      const mouse = this.overlay.fabricCanvas().getPointer(o.e);

      switch(this.currentMode) {
        case 'rect':
          if(mouse.x < this.pointerCoords.x) {
            this.newRect.set({left: mouse.x });
          }
          if(mouse.y < this.pointerCoords.y) {
            this.newRect.set({top: mouse.y });
          }
    
          this.newRect.set({width: Math.abs(this.pointerCoords.x - mouse.x) });
          this.newRect.set({height: Math.abs(this.pointerCoords.y - mouse.y) });
    
          this.overlay.fabricCanvas().renderAll();
          break;
        case 'circle':
          if( Math.abs(mouse.x - this.pointerCoords.x) > Math.abs(mouse.y - this.pointerCoords.y) ) {
            this.newCircle.set({radius: Math.abs( mouse.x - this.pointerCoords.x ) });
          } else {
            this.newCircle.set({radius: Math.abs( mouse.y - this.pointerCoords.y ) });
          }
    
          this.overlay.fabricCanvas().renderAll();
          break;
      }  
    }
  }

  canvasMouseUp() {
    if( this.currentMode === 'edit' || this.currentMode === 'pan' ) return;

    this.clearFocusHighlightTimeout.bind(this);
    this.isMouseDown = false;
    const key = this.getInstanceKey();

    switch(this.currentMode) {
      case 'rect': {
        this.props.addHighlight(
          this.props.document_id, 
          this.newRect._highlightUid, 
          JSON.stringify(this.newRect.toJSON(['_highlightUid', '_isMarker'])), 
          this.props.highlightColors[key], 
          'Rectangular highlight', 
          savedHighlight => {
              this.props.setHighlightThumbnail(
                savedHighlight.id, 
                this.imageUrlForThumbnail, 
                this.newRect.aCoords, 
                this.newRect.toSVG()
              );
          });
        break;
      }
      
      case 'circle': {
        this.props.addHighlight(
          this.props.document_id, 
          this.newCircle._highlightUid, 
          JSON.stringify(this.newCircle.toJSON(['_highlightUid', '_isMarker'])), 
          this.props.highlightColors[key], 
          'Circular highlight', 
          savedHighlight => {
              this.props.setHighlightThumbnail(
                savedHighlight.id, 
                this.imageUrlForThumbnail, 
                this.newCircle.aCoords, 
                this.newCircle.toSVG()
              );
          });
        break;
      }
    }
  }

  clearFocusHighlightTimeout() {
    if (window.highlightFocusTimeout)
      window.clearTimeout(window.highlightFocusTimeout);
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
        if (object._isMarker) {
          object.hasControls = false; // removes ability to reshape markers
          object.radius = markerRadius / zoom;
        }
        object.strokeWidth = strokeWidth / zoom;
        object.dirty = true;
        object.selectable = this.props.writeEnabled;
        if (!this.props.writeEnabled) {
          object.hoverCursor = 'default';
        }
      });
    });
  }

  stopDrawing() {
    if (this.props.linesInProgress[this.props.document_id]) this.endLineMode();
    // turn off pencil mode
    this.overlay.fabricCanvas().isDrawingMode = false;
    this.props.setIsPencilMode(this.props.document_id, false);
  }

  panClick() {
    this.stopDrawing()
    // TODO disable editing and enable highlight popup
    this.currentMode = 'pan';
    this.osdViewer.setMouseNavEnabled(true); 
  }

  editShapeClick() {
    this.stopDrawing()
    this.currentMode = 'edit';
    this.osdViewer.setMouseNavEnabled(false);
  }

  rectClick() {
    this.stopDrawing()
    this.currentMode = 'rect';
    this.osdViewer.setMouseNavEnabled(false);
  }

  circleClick() {
    this.stopDrawing()
    this.currentMode = 'circle';
    this.osdViewer.setMouseNavEnabled(false);
  }

  markerClick() {
    this.stopDrawing()
    this.currentMode = 'marker';
    this.osdViewer.setMouseNavEnabled(false);
  }

  markerClickHelper(pCoords) {
    let markerFill = fabric.Color.fromHex(this.props.highlightColors[this.getInstanceKey()]);
    markerFill.setAlpha(0.3);
    var rad = markerRadius / this.overlay.fabricCanvas().getZoom();
    let marker = new fabric.Circle({
      radius: rad,
      left: pCoords.x - rad, // offset to put marker at center of click
      top: pCoords.y - rad,
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
    this.createHighlight(marker, 'Marker highlight');
  }

  pencilClick() {
    this.currentMode = 'freeDraw';
    this.osdViewer.setMouseNavEnabled(false);

    const wasDrawingMode = this.overlay.fabricCanvas().isDrawingMode;
    this.osdViewer.setMouseNavEnabled(wasDrawingMode);
    this.overlay.fabricCanvas().isDrawingMode = !wasDrawingMode;
    this.props.setIsPencilMode(this.props.document_id, !wasDrawingMode);

    // turn off line mode if turning on pencil mode
    if (this.props.linesInProgress[this.props.document_id]) this.endLineMode();
  }

  endLineMode() {
    const lineInProgress = this.props.linesInProgress[this.props.document_id];
    if (this.tempPolyline) this.overlay.fabricCanvas().remove(this.tempPolyline);
    this.tempPolyline = null;
    if (lineInProgress.length > 1) {
      let line = new fabric.Polyline(lineInProgress, {
        fill: 'transparent'
      });
      this.createHighlight(line, 'Line highlight');
    }
    this.overlay.fabricCanvas().defaultCursor = 'default';
    this.props.setLineInProgress(this.props.document_id, null);
  }

  lineClick() {
    const lineInProgress = this.props.linesInProgress[this.props.document_id];
    if (lineInProgress) {
      this.endLineMode();
    }
    else {
      // turn off pencil mode if turning on line mode
      this.overlay.fabricCanvas().isDrawingMode = false;
      this.osdViewer.setMouseNavEnabled(true);
      this.props.setIsPencilMode(this.props.document_id, false);

      //turn off other modes
      this.isMarkerMode = false;
      this.isCircleMode = false;
      this.isRectMode = false;

      this.overlay.fabricCanvas().defaultCursor = 'crosshair';
      this.props.setLineInProgress(this.props.document_id, []);
    }
  }

  createHighlight(fabricObject) {
    const highlightUid = `dm_canvas_highlight_${Date.now()}`;
    const { highlightColors } = this.props;
    const instanceKey = this.getInstanceKey();
    fabricObject['_highlightUid'] = highlightUid;
    fabricObject.stroke = highlightColors[instanceKey];
    fabricObject.strokeWidth = strokeWidth / this.overlay.fabricCanvas().getZoom();
    fabricObject.selectable = true;
    this.overlay.fabricCanvas().add(fabricObject);
    this.overlay.fabricCanvas().setActiveObject(fabricObject);
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

  addTileSource() {
    const newContent = {};
    if (this.props.content) Object.assign(newContent, this.props.content);
    const existingTileSources = newContent.tileSources || [];
    const shouldSetThumbnail = existingTileSources.length < 1;

    let newTileSources = [];
    switch (this.props.addTileSourceMode[this.props.document_id]) {
      case UPLOAD_SOURCE_TYPE:
        if (this.props.image_urls && this.props.image_urls.length > 0) {
          let existingImageUrls = [];
          existingTileSources.forEach(source => {
            if (source.type && source.url && source.type === 'image')
              existingImageUrls.push(source.url);
          });
          this.props.image_urls.forEach(url => {
            if (!existingImageUrls.includes(url)) {
              newTileSources.push({
                type: 'image',
                url
              });
            }
          });
          if (shouldSetThumbnail && newTileSources.length > 0)
            this.imageUrlForThumbnail = newTileSources[0].url;
        }
        break;

      case IMAGE_URL_SOURCE_TYPE:
        newTileSources.push({
          type: 'image',
          url: this.newTileSourceValue
        });
        if (shouldSetThumbnail)
          this.imageUrlForThumbnail = this.newTileSourceValue;
        break;

      case IIIF_TILE_SOURCE_TYPE:
        if (shouldSetThumbnail) {
          const baseUrl = this.newTileSourceValue.split('info.json')[0];
          this.imageUrlForThumbnail = baseUrl + 'full/!160,160/0/default.png';
        }
      default:
        newTileSources.push(this.newTileSourceValue);
    }

    newContent.tileSources = existingTileSources.concat(newTileSources);
    this.props.updateDocument(this.props.document_id, {
      content: newContent
    });
    if (this.osdViewer) {
      this.osdViewer.open(newContent.tileSources);
    }
    this.newTileSourceValue = '';
    this.props.setAddTileSourceMode(this.props.document_id, null);

    if (shouldSetThumbnail && this.imageUrlForThumbnail)
      this.props.setDocumentThumbnail(this.props.document_id, this.imageUrlForThumbnail);
  }

  zoomControlChange(event, value) {
    if (this.osdViewer && this.osdViewer.viewport) {
      const max = this.osdViewer.viewport.getMaxZoom();
      const min = this.osdViewer.viewport.getMinZoom();
      this.osdViewer.viewport.zoomTo(min + (max - min) * value);
    }
  }

  getInstanceKey() {
    const { document_id, timeOpened } = this.props;
    return `${document_id}-${timeOpened}`;
  }

  render() {
    const { document_id, image_thumbnail_urls, displayColorPickers, highlightColors, toggleCanvasColorPicker, setCanvasHighlightColor, addTileSourceMode, setAddTileSourceMode, isPencilMode, linesInProgress, replaceDocument, writeEnabled, globalCanvasDisplay } = this.props;
    const mode = addTileSourceMode[document_id];
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

    return (
      <div style={{ flexGrow: '1', display: 'flex', flexGrow: '1', padding: '10px' }}>
        <div style={{ display: (mode || !globalCanvasDisplay) ? 'none' : 'flex', flexDirection: 'column', width: '100%' }}>
          {writeEnabled &&
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
              <IconButton tooltip={isPencilMode[document_id] ? 'End free drawing' : 'Start free drawing'} onClick={this.pencilClick.bind(this)} style={this.currentMode === 'freeDraw' ? iconBackdropStyleActive : iconBackdropStyle} iconStyle={iconStyle}>
                <Edit />
              </IconButton>
              <IconButton tooltip={linesInProgress[document_id] ? 'End line drawing' : 'Start line drawing'} onClick={this.lineClick.bind(this)} style={this.currentMode === 'lineDraw' ? iconBackdropStyleActive : iconBackdropStyle} iconStyle={iconStyle}>
                <ShowChart />
              </IconButton>
              <IconButton tooltip={'Delete selected highlight'} onClick={this.deleteHighlightClick.bind(this)} style={iconBackdropStyleSpaced} iconStyle={iconStyle}>
                <DeleteForever />
              </IconButton>
              <IconButton tooltip='Add more layers to image' onClick={() => {setAddTileSourceMode(document_id, UPLOAD_SOURCE_TYPE);}} style={iconBackdropStyleSpaced} iconStyle={iconStyle}>
                <AddToPhotos />
              </IconButton>
            </div>
          }
          <div style={{ width: '100%', display: 'flex', alignItems: 'stretch', flexGrow: '1' }}>
            <Slider sliderStyle={{marginTop: '0'}} axis='y' step={0.1} value={this.props.zoomControls[document_id] || 0} onChange={this.zoomControlChange.bind(this)} />
            <div id={this.osdId} style={{ flexGrow: 1 }}></div>
          </div>
        </div>
        <div style={{ display: mode && writeEnabled ? 'initial' : 'none' }}>
          <SelectField
            style={{ color: 'white' }}
            labelStyle={{ color: 'white' }}
            floatingLabelStyle={{ color: 'white' }}
            floatingLabelText='Image source type'
            value={addTileSourceMode[document_id]}
            onChange={(event, index, newValue) => {setAddTileSourceMode(document_id, newValue);}}
          >
            <MenuItem value={UPLOAD_SOURCE_TYPE} primaryText={tileSourceTypeLabels[UPLOAD_SOURCE_TYPE].select} />
            <MenuItem value={IIIF_TILE_SOURCE_TYPE} primaryText={tileSourceTypeLabels[IIIF_TILE_SOURCE_TYPE].select} />
            <MenuItem value={IMAGE_URL_SOURCE_TYPE} primaryText={tileSourceTypeLabels[IMAGE_URL_SOURCE_TYPE].select} />
          </SelectField>
          {addTileSourceMode[document_id] !== UPLOAD_SOURCE_TYPE &&
            <div>
              <TextField
                id={this.osdId + '-addtilesource'}
                inputStyle={{ color: 'white' }}
                floatingLabelStyle={{ color: 'white' }}
                floatingLabelText={mode ? tileSourceTypeLabels[mode].textField : ''}
                onChange={(event, newValue) => {this.newTileSourceValue = newValue;}}
              />
              <br /><br />
            </div>
          }
          {addTileSourceMode[document_id] === UPLOAD_SOURCE_TYPE &&
            <ActiveStorageProvider
              endpoint={{
                path: `/documents/${document_id}/add_images`,
                model: 'Document',
                attribute: 'images',
                method: 'PUT'
              }}
              multiple={true}
              onSubmit={document => {
                replaceDocument(document);
              }}
              render={({ handleUpload, uploads, ready}) => (
                <div>
                  <RaisedButton
                    containerElement='label'
                    label={mode ? tileSourceTypeLabels[mode].textField : 'Choose files'}
                  >
                    <input
                      type='file'
                      multiple={true}
                      disabled={!ready}
                      onChange={e => handleUpload(e.currentTarget.files)}
                      style={{ display: 'none' }}
                    />
                  </RaisedButton>
                  {uploads.map(
                    upload =>
                      upload.state === 'waiting' ? (
                        <p style={{ color: 'white' }} key={upload.id}>Waiting to upload {upload.file.name}</p>
                      ) : upload.state === 'uploading' ? (
                        <p style={{ color: 'white' }}  key={upload.id}>
                          Uploading {upload.file.name}: {upload.progress}%
                        </p>
                      ) : upload.state === 'error' ? (
                        <p style={{ color: 'white' }}  key={upload.id}>
                          Error uploading {upload.file.name}: {upload.error}
                        </p>
                      ) : (
                        <p style={{ color: 'white' }}  key={upload.id}>Finished uploading {upload.file.name}</p>
                      )
                  )}
                  <br /><br />
                  {image_thumbnail_urls.map((thumbnailUrl, index) =>
                    <img key={`thumbnail-${document_id}-${index}`} src={thumbnailUrl} style={{ maxWidth: '40px', maxHeight: '40px' }} />
                  )}
                </div>
              )}
            />
          }
          <FlatButton label='Cancel' style={{ color: 'white' }} onClick={() => {setAddTileSourceMode(document_id, null);}} />
          <FlatButton label='Add image source' style={{ color: 'white' }} onClick={this.addTileSource.bind(this)} />
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  highlightColors: state.canvasEditor.highlightColors,
  displayColorPickers: state.canvasEditor.displayColorPickers,
  addTileSourceMode: state.canvasEditor.addTileSourceMode,
  isPencilMode: state.canvasEditor.isPencilMode,
  linesInProgress: state.canvasEditor.linesInProgress,
  zoomControls: state.canvasEditor.zoomControls,
  globalCanvasDisplay: state.canvasEditor.globalCanvasDisplay
});

const mapDispatchToProps = dispatch => bindActionCreators({
  addHighlight,
  updateHighlight,
  setHighlightThumbnail,
  setCanvasHighlightColor,
  toggleCanvasColorPicker,
  setAddTileSourceMode,
  setIsPencilMode,
  setLineInProgress,
  setZoomControl,
  updateDocument,
  setDocumentThumbnail,
  replaceDocument,
  openDeleteDialog
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CanvasResource);
