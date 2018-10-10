// adapted from https://discuss.prosemirror.net/t/using-with-react/904

import React, { Component } from 'react';
import { EditorView } from 'prosemirror-view';

/**
 * This wraps ProseMirror's EditorView into React component.
 */
export default class ProseMirrorEditorView extends Component {
  
  _createEditorView = (element) => {
    if (element != null) {

      this._editorView = new EditorView(element, {
        state: this.props.editorState,
        dispatchTransaction: this.dispatchTransaction,
        handlePaste: this.props.handlePaste,
        editable: () => this.props.writeEnabled === true
      });

    }
  };

  dispatchTransaction = (tx) => {
    // In case EditorView makes any modification to a state we funnel those
    // modifications up to the parent and apply to the EditorView itself.
    this.props.processAndConfirmTransaction(tx, function(tx) {
      // TODO call below was hurting performance , what is it for?
      // this.props.setGlobalCanvasDisplay(false);
      const editorState = this.props.editorState.apply(tx);
      if (this._editorView != null) {
        this._editorView.updateState(editorState);
      }
      this.props.onEditorState(editorState);
      // this.props.setGlobalCanvasDisplay(true);
    }.bind(this));
  };

  focus() {
    if (this._editorView) {
      this._editorView.focus();
    }
  }

  componentWillReceiveProps(nextProps) {
    // In case we receive new EditorState through props — we apply it to the
    // EditorView instance.
    if (this._editorView) {
      if (nextProps.editorState !== this.props.editorState) {
        this._editorView.updateState(nextProps.editorState);
      }
    }
  }

  componentWillUnmount() {
    if (this._editorView) {
      this._editorView.destroy();
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
    return <div ref={this._createEditorView} style={{ flexGrow: '1', overflowY: 'scroll' }} />;
  }
}
