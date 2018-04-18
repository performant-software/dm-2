import React, { Component } from 'react';
import FlatButton from 'material-ui/FlatButton';
import AddCircle from 'material-ui/svg-icons/content/add-circle';
import LinkableList from './LinkableList';

export default class TableOfContents extends Component {
  render() {
    return (
      <div>
        <FlatButton
          label='Add New Document'
          icon={<AddCircle />}
          style={{margin: 'auto'}}
        />
        <LinkableList items={this.props.contentsChildren} allDraggable={true} />
      </div>
    );
  }
}
