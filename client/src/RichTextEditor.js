// adapted from https://discuss.prosemirror.net/t/using-with-react/904

import React, {Component} from 'react';
import {schema} from 'prosemirror-schema-basic';
import {EditorState} from 'prosemirror-state';
import {Schema} from 'prosemirror-model';
import {addListNodes} from 'prosemirror-schema-list';
import {exampleSetup} from 'prosemirror-example-setup';
import ProseMirrorEditorView from './ProseMirrorEditorView';

const dmSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: schema.spec.marks
});

export default class RichTextEditor extends Component {
  state: {editorState: EditorState};

  constructor(props: RichTextEditorProps) {
    super(props);
    this.state = {
      editorState: EditorState.create({
        doc: schema.node("doc", null, [
          schema.node("paragraph", null, [schema.text("One.")]),
          schema.node("horizontal_rule"),
          schema.node("paragraph", null, [schema.text("Two!")])
        ]),
        plugins: exampleSetup({schema: dmSchema})
      })
    };
  }

  dispatchTransaction = (tx: any) => {
    const editorState = this.state.editorState.apply(tx);
    this.setState({editorState});
  };

  onEditorState = (editorState: EditorState) => {
    this.setState({editorState});
  };

  render() {
    const {editorState} = this.state;
    return (
      <div>
        <div className="editorview-wrapper">
          <ProseMirrorEditorView
            ref={this.onEditorView}
            editorState={editorState}
            onEditorState={this.onEditorState}
          />
        </div>
      </div>
    );
  }
}
