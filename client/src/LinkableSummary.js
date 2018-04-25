import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { ListItem } from 'material-ui/List';
import TextFields from 'material-ui/svg-icons/editor/text-fields';
import Avatar from 'material-ui/Avatar';
import { grey100, grey400, cyan100 } from 'material-ui/styles/colors';
import { TEXT_RESOURCE_TYPE, CANVAS_RESOURCE_TYPE } from './modules/project';
import { openDocument } from './modules/documentGrid';

class LinkableSummary extends Component {
  render() {
    const { title, excerpt, document_kind, id, thumbnailUrl, color } = this.props.item;
    let primaryText = title;
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
          backgroundColor: this.props.isOpen ? cyan100 : grey100
        } : null}
        innerDivStyle={this.props.isDraggable ? {
          paddingLeft: '64px'
        } : null}
        onClick={() => {this.props.openDocument(id, 0);}}
      />
    );
  }
}

const mapDispatchToProps = dispatch => bindActionCreators({
  openDocument
}, dispatch);

export default connect(
  null,
  mapDispatchToProps
)(LinkableSummary);
