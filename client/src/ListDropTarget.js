import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { DropTarget } from 'react-dnd';
import { openFolder, closeFolder, moveFolder, addTree } from './modules/folders';
import { openDocumentPopover, closeDocumentPopover, showBatchImagePrompt } from './modules/project';
import { createTextDocument, createCanvasDocument } from './modules/documentGrid';
import { createFolder } from './modules/folders';
import { addLink, moveLink } from './modules/annotationViewer';
import { moveDocument } from './modules/documentGrid';
import { loadProject } from './modules/project';
import DocumentFolder from './DocumentFolder';
import {NativeTypes} from 'react-dnd-html5-backend';
import { parseIIIFManifest } from './modules/iiif';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';

const ListTargetInner = props => {
  const { isFolder, isOver, itemType, inContents, writeEnabled, adminEnabled, openDocumentIds, item, openFolderContents, allDraggable, targetParentId, buoyancyTarget } = props;
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
    const isNewItem = ['newDocument', 'newFolder'].includes(itemType);
    const shouldShowOver = isOver && !(!inContents && isNewItem);
    return (
      <div style={{ width: 'auto', height: '8px', margin: '0 8px' }}>
        <div style={{ width: 'auto', height: '0', marginTop: '4px', borderTop: shouldShowOver ? '2px solid #666' : 'none'}}></div>
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
        linkable_id: props.highlightId || props.documentId,
        linkable_type: props.highlightId ? 'Highlight' : 'Document'
      }
      props.addLink(origin, monitorItem, props.buoyancyTarget, origin.linkable_type);
      return;
    } else {
      // Link in list, just needs to reorder
      idToPass = monitorItem.link_id;
      handler = props.moveLink;
    }
  }
  const targetID = props.targetParentType === 'Project' ? null : props.targetParentId;
  handler(idToPass, targetID, props.targetParentType, props.buoyancyTarget )
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
    const itemType = monitor.getItemType();
    if (
      (props.item && monitorItem.isFolder && (monitorItem.id === props.item.id 
        || (monitorItem.descendant_folder_ids && monitorItem.descendant_folder_ids.includes(props.item.id))
      )) 
      || (monitorItem.isLinkItem && props.inContents)
      || (monitorItem.files && !props.inContents)
      || (!props.inContents && ['newDocument', 'newFolder'].includes(itemType))
    ) {
      return false;
    }
    return true;
  },

  drop(props, monitor) {
    const {
      buoyancyTarget,
      createCanvasDocument,
      createFolder,
      createTextDocument,
      targetParentId,
      targetParentType,
    } = props;

    if (!monitor.didDrop()) {
      const monitorItem = monitor.getItem();
      const itemType = monitor.getItemType();
      if (monitorItem.files) {
        handleFileSystemDrop(props ,monitorItem)
      } else if (itemType === "contentsSummary") {
        handleDMItemDrop(props, monitorItem)
      } else if (itemType === "newDocument") {
        if(monitorItem.addType === "image") {
          createCanvasDocument({
            parentId: targetParentId,
            parentType: targetParentType,
            position: buoyancyTarget + 1,
          });
        }
        else {
          createTextDocument(targetParentId, targetParentType, buoyancyTarget + 1);
        }
      } else if (itemType === "newFolder") {
        createFolder(targetParentId, targetParentType, "New Folder", buoyancyTarget + 1);
      }
    }
  }
};

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    itemType: monitor.getItemType(),
  };
}

class ListDropTarget extends Component {
  componentDidUpdate(prevProps) {
    if (this.props.addedLink !== prevProps.addedLink) {
      const { id, highlight_id, document_id, position, listType } = this.props.addedLink;
      if (position === this.props.buoyancyTarget) {
        if (listType === 'Highlight') {
          this.props.moveLink(id, highlight_id, 'Highlight', position + 1);
        } else if (listType === 'Document') {
          this.props.moveLink(id, document_id, 'Document', position + 1);
        }
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

ListDropTarget = DropTarget(
  ['contentsSummary', 'newFolder', 'newDocument', NativeTypes.FILE],
  listDropTarget,
  collect,
)(ListDropTarget);

const mapStateToProps = state => ({
  documentPopoverOpenFor: state.project.documentPopoverOpenFor,
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
  addTree,
  openDocumentPopover,
  closeDocumentPopover,
  createTextDocument,
  createCanvasDocument,
  createFolder,
  showBatchImagePrompt,
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ListDropTarget);
