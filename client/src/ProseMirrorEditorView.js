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

  shouldComponentUpdate(nextProps) {
    // Update component if style attrs change
    if (this.props.style !== nextProps.style || this.props.columnCount !== nextProps.columnCount) {
      return true
    }
    // Note that EditorView manages its DOM itself so we'd rather not mess
    // with it otherwise.
    return false;
  }

  render() {
    // Render just an empty div which is then used as a container for an
    // EditorView instance.
    const style = { flexGrow: '1', padding: '10px', ...this.props.style };
    let className = '';
    switch (this.props.columnCount) {
      case 1: 
        className = 'one-column';
        break;
      case 2: 
        className =  'two-column';
        break;
      case 3:
        className =  'three-column';
        break;
      default:
        className = '';
        break;
    }
    return <div ref={this.props.createEditorView} className={className} style={style} />;
  }
}
