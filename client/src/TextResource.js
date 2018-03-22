// adapted from https://discuss.prosemirror.net/t/using-with-react/904

import React, {Component} from 'react';
import {schema} from 'prosemirror-schema-basic';
import {EditorState} from 'prosemirror-state';
import {Schema} from 'prosemirror-model';
import {addListNodes} from 'prosemirror-schema-list';
import {exampleSetup} from 'prosemirror-example-setup';
import ProseMirrorEditorView from './ProseMirrorEditorView';

const dmHighlightSpec = {
  toDOM() { return ['span', {class: 'dm-highlight', style: 'background: red;', 'data-highlight-id': 'dm_text_highlight_1', onmouseover: "window.setFocusHighlight('dm_text_highlight_1')"}, 0]; }
}

const dmSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
  marks: schema.spec.marks.addBefore('link', 'highlight', dmHighlightSpec)
});

export default class TextResource extends Component {
  state: {editorState: EditorState};

  constructor(props: TextResourceProps) {
    super(props);
    var myMark = dmSchema.mark('highlight');
    this.state = {
      editorState: EditorState.create({
        doc: dmSchema.node('doc', null, [
          dmSchema.node('paragraph', null, [dmSchema.text('One.', myMark)]),
          dmSchema.node('horizontal_rule'),
          dmSchema.node('paragraph', null, [dmSchema.text('Two!')])
        ]),
        plugins: exampleSetup({schema: dmSchema}),
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
