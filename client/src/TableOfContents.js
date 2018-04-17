import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import { List, ListItem } from 'material-ui/List';
import AddCircle from 'material-ui/svg-icons/content/add-circle';

export default class TableOfContents extends Component {
  render() {
    return (
      <div>
        <RaisedButton
          label='Add New Document'
          icon={<AddCircle />}
          style={{margin: 'auto'}}
        />
        <List>
          {this.props.contentsChildren.map(item => (
            <ListItem primaryText={item.title} key={item.id} />
          ))}
        </List>
      </div>
    );
  }
}
