import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { DropTarget } from 'react-dnd';
import { openFolder, closeFolder, moveFolder } from './modules/folders';
import { moveDocument } from './modules/documentGrid';
import { loadProject } from './modules/project';
import DocumentFolder from './DocumentFolder';

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

const listDropTarget = {
  canDrop(props, monitor) {
    const monitorItem = monitor.getItem();
    if (props.item && monitorItem.isFolder && (monitorItem.id === props.item.id || (monitorItem.descendant_folder_ids && monitorItem.descendant_folder_ids.includes(props.item.id)))) {
      return false;
    }
    return true;
  },

  drop(props, monitor) {
    if (!monitor.didDrop()) {
      const monitorItem = monitor.getItem();
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
ListDropTarget = DropTarget('contentsSummary', listDropTarget, collect)(ListDropTarget);

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
