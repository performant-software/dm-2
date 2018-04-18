import React, { Component } from 'react';
import { List } from 'material-ui/List';
import LinkableSummary from './LinkableSummary';

export default class LinkableList extends Component {
  render() {
    const { items, allDraggable } = this.props;
    return (
      <List style={{paddingTop: '0'}}>
        {items.map(item => (
          <LinkableSummary item={item} key={item.id} isDraggable={allDraggable} />
        ))}
      </List>
    );
  }
}
