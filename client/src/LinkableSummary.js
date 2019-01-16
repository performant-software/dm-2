import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { DragSource } from 'react-dnd';
import { ListItem } from 'material-ui/List';
import TextFields from 'material-ui/svg-icons/editor/text-fields';
import ArrowDown from 'material-ui/svg-icons/navigation/expand-more';
import ArrowRight from 'material-ui/svg-icons/navigation/chevron-right';
import RemoveCircle from 'material-ui/svg-icons/content/remove-circle-outline';
import Avatar from 'material-ui/Avatar';
import { grey100, grey400, cyan100 } from 'material-ui/styles/colors';
import { TEXT_RESOURCE_TYPE, CANVAS_RESOURCE_TYPE } from './modules/project';
import { openDocument } from './modules/documentGrid';

class Summary extends Component {
  constructor(props) {
    super(props);

    this.singleClickTimeout = null;
    this.doubleClickCutoffMs = 400;
  }

  renderRightButton() {
    const { item } = this.props;
    if( !item.linkItem ) return null;
    return (
      <RemoveCircle onClick={()=>{ item.removeLinkCallback(item)} } style={{margin:10}}/>
    )
  }

  render() {
    const {  document_kind, thumbnail_url } = this.props.item;
    return (
      <ListItem
        leftAvatar={document_kind === 'folder' ? null :
          <Avatar
            src={document_kind === CANVAS_RESOURCE_TYPE ? thumbnail_url : null}
            icon={document_kind === TEXT_RESOURCE_TYPE ? <TextFields /> : null}
            style={this.props.isDraggable ? {
              left: '8px',
              borderRadius: '0'
            } : {
              borderRadius: '0'
            }}
          />
        }
        leftIcon={document_kind === 'folder' ? (this.props.isOpen ? <ArrowDown /> : <ArrowRight />) : null}
        rightIconButton={ this.renderRightButton() }
        style={this.props.isDraggable ? {
          borderStyle: 'solid',
          borderWidth: this.props.borderBold ? '2px' : '1px',
          borderColor: grey400,
          borderRadius: '0.5rem',
          margin: '0 8px',
          backgroundColor: this.props.isOpen ? cyan100 : grey100,
          cursor: this.props.isDragging ? '-webkit-grabbing' : '-webkit-grab',
          maxWidth: `${this.props.sidebarWidth - 20}px`
        } : null}
        innerDivStyle={this.props.isDraggable ? {
          paddingLeft: '64px'
        } : null}
        onClick={event => {
          event.stopPropagation();
          window.clearTimeout(this.singleClickTimeout);
          this.singleClickTimeout = window.setTimeout(() => {
            this.props.handleClick();
          }, this.doubleClickCutoffMs);
        }}
        onDoubleClick={() => {
          window.clearTimeout(this.singleClickTimeout);
          this.props.handleDoubleClick();
        }}
      >
        {this.props.children}
      </ListItem>
    );
  }
}

const summarySource = {
  beginDrag(props) {
    return {
      id: props.item.id,
      linkable_id: props.item.highlight_id || props.item.document_id,
      linkable_type: props.item.highlight_id ? 'Highlight' : 'Document',
      isFolder: props.isFolder,
      descendant_folder_ids: props.isFolder ? props.item.descendant_folder_ids : null,
      existingParentId: props.item.parent_id,
      existingParentType: props.item.parent_type
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
DraggableSummary = DragSource(
  props => props.inContents ? 'contentsSummary' : 'linkableSummary',
  summarySource,
  collect
)(DraggableSummary);

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

const mapStateToProps = state => ({
  sidebarWidth: state.project.sidebarWidth
});

const mapDispatchToProps = dispatch => bindActionCreators({
  openDocument
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(LinkableSummary);
