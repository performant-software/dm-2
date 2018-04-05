import React, { Component } from 'react';
import TextResource from './TextResource';
import CanvasResource from './CanvasResource';

const ResourceInner = function(props) {
  switch (props.resourceType) {
    case 'text':
      return <TextResource {...props} />;
    case 'canvas':
      return <CanvasResource {...props} />;
    default:
      return <div>Error: no type defined for this resource.</div>;
  }
}

export default class ResourceViewer extends Component {
  render() {
    return (
      <div style={{ border: '1px solid black', height: '480', padding: '10px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>{this.props.resourceName}</h3>
        <ResourceInner {...this.props} />
      </div>
    )
  }
}
