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

const ListContents = props => {
  const { items, allDraggable, writeEnabled, openDocumentIds, openFolderContents } = props;
  return (
    <div>
      {items.map((item, index) => {
        let buoyancyTarget = 1.0;
        if (index > 0) {
          let buoyancyA = item.buoyancy || 0;
          let buoyancyB = items[index - 1].buoyancy || 0;
          buoyancyTarget = (buoyancyA + buoyancyB) / 2.0;
        }
        else if (item.buoyancy) {
          buoyancyTarget += item.buoyancy;
        }
        if (item.document_kind === 'folder') {
          let contents = openFolderContents[item.id];
          if (props.inContents && props.writeEnabled) {
            return (
              <div key={`${item.document_kind}-${item.id}`}>
                <ListDropTarget {...props} isFolder={false} item={item} buoyancyTarget={buoyancyTarget} targetParentId={props.insideFolder ? props.parentFolderId : props.projectId} targetParentType={props.insideFolder ? 'DocumentFolder' : 'Project'} />
                <ListDropTarget {...props} isFolder={true} item={item} buoyancyTarget={0} targetParentType = 'DocumentFolder' targetParentId={item.id} />
              </div>
            )
          }
          return (
              <DocumentFolder
                item={item} key={`${item.document_kind}-${item.id}`}
                inContents={true}
                isDraggable={allDraggable}
                writeEnabled={writeEnabled}
                openDocumentIds={openDocumentIds}
                isOpen={contents}
                contents={contents}
                handleClick={() => {contents ? props.closeFolder(item.id) : props.openFolder(item.id);}}
                handleDoubleClick={() => {}}
              />
            );
        }
        let primaryText = item.document_title;
        if (item.excerpt && item.excerpt.length > 0)
          primaryText = <div><span style={{ background: item.color || 'yellow' }}>{item.excerpt}</span> in {primaryText}</div>;
        return (
          <div key={`${item.document_kind}-${item.id}`}>
            {props.inContents && props.writeEnabled &&
              <ListDropTarget {...props} buoyancyTarget={buoyancyTarget} targetParentId={props.insideFolder ? props.parentFolderId : props.projectId} targetParentType={props.insideFolder ? 'DocumentFolder' : 'Project'} />
            }
            <LinkableSummary
              item={item}
              inContents={true}
              noMargin={props.inContents && props.writeEnabled}
              key={`${item.document_kind}-${item.id}${item.highlight_id ? '-' + item.highlight_id : ''}`}
              isDraggable={allDraggable}
              isOpen={openDocumentIds && openDocumentIds.includes(item.document_id.toString())}
              handleClick={() => {props.openDocument(item.document_id);}}
              handleDoubleClick={() => {props.selectSidebarTarget(item);}}
            >
              <div>{primaryText}</div>
            </LinkableSummary>
          </div>
        );
      })}
      {props.inContents && props.writeEnabled &&
        <ListDropTarget {...props} buoyancyTarget={items.length > 0 ? (items[items.length - 1].buoyancy || 0) - 1 : 0} targetParentId={props.insideFolder ? props.parentFolderId : props.projectId} targetParentType={props.insideFolder ? 'DocumentFolder' : 'Project'} />
      }
    </div>
  );
}

class LinkableList extends Component {
  render() {
    const { insideFolder } = this.props;
    return (
      <List style={{paddingTop: '0', margin: insideFolder ? '16px -16px -24px -56px' : 'initial' }}>
        <ListContents {...this.props} />
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
