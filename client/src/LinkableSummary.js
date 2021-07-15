import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { DragSource } from 'react-dnd';

import { ListItem } from 'material-ui/List';
import TextFields from 'material-ui/svg-icons/editor/text-fields';
import ArrowDown from 'material-ui/svg-icons/navigation/expand-more';
import ArrowRight from 'material-ui/svg-icons/navigation/chevron-right';
import HighlightOff from 'material-ui/svg-icons/action/highlight-off';
import IconButton from 'material-ui/IconButton';
import Avatar from 'material-ui/Avatar';
import Link from 'material-ui/svg-icons/content/link';

import { grey100, grey300, grey400, grey800, white, black } from 'material-ui/styles/colors';

import { TEXT_RESOURCE_TYPE, CANVAS_RESOURCE_TYPE } from './modules/project';
import { openDocument } from './modules/documentGrid';

class Summary extends Component {
  constructor(props) {
    super(props);

    this.singleClickTimeout = null;
    this.doubleClickCutoffMs = 400;

    const defaultBgColor = this.props.item.linkItem ? 'white' : grey100;

    this.state = {
      backgroundColor: this.props.isOpen && this.props.item.document_kind !== 'folder' ? grey800 : defaultBgColor,
    };
  }

  renderRightIcon() {
    const { item } = this.props;

    if( !item.linkItem && item.document_kind !== 'folder' && this.props.isDraggable ) {
      return (
        <div style={{ marginTop: 12, marginRight: 15}} >
          <Link color={this.props.isOpen ? white : black} /> 
        </div>
      )    
    } else {
      return null;
    }
  }

  renderRightButton() {
    const { item, writeEnabled } = this.props;
    if( item.linkItem ) {
      if( !writeEnabled ) return null;
      return (
        <IconButton
          onClick={()=>{ item.removeLinkCallback(item)} }
        >
          <HighlightOff  style={{margin:10}} color={this.props.isOpen ? white : black} />
        </IconButton>
      )
    } else {
      return null;
    }
  }

  render() {
    const {  document_kind, thumbnail_url, linkItem } = this.props.item;
    return (
      <ListItem
        onMouseEnter={() => {
          if(linkItem) {
            this.setState({
              backgroundColor: grey300,
            });
          }
        }}
        onMouseLeave={() => {
          if(linkItem) {
            this.setState({
              backgroundColor: 'white',
            });
          }
        }}
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
        rightIcon={ this.renderRightIcon() }
        rightIconButton={ this.renderRightButton() }
        style={this.props.isDraggable ? {
          borderStyle: 'solid',
          borderWidth: this.props.borderBold ? '2px' : '1px',
          borderColor: grey400,
          margin: '0 8px',
          color: this.props.isOpen ? white : black,
          backgroundColor: this.props.isOpen && document_kind !== 'folder' ? grey800 : this.state.backgroundColor,
          cursor: this.props.isDragging ? '-webkit-grabbing' : '-webkit-grab',
          maxWidth: `${this.props.sidebarWidth - 20}px`
        } : {
          color: this.props.isOpen ? white : black,
          backgroundColor: this.props.isOpen && document_kind !== 'folder' ? grey800 : this.state.backgroundColor,
        }}
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
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
  };
}

class DraggableSummary extends Component {

  componentDidMount() {
    // use a static image for dragg preview
    const { connectDragPreview } = this.props;
    let linkDragIcon = new Image();
    linkDragIcon.src = '/dragging-link.png';
    connectDragPreview(linkDragIcon);
  }

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
