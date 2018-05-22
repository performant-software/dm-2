import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { DragSource } from 'react-dnd';
import { ListItem } from 'material-ui/List';
import TextFields from 'material-ui/svg-icons/editor/text-fields';
import Avatar from 'material-ui/Avatar';
import { grey100, grey400, cyan100 } from 'material-ui/styles/colors';
import { TEXT_RESOURCE_TYPE, CANVAS_RESOURCE_TYPE } from './modules/project';
import { openDocument } from './modules/documentGrid';
import { selectSidebarTarget } from './modules/annotationViewer';

class Summary extends Component {
  constructor(props) {
    super(props);

    this.singleClickTimeout = null;
    this.doubleClickCutoffMs = 400;
  }

  render() {
    const { document_title, excerpt, document_kind, document_id, thumbnailUrl, color } = this.props.item;
    let primaryText = document_title;
    if (this.props.isDragging) primaryText += '!!!';
    if (document_kind === TEXT_RESOURCE_TYPE && excerpt && excerpt.length > 0)
      primaryText = <div><span style={{ background: color || 'yellow' }}>{excerpt}</span> in {primaryText}</div>;
    return (
      <ListItem
        primaryText={primaryText}
        leftAvatar={
          <Avatar
            src={document_kind === CANVAS_RESOURCE_TYPE ? thumbnailUrl : null}
            icon={document_kind === TEXT_RESOURCE_TYPE ? <TextFields /> : null}
            style={this.props.isDraggable ? {
              left: '8px',
              borderRadius: '0'
            } : {
              borderRadius: '0'
            }}
          />
        }
        style={this.props.isDraggable ? {
          border: '1px solid',
          borderColor: grey400,
          borderRadius: '0.5rem',
          margin: '8px',
          backgroundColor: this.props.isOpen ? cyan100 : grey100,
          cursor: this.props.isDragging ? '-webkit-grabbing' : '-webkit-grab'
        } : null}
        innerDivStyle={this.props.isDraggable ? {
          paddingLeft: '64px'
        } : null}
        onClick={() => {
          window.clearTimeout(this.singleClickTimeout);
          this.singleClickTimeout = window.setTimeout(() => {
            this.props.openDocument(document_id);
          }, this.doubleClickCutoffMs);
        }}
        onDoubleClick={() => {
          window.clearTimeout(this.singleClickTimeout);
          this.props.selectSidebarTarget(this.props.item);
        }}
      />
    );
  }
}

const summarySource = {
  beginDrag(props) {
    return {
      linkable_id: props.item.highlight_id || props.item.document_id,
      linkable_type: props.item.highlight_id ? 'Highlight' : 'Document'
    };
  }
};

function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
}

class DraggableSummary extends Component {
  render() {
    return this.props.connectDragSource(
      <div>
        <Summary {...this.props} />
      </div>
    );
  }
}
DraggableSummary = DragSource('linkableSummary', summarySource, collect)(DraggableSummary);

class LinkableSummary extends Component {
  componentWillMount() {
    ListItem.defaultProps.disableTouchRipple = true;
    ListItem.defaultProps.disableFocusRipple = true;
  }

  render() {
    if (this.props.isDraggable) {
      return (
        <div>
          <DraggableSummary {...this.props} />
        </div>
      );
    }
    else {
      return <Summary {...this.props} />;
    }
  }
}

const mapDispatchToProps = dispatch => bindActionCreators({
  openDocument,
  selectSidebarTarget
}, dispatch);

export default connect(
  null,
  mapDispatchToProps
)(LinkableSummary);
