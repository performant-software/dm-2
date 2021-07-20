import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { DropTarget } from 'react-dnd';
import { openFolder, closeFolder, moveFolder, addTree } from './modules/folders';
import { addLink, moveLink } from './modules/annotationViewer';
import { moveDocument } from './modules/documentGrid';
import { loadProject } from './modules/project';
import DocumentFolder from './DocumentFolder';
import {NativeTypes} from 'react-dnd-html5-backend';
import { parseIIIFManifest } from './modules/iiif';

const ListTargetInner = props => {
  const { isFolder, isOver, writeEnabled, adminEnabled, openDocumentIds, item, openFolderContents, allDraggable } = props;
  if (isFolder) {
    let contents = openFolderContents[item.id];
    return <DocumentFolder
      item={item} key={`${item.document_kind}-${item.id}`}
      inContents={true}
      isDraggable={allDraggable}
      writeEnabled={writeEnabled}
      adminEnabled={adminEnabled}
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

function handleFileSystemDrop(props,monitorItem) {
  const { addTree, targetParentId, targetParentType, buoyancyTarget } = props
  const droppedFile = monitorItem.files[0]
  const droppedFileName = droppedFile.name
  let reader = new FileReader();

  reader.onload = (e) => {
    try {
      let sequences = parseIIIFManifest(reader.result);
      if( sequences ) {        
        // for manifests with a single sequence, don't create an extra subfolder
        let tree = ( sequences.length === 1 ) ? {
          name: droppedFileName,
          position: buoyancyTarget,
          children: sequences[0].children
        } : {
          name: droppedFileName,
          position: buoyancyTarget,
          children: sequences
        }
        console.log(tree)
        addTree( targetParentId, targetParentType, tree)
      }
    }
    catch(e) {
      console.log( "Unable to parse IIIF Manifest: "+e)
    }
  }
  reader.readAsText(droppedFile);
}

function handleDMItemDrop(props,monitorItem) {
  let handler = props.moveDocument;
  let idToPass = monitorItem.id;
  if (props.inContents && monitorItem.isFolder) {
    handler = props.moveFolder;
  } else if (!props.inContents) {
    if (
      props.targetParentType === monitorItem.linkable_type 
      && props.targetParentId === monitorItem.linkable_id
    ) {
      // Target and monitorItem are the same
      return;
    } else if (
      !props.items.find(item => 
        (monitorItem.linkable_type === 'Highlight' && item.highlight_id === monitorItem.linkable_id)
        || (monitorItem.linkable_type === 'Document' && item.document_id === monitorItem.linkable_id)
      )
    ) {
      // Link isn't yet in list
      const origin = {
        linkable_id: props.highlightId,
        linkable_type: 'Highlight'
      }
      props.addLink(origin, monitorItem, props.buoyancyTarget);
      return;
    } else {
      // Link in list, just needs to reorder
      idToPass = monitorItem.link_id;
      handler = props.moveLink;
    }
  }
  const targetID = props.targetParentType === 'Project' ? null : props.targetParentId;
  handler(idToPass, targetID, props.buoyancyTarget )
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

const listDropTarget = {
  canDrop(props, monitor) {
    const monitorItem = monitor.getItem();
    if (
      (props.item && monitorItem.isFolder && (monitorItem.id === props.item.id 
        || (monitorItem.descendant_folder_ids && monitorItem.descendant_folder_ids.includes(props.item.id))
      )) 
      || (monitorItem.isLinkItem && props.inContents)
      || (monitorItem.files && !props.inContents)
    ) {
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
  componentDidUpdate(prevProps) {
    if (this.props.addedLink !== prevProps.addedLink) {
      const { id, target } = this.props.addedLink;
      if (target === this.props.buoyancyTarget) {
        this.props.moveLink(id, null, target+1);
      }
    }
  }
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
  projectId: state.project.id,
  addedLink: state.annotationViewer.addedLink,
});

const mapDispatchToProps = dispatch => bindActionCreators({
  openFolder,
  closeFolder,
  moveFolder,
  moveDocument,
  addLink,
  moveLink,
  loadProject,
  addTree
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ListDropTarget);
