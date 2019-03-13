import React, { Component } from 'react';

/**
 * This wraps ProseMirror's EditorView into React component.
 */
export default class ProseMirrorEditorView extends Component {
  
  focus() {
    if (this.props.editorView) {
      this.propse.editorView.focus();
    }
  }

  componentWillUnmount() {
    if (this.props.editorView) {
      this.props.editorView.destroy();
    }
  }

  shouldComponentUpdate() {
    // Note that EditorView manages its DOM itself so we'd rather not mess
    // with it.
    return false;
  }

  render() {
    // Render just an empty div which is then used as a container for an
    // EditorView instance.
    const style = { flexGrow: '1', padding: '10px' };
    return <div ref={this.props.createEditorView} style={style} />;
  }
}
