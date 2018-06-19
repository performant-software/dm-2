import React, { Component } from 'react';
import LinkInspectorPopup from './LinkInspectorPopup';

const generatePopupKey = target => `${target.document_id}${(target.highlight_id ? '-' + target.highlight_id : '')}-${target.opened}`;

export default class LinkInspectorPopupLayer extends Component {
  render() {
    return (
      <div style={{ height: '100%' }}>
        {this.props.targets.map((target, index) => (
          <LinkInspectorPopup
            key={generatePopupKey(target)}
            id={generatePopupKey(target)}
            popupIndex={index}
            target={target}
            closeHandler={() => {this.props.closeHandler(target.document_id, target.highlight_id);}}
            onDragHandleMouseDown={() => {this.props.mouseDownHandler(target.document_id, target.highlight_id);}}
            openDocumentIds={this.props.openDocumentIds}
            writeEnabled={this.props.writeEnabled}
          />
        ))}
      </div>
    );
  }
}
