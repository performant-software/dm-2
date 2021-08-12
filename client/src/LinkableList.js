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
    const { allDraggable, inContents, writeEnabled, adminEnabled, openDocumentIds, openFolderContents } = this.props;
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
          adminEnabled={adminEnabled}
          openDocumentIds={openDocumentIds}
          isOpen={contents}
          contents={contents}
          handleClick={() => {contents ? this.props.closeFolder(item.id) : this.props.openFolder(item.id);}}
          handleDoubleClick={() => {}}
        />
      );
  }

  renderItem(item, buoyancyTarget, targetParentId, targetParentType) {
    const { inContents, writeEnabled, openDocuments, openDocumentIds } = this.props;
    const itemKey = `${item.document_kind}-${item.id}-${item.link_id}`;

    let primaryText = item.document_title;
    if (item.excerpt && item.excerpt.length > 0) {
      primaryText = (
        <div>
          <span
            style={{
              background: item.color || 'yellow',
              color: 'black',
            }}
          >
            {item.excerpt}
          </span>
          {' '}
          in
          {' '}
          <i>{item.document_title}</i>
        </div>
      );
    }
    return (
      <div key={itemKey}>
        {writeEnabled &&
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
          writeEnabled={writeEnabled}
          noMargin={inContents && writeEnabled}
          key={`${item.document_kind}-${item.id}${item.highlight_id ? '-' + item.highlight_id : ''}`}
          isDraggable={writeEnabled}
          isOpen={openDocumentIds && openDocumentIds.includes(item.document_id.toString())}
          handleClick={() => {
            let target = item.highlight_id;
            let pos = null;
            if (item.document_kind === 'text') target = item.highlight_uid;
            if (item.origin_doc_id) {
            const originDoc = parseInt(item.origin_doc_id, 10);
              const openDocsMatchingId = openDocuments
                .filter(doc => doc.id === originDoc)
                .sort((a, b) => b.timeOpened - a.timeOpened);
              if (openDocsMatchingId.length > 0) {
                const lastDocTime = openDocsMatchingId[0].timeOpened;
                pos = openDocuments
                  .findIndex(doc => doc.id === originDoc && doc.timeOpened === lastDocTime) + 1;
              }
            }
            this.props.openDocument(item.document_id, target, inContents, pos)
          }}
          // TODO use this for rename function
          handleDoubleClick={() => {}}
          // handleDoubleClick={() => {this.props.selectSidebarTarget(item);}}
        >
          <div>{primaryText}</div>
        </LinkableSummary>
      </div>
    );
  }

  render() {
    const { items, inContents, writeEnabled, insideFolder, parentFolderId, projectId, highlightId } = this.props;
    let targetParentId = projectId;
    let targetParentType = 'Project';
    if (insideFolder) {
      targetParentId = parentFolderId;
      targetParentType = 'DocumentFolder';
    }
    else if (!inContents) {
      targetParentId = highlightId;
      targetParentType = 'Highlight';
    }

    return (
      <List style={{paddingTop: '0', margin: insideFolder ? '16px -16px -24px -56px' : 'initial' }}>
        <div>
          {items.map((item, index) => {
            if (item.document_kind === 'folder') {
              return this.renderFolder(item, index, targetParentId, targetParentType);
            } else {
              return this.renderItem(item, index, targetParentId, targetParentType);
            }
          })}
          {writeEnabled &&
            <ListDropTarget 
              {...this.props} 
              buoyancyTarget={items.length} 
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
