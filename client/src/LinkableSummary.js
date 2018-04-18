import React, { Component } from 'react';
import { ListItem } from 'material-ui/List';
import TextFields from 'material-ui/svg-icons/editor/text-fields';
import Avatar from 'material-ui/Avatar';
import { grey100, grey400 } from 'material-ui/styles/colors';
import {TEXT_RESOURCE_TYPE, CANVAS_RESOURCE_TYPE} from './modules/project';

export default class LinkableSummary extends Component {
  render() {
    const { title, excerpt, documentKind, id, thumbnailUrl } = this.props.item;
    let primaryText = title;
    if (documentKind === TEXT_RESOURCE_TYPE && excerpt && excerpt.length > 0)
      primaryText = <div><span style={{ background: 'yellow' }}>{excerpt}</span> in {primaryText}</div>;
    return (
      <ListItem
        primaryText={primaryText}
        leftAvatar={
          <Avatar
            src={documentKind === CANVAS_RESOURCE_TYPE ? thumbnailUrl : null}
            icon={documentKind === TEXT_RESOURCE_TYPE ? <TextFields /> : null}
            style={this.props.isDraggable ? {
              left: '8px'
            } : null}
          />
        }
        style={this.props.isDraggable ? {
          border: '1px solid',
          borderColor: grey400,
          borderRadius: '0.5rem',
          margin: '8px',
          backgroundColor: grey100
        } : null}
        innerDivStyle={this.props.isDraggable ? {
          paddingLeft: '64px'
        } : null}
      />
    );
  }
}
