import React, { Component } from 'react';
import Paper from 'material-ui/Paper';
import TextResource from './TextResource';
import CanvasResource from './CanvasResource';

const ResourceInner = function(props) {
  switch (props.documentKind) {
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
      <Paper style={{ height: '480', padding: '10px' }} zDepth={2}>
        <h3 style={{ margin: '0 0 10px 0' }}>{this.props.resourceName}</h3>
        <ResourceInner {...this.props} />
      </Paper>
    )
  }
}
