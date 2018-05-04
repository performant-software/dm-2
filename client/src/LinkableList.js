import React, { Component } from 'react';
import { List } from 'material-ui/List';
import LinkableSummary from './LinkableSummary';

export default class LinkableList extends Component {
  render() {
    const { items, allDraggable } = this.props;
    return (
      <List style={{paddingTop: '0'}}>
        {items.map(item => (
          <LinkableSummary item={item} key={`${item.document_kind || 'folder'}-${item.id}${item.highlight_id ? '-' + item.highlight_id : ''}`} isDraggable={allDraggable} isOpen={this.props.openDocumentIds && this.props.openDocumentIds.includes(item.document_id.toString())} />
        ))}
      </List>
    );
  }
}
