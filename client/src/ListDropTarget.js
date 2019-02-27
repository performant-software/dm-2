import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { DropTarget } from 'react-dnd';
import { openFolder, closeFolder, moveFolder } from './modules/folders';
import { moveDocument } from './modules/documentGrid';
import { loadProject } from './modules/project';
import DocumentFolder from './DocumentFolder';
import {NativeTypes} from 'react-dnd-html5-backend';

const ListTargetInner = props => {
  const { isFolder, isOver, writeEnabled, openDocumentIds, item, openFolderContents, allDraggable } = props;
  if (isFolder) {
    let contents = openFolderContents[item.id];
    return <DocumentFolder
      item={item} key={`${item.document_kind}-${item.id}`}
      inContents={true}
      isDraggable={allDraggable}
      writeEnabled={writeEnabled}
      openDocumentIds={openDocumentIds}
      isOpen={contents}
      isOver={isOver}
      contents={contents}
      handleClick={() => {contents ? props.closeFolder(item.id) : props.openFolder(item.id);}}
      handleDoubleClick={() => {}}
    />
  }
  else {
    return (
      <div style={{ width: 'auto', height: '8px', margin: '0 8px' }}>
        <div style={{ width: 'auto', height: '0', marginTop: '4px', borderTop: isOver ? '2px solid #666' : 'none'}}></div>
      </div>
    );
  }
}

function parseIIIFManifest(manifestJSON) {
  const manifest = JSON.parse(manifestJSON);

  if( manifest === null ) {
      return [];
  }

  // IIIF presentation 2.0
  // manifest["sequences"][n]["canvases"][n]["images"][n]["resource"]["service"]["@id"]

  let images = [];

  let sequence = manifest.sequences[0];
  if( sequence !== null && sequence.canvases !== null ) {
      sequence.canvases.forEach( (canvas) => {
      let image = canvas.images[0]

      if( image !== null && 
          image.resource !== null &&
          image.resource.service !== null ) {
          images.push({
              name: canvas.label,
              tile_source: image.resource.service["@id"]
          });
      }
      }); 
  }

  return images;
}

function handleDMItemDrop(props,monitorItem) {
  const handler = monitorItem.isFolder ? props.moveFolder : props.moveDocument;
  const targetID = props.targetParentType === 'Project' ? null : props.targetParentId
  handler(monitorItem.id, targetID, props.buoyancyTarget )
  .then(() => {
    // TODO these shouldn't happen until we get an OK back from the server
    if (monitorItem.existingParentType === 'Project' || props.targetParentType === 'Project')
      props.loadProject(props.projectId);
    if (monitorItem.existingParentType === 'DocumentFolder' && props.openFolderContents[monitorItem.existingParentId])
      props.openFolder(monitorItem.existingParentId);
    if (props.targetParentType === 'DocumentFolder' && props.openFolderContents[props.targetParentId])
      props.openFolder(props.targetParentId);
  });
}

function handleFileSystemDrop(props,monitorItem) {
  const reader = new FileReader();

  reader.onload = (e) => {
    let images
    try {
      images = parseIIIFManifest(reader.result);
    }
    catch(e) {
      console.log( "error parsing")
    }
    if( images ) {
      debugger
      console.log( `found ${images.length} images`)
    } else {
      console.log( "no images found.")
    }
  }
  reader.readAsText(monitorItem.files[0]);
}

const listDropTarget = {
  canDrop(props, monitor) {
    const monitorItem = monitor.getItem();
    if( props.item && monitorItem.isFolder && (monitorItem.id === props.item.id || (monitorItem.descendant_folder_ids && monitorItem.descendant_folder_ids.includes(props.item.id)))) {
      return false;
    }
    return true;
  },

  drop(props, monitor) {
    if (!monitor.didDrop()) {
      const monitorItem = monitor.getItem();
      if( monitorItem.files ) {
        handleFileSystemDrop(props,monitorItem)
      } else {
        handleDMItemDrop(props,monitorItem)
      }
    }
  }
};

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
  };
}

class ListDropTarget extends Component {
  render() {
    return this.props.connectDropTarget(
      <div>
        <ListTargetInner {...this.props} />
      </div>
    );
  }
}
ListDropTarget = DropTarget(['contentsSummary', NativeTypes.FILE], listDropTarget, collect)(ListDropTarget);

const mapStateToProps = state => ({
  openFolderContents: state.folders.openFolderContents,
  projectId: state.project.id
});

const mapDispatchToProps = dispatch => bindActionCreators({
  openFolder,
  closeFolder,
  moveFolder,
  moveDocument,
  loadProject
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ListDropTarget);
