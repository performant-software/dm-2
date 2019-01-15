import React, {Component} from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { DropTarget } from 'react-dnd';
import Subheader from 'material-ui/Subheader';
import CircularProgress from 'material-ui/CircularProgress';
import { grey400 } from 'material-ui/styles/colors';
import { addLink, selectSidebarTarget } from './modules/annotationViewer';

import LinkableList from './LinkableList';
import { createTextDocumentWithLink } from './modules/documentGrid';
import { openDocumentPopover, closeDocumentPopover } from './modules/project';
import AddDocumentButton from './AddDocumentButton';
import 'react-resizable/css/styles.css';

const LinkList = function(props) {
  if (props.items && props.items.length > 0) {
    return (
      <LinkableList items={props.items} openDocumentIds={props.openDocumentIds} />
    );
  }
  return null;
}

const linkTarget = {
  canDrop(props, monitor) {
    return true;
  },

  drop(props, monitor, component) {
    props.addLink({
      linkable_id: props.highlight_id || props.document_id,
      linkable_type: props.highlight_id ? 'Highlight' : 'Document'
    }, monitor.getItem());
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
    return this.props.connectDropTarget(
      <div style={{marginTop: '8px'}}>
        <LinkList {...this.props} />
        <div style={{ height: '64px', margin: '0 8px 8px 8px', padding: '0 16px', borderRadius: '4px', border: `1px ${this.props.isOver ? 'black' : grey400} dashed`, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!this.props.isOver &&
            <Subheader style={{ fontStyle: 'italic', padding: '0' }}>Drop link here.</Subheader>
          }
        </div>
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
  if (props.loading) {
    return <CircularProgress color={grey400} style={{margin: '16px'}} />;
  }
  if (props.writeEnabled) {
    return <LinkDropTarget {...props} />;
  }
  return <LinkList {...props} />;
}

class LinkInspector extends Component {
  render() {
    const { target } = this.props;
    if (target === null) return null;

    const items = target.links_to && target.links_to.length > 0 ? target.links_to.map(function(link) {
      return Object.assign({id: link.document_id + (link.highlight_id ? '-' + link.highlight_id : '')}, link);
    }) : [];

    let primaryText = target.document_title;
    if (target.excerpt && target.excerpt.length > 0)
      primaryText = <div><span style={{ background: target.color || 'yellow' }}>{target.excerpt}</span> in {primaryText}</div>;

    return (
      <div style={{ marginBottom: '8px' }}>
        <LinkArea items={items} openDocumentIds={this.props.openDocumentIds} loading={target.loading} document_id={target.document_id} highlight_id={target.highlight_id} addLink={this.props.addLink} writeEnabled={this.props.writeEnabled} />
        {this.props.writeEnabled && 
          <AddDocumentButton
            label='Add Text Document'
            documentPopoverOpen={this.props.documentPopoverOpenFor === this.props.id}
            openDocumentPopover={() => {this.props.openDocumentPopover(this.props.id)}}
            closeDocumentPopover={this.props.closeDocumentPopover}
            textClick={() => {
              this.props.createTextDocumentWithLink({
                linkable_id: target.highlight_id || target.document_id,
                linkable_type: target.highlight_id ? 'Highlight' : 'Document'
              });
            }}
            idString={this.props.id}
          />
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
  openDocumentPopover,
  closeDocumentPopover,
  createTextDocumentWithLink,
  selectSidebarTarget
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinkInspector);
