import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { List } from 'material-ui/List';
import { openDocument } from './modules/documentGrid';
import { openFolder, closeFolder } from './modules/folders';
import { selectSidebarTarget } from './modules/annotationViewer';
import LinkableSummary from './LinkableSummary';
import DocumentFolder from './DocumentFolder';
import ListDropTarget from './ListDropTarget';

class LinkableList extends Component {

  renderFolder(item, buoyancyTarget, targetParentId, targetParentType) {
    const { allDraggable, inContents, writeEnabled, openDocumentIds, openFolderContents } = this.props;
    const itemKey = `${item.document_kind}-${item.id}-${item.link_id}`;

    let contents = openFolderContents[item.id];
    if (inContents && writeEnabled) {
      return (
        <div key={itemKey}>
          <ListDropTarget 
            {...this.props} 
            isFolder={false} 
            item={item} 
            buoyancyTarget={buoyancyTarget} 
            targetParentId={targetParentId} 
            targetParentType={targetParentType} 
          />
          <ListDropTarget 
            {...this.props} 
            isFolder={true} 
            item={item} 
            buoyancyTarget={0} 
            targetParentType = 'DocumentFolder'
            targetParentId={item.id} 
          />
        </div>
      )
    }
    return (
        <DocumentFolder
          item={item} key={itemKey}
          inContents={true}
          isDraggable={allDraggable}
          writeEnabled={writeEnabled}
          openDocumentIds={openDocumentIds}
          isOpen={contents}
          contents={contents}
          handleClick={() => {contents ? this.props.closeFolder(item.id) : this.props.openFolder(item.id);}}
          handleDoubleClick={() => {}}
        />
      );
  }

  renderItem(item, buoyancyTarget, targetParentId, targetParentType) {
    const { allDraggable, inContents, writeEnabled, openDocumentIds } = this.props;
    const itemKey = `${item.document_kind}-${item.id}-${item.link_id}`;

    let primaryText = item.document_title;
    if (item.excerpt && item.excerpt.length > 0)
      primaryText = <div><span style={{ background: item.color || 'yellow' }}>{item.excerpt}</span></div>;
      
    return (
      <div key={itemKey}>
        {inContents && writeEnabled &&
          <ListDropTarget 
            {...this.props} 
            buoyancyTarget={buoyancyTarget}
            targetParentId={targetParentId} 
            targetParentType={targetParentType} 
          />
        }
        <LinkableSummary
          item={item}
          inContents={true}
          noMargin={inContents && writeEnabled}
          key={`${item.document_kind}-${item.id}${item.highlight_id ? '-' + item.highlight_id : ''}`}
          isDraggable={allDraggable}
          isOpen={openDocumentIds && openDocumentIds.includes(item.document_id.toString())}
          handleClick={() => {this.props.openDocument(item.document_id);}}
          // TODO use this for rename function
          handleDoubleClick={() => {}}
          // handleDoubleClick={() => {this.props.selectSidebarTarget(item);}}
        >
          <div>{primaryText}</div>
        </LinkableSummary>
      </div>
    );
  }

  determineBouyancy( item, index ) {
    let buoyancyTarget = 1.0;
    if (index > 0) {
      let buoyancyA = item.buoyancy || 0;
      let buoyancyB = this.props.items[index - 1].buoyancy || 0;
      buoyancyTarget = (buoyancyA + buoyancyB) / 2.0;
    }
    else if (item.buoyancy) {
      buoyancyTarget += item.buoyancy;
    }
    return buoyancyTarget
  }

  render() {
    const { items, inContents, writeEnabled, insideFolder, parentFolderId, projectId } = this.props;
    const targetParentId = insideFolder ? parentFolderId : projectId 
    const targetParentType = insideFolder ? 'DocumentFolder' : 'Project' 

    return (
      <List style={{paddingTop: '0', margin: insideFolder ? '16px -16px -24px -56px' : 'initial' }}>
        <div>
          {items.map((item, index) => {
            const buoyancyTarget = this.determineBouyancy( item, index )
            if (item.document_kind === 'folder') {
              return this.renderFolder(item, buoyancyTarget, targetParentId, targetParentType);
            } else {
              return this.renderItem(item, buoyancyTarget, targetParentId, targetParentType);
            }
          })}
          {inContents && writeEnabled &&
            <ListDropTarget 
              {...this.props} 
              buoyancyTarget={items.length > 0 ? (items[items.length - 1].buoyancy || 0) - 1 : 0} 
              targetParentId={targetParentId} 
              targetParentType={targetParentType} 
            />
          }
        </div>
      </List>
    );
  }
}

const mapStateToProps = state => ({
  openFolderContents: state.folders.openFolderContents,
  projectId: state.project.id
});

const mapDispatchToProps = dispatch => bindActionCreators({
  openDocument,
  openFolder,
  closeFolder,
  selectSidebarTarget
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinkableList);
