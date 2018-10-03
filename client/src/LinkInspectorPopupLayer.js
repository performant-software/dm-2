import React, { Component } from 'react';
import LinkInspectorPopup from './LinkInspectorPopup';

const generatePopupKey = target => `${target.document_id}${(target.highlight_id ? '-' + target.highlight_id : '')}-${target.opened}`;

export default class LinkInspectorPopupLayer extends Component {
  render() {
    return (
      <div style={{ position: 'absolute', top: '0', left: '0', bottom: '-320px', paddingLeft: this.props.sidebarWidth + 2, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ height: '100%', width: '100%', position: 'relative' }}>
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
      </div>
    );
  }
}
