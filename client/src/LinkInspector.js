import React, {Component} from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { DropTarget } from 'react-dnd';
import Subheader from 'material-ui/Subheader';
import { grey400 } from 'material-ui/styles/colors';
import { addLink, deleteLink, selectSidebarTarget } from './modules/annotationViewer';
import NoteAdd from 'material-ui/svg-icons/action/note-add';
import LinkableList from './LinkableList';
import { createTextDocumentWithLink } from './modules/documentGrid';
import { openDocumentPopover, closeDocumentPopover } from './modules/project';
import RaisedButton from 'material-ui/RaisedButton';
import 'react-resizable/css/styles.css';
import DraggableLinkIcon from './DraggableLinkIcon';

const LinkList = function(props) {
  if (props.items && props.items.length > 0) {
    return (
      <LinkableList
        items={props.items}
        originKey={props.originKey}
        writeEnabled={props.writeEnabled}
        adminEnabled={props.adminEnabled}
        openDocuments={props.openDocuments}
        openDocumentIds={props.openDocumentIds}
        highlightId={props.highlight_id}
      />
    );
  }
  return null;
}

const linkTarget = {
  canDrop(props, monitor) {
    return true;
  },

  drop(props, monitor) {
    const origin = {
      linkable_id: props.highlight_id || props.document_id,
      linkable_type: props.highlight_id ? 'Highlight' : 'Document'
    }
    const target = monitor.getItem();

    // first, make sure origin !== target
    if( origin.linkable_type === target.linkable_type &&
        origin.linkable_id === target.linkable_id        ) {
        // TODO indicate invalid
        return;
    }
    // then, make sure linked isn't already in our set of links
    const existingLinkFound = props.items.find( (link) => {
      if( target.linkable_type === 'Highlight') {
        // are these same highlight?
        return ( target.linkable_id === link.highlight_id )
      } else {
        // are these same doc?
        return ( !link.highlight_id && target.linkable_id === link.document_id ) 
      }
    });

    if( existingLinkFound ) {
       // TODO indicate invalid
      return
    }

    // this is a fresh link, create it...
    props.addLink(origin, target);
  }
};

function collect(connect, monitor) {
  return {
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver()
  };
}

class LinkDropTarget extends Component {
  render() {
    return (
      <div style={{marginTop: '8px'}}>
        <div style={{maxWidth: '350px', maxHeight: '450px', margin: 10, overflowY: 'auto'}}>
          <LinkList {...this.props} />
        </div>
        {(this.props.connectDropTarget(
          <div style={{ height: '64px', margin: '0 8px 8px 8px', padding: '0 16px', borderRadius: '4px', border: `1px ${this.props.isOver ? 'black' : grey400} dashed`, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {!this.props.isOver &&
              <Subheader style={{ fontStyle: 'italic', padding: '0' }}>Drop link here.</Subheader>
            }
          </div>
        ))}
      </div>
    );
  }
}
LinkDropTarget = DropTarget(
  ['contentsSummary', 'linkableSummary'],
  linkTarget,
  collect
)(LinkDropTarget);

const LinkArea = props => {
  if (props.writeEnabled) {
    return <LinkDropTarget {...props} />;
  }
  return <LinkList {...props} />;
}

class LinkInspector extends Component {

  getItemList() {
    const links = this.props.target.links_to;
    if( links && links.length > 0 ) {
      return links.map( (link) => {
        const linkID = link.document_id + (link.highlight_id ? '-' + link.highlight_id : '');
        return { 
          ...link, 
          id: linkID, 
          linkItem: true, 
          removeLinkCallback: (linkItem) => {
            this.props.deleteLink(linkItem.link_id);
          } 
        };
      })
    } else {
      return [];
    }
  }
  
  render() {
    const { target } = this.props;
    if (target === null) return null;

    const items = this.getItemList();
    const buttonId = `addNewDocumentButton-${this.props.idString}`;
    return (
      <div style={{ marginBottom: '8px' }}>
        <LinkArea
          items={items}
          openDocuments={this.props.openDocuments}
          openDocumentIds={this.props.openDocumentIds}
          loading={target.loading}
          originKey={target.originKey}
          document_id={target.document_id}
          highlight_id={target.highlight_id}
          addLink={this.props.addLink}
          writeEnabled={this.props.writeEnabled}
          adminEnabled={this.props.adminEnabled}
        />
        {this.props.writeEnabled && 
          <div>
            <RaisedButton
              label='Add Annotation'
              icon={<NoteAdd />}
              style={{margin: 5}}
              onClick={() => {
                this.props.createTextDocumentWithLink({
                  linkable_id: target.highlight_id || target.document_id,
                  linkable_type: target.highlight_id ? 'Highlight' : 'Document'
                }, this.props.target.document_id, 'Document');
                this.props.closeDocumentPopover();
              }}
              id={buttonId}
            />
            <div style={{ float: 'right'}}>
              <DraggableLinkIcon
                item={target}
                inContents={false}
                key={`draglink-${target.document_kind}-${target.id}${target.highlight_id ? '-' + target.highlight_id : ''}`}
              />
            </div>
          </div>
          }
      </div>
    );
  }
}

const mapStateToProps = state => ({
  documentPopoverOpenFor: state.project.documentPopoverOpenFor
})

const mapDispatchToProps = dispatch => bindActionCreators({
  addLink,
  deleteLink,
  openDocumentPopover,
  closeDocumentPopover,
  createTextDocumentWithLink,
  selectSidebarTarget
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinkInspector);
