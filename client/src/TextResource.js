import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { yellow500 } from 'material-ui/styles/colors';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import { EditorView } from 'prosemirror-view';

import IconButton from 'material-ui/IconButton';
import FormatBold from 'material-ui/svg-icons/editor/format-bold';
import FormatItalic from 'material-ui/svg-icons/editor/format-italic';
import FormatUnderlined from 'material-ui/svg-icons/editor/format-underlined';
import InsertLink from 'material-ui/svg-icons/editor/insert-link';
import FormatListBulleted from 'material-ui/svg-icons/editor/format-list-bulleted';
import FormatListNumbered from 'material-ui/svg-icons/editor/format-list-numbered';
import BorderColor from 'material-ui/svg-icons/editor/border-color';

import { Schema, DOMSerializer } from 'prosemirror-model';
import { EditorState, TextSelection } from 'prosemirror-state';
import { AddMarkStep, RemoveMarkStep, ReplaceStep } from 'prosemirror-transform';

import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { toggleMark } from 'prosemirror-commands';
import { exampleSetup } from 'prosemirror-example-setup';

import HighlightColorSelect from './HighlightColorSelect';
import { updateEditorState, setTextHighlightColor, toggleTextColorPicker } from './modules/textEditor';
import { setGlobalCanvasDisplay } from './modules/canvasEditor';
import { TEXT_HIGHLIGHT_DELETE, addHighlight, updateHighlight, duplicateHighlights, updateDocument, openDeleteDialog } from './modules/documentGrid';

class TextResource extends Component {

  constructor(props) {
    super(props);

    this.highlightsToDuplicate = [];
    this.schema = this.createSchema();
    this.props.setTextHighlightColor(this.getInstanceKey(), yellow500);
    this.scheduledContentUpdate = null;
  }

  createSchema() {
    const { document_id } = this.props;
    const instanceKey = this.getInstanceKey();

    const toDOM = function(mark) {
      const color = this.props.highlight_map[mark.attrs.highlightUid] ? this.props.highlight_map[mark.attrs.highlightUid].color : (mark.attrs.tempColor || this.props.highlightColors[instanceKey]);
      const properties = {
        class: 'dm-highlight', 
        style: `background: ${color};`, 
        onclick: `window.setFocusHighlight('${document_id}', '${mark.attrs.highlightUid}')`
      };
      properties['data-highlight-uid'] = mark.attrs.highlightUid;
      properties['data-document-id'] = mark.attrs.documentId;
      return ['span', properties, 0];
    }.bind(this);

    const dmHighlightSpec = {
      attrs: {highlightUid: {default: 'dm_new_highlight'}, documentId: {default: null}, tempColor: {default: null}},
      toDOM: toDOM,
      parseDOM: [{tag: 'span.dm-highlight', getAttrs(dom) {
        return {
          highlightUid: dom.getAttribute('data-highlight-uid'),
          documentId: dom.getAttribute('data-document-id'),
          tempColor: dom.style.background
        };
      }}]
    }

    // create schema based on prosemirror-schema-basic
    return new Schema({
      nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
      marks: schema.spec.marks.addBefore('link', 'highlight', dmHighlightSpec)
    });
  }

  createEditorState(dmSchema) {
    const dmDoc = dmSchema.nodeFromJSON(this.props.content);
    return EditorState.create({
      doc: dmDoc,
      selection: TextSelection.create(dmDoc, 0),
      plugins: exampleSetup({
        schema: dmSchema,
        menuBar: false
      })
    })
  }

  focus() {
    if (this._editorView) {
      this._editorView.focus();
    }
  }

  getEditorState() {
    const { editorStates, document_id } = this.props;
    return editorStates[document_id];
  }

  onHighlight = () => {
    const markType = this.schema.marks.highlight;
    const { document_id } = this.props;
    const editorState = this.getEditorState();
    const cmd = toggleMark( markType, {highlightUid: `dm_text_highlight_${Date.now()}`, documentId: document_id });
    cmd( editorState, this.editorView.dispatch );
  }

  componentWillReceiveProps(nextProps) {
    // In case we receive new EditorState through props — we apply it to the
    // EditorView instance.
    if (this.editorView && nextProps.editorState) {
      const editorState = this.getEditorState();
      const nextEditorState = nextProps.editorState[nextProps.document_id];
      if (nextEditorState !== editorState) {
        this.editorView.updateState(nextEditorState);
      }
    }
  }

  createEditorView(element) {
    if( !this.editorView ) {
      const dmEditorState = this.createEditorState(this.schema);
        
      this.editorView = new EditorView(element, {
        state: dmEditorState,
        dispatchTransaction: this.dispatchTransaction,
        handlePaste: this.handlePaste,
        editable: () => this.props.writeEnabled === true
      });    

      this.props.updateEditorState(this.props.document_id, dmEditorState);
    }
  }

  componentWillUnmount() {
    if (this.editorView) {
      this.editorView.destroy();
    }
  }

  // shouldComponentUpdate() {
  //   // Note that EditorView manages its DOM itself so we'd rather not mess
  //   // with it.
  //   return false;
  // }

  collectHighlights(startNode, from, to) {
    let highlights = [];
    startNode.nodesBetween(from, to, node => {
      node.marks.forEach(mark => {
        if (mark.type.name === this.schema.marks.highlight.name)
          highlights.push(mark);
      });
    });
    return highlights;
  }

  createHighlight = (mark, slice, serializer) => {
    const { document_id, highlightColors } = this.props;
    const { highlightUid } = mark.attrs;
    const instanceKey = this.getInstanceKey();
    let div = document.createElement('div');
    div.appendChild(serializer.serializeFragment(slice.content));
    this.props.addHighlight(document_id, highlightUid, highlightUid, highlightColors[instanceKey], div.textContent);
  }

  handlePaste = (view, event, slice) => {
    // process highlights that entered via copy and paste
    let pastedMarks = [];
    slice.content.descendants(node => {
      node.marks.forEach(mark => {
        if (mark.type === this.schema.marks.highlight) pastedMarks.push(mark);
      });
    });
    pastedMarks.forEach((mark, index) => {
      let markEntry = Object.assign({}, mark.attrs);
      mark.attrs['highlightUid'] = markEntry['newHighlightUid'] = `dm_text_highlight_${Date.now()}_${index}`;
      mark.attrs['documentId'] = this.props.document_id;
      this.highlightsToDuplicate.push(markEntry);
    });
  }

  dispatchTransaction = (tx) => {
    this.processAndConfirmTransaction(tx, function(tx) {
      const editorState = this.getEditorState();
      const nextEditorState = editorState.apply(tx);
      this.editorView.updateState(nextEditorState);
      this.props.updateEditorState(this.props.document_id, nextEditorState);
    }.bind(this));
  };

  processAndConfirmTransaction = (tx, callback) => {
    let postponeCallback = false;
    let postContentChanges = true;
    const serializer = DOMSerializer.fromSchema(this.schema);
    const { steps } = tx;
    const { document_id } = this.props;
    let alteredHighlights = [];
    steps.forEach(step => {
      // save new highlight
      if (step instanceof AddMarkStep && step.mark.type.name === this.schema.marks.highlight.name) {
        this.createHighlight(step.mark, tx.curSelection.content(), serializer);
      }
      // process highlights that have been removed or altered by a text content change or a mark toggle
      else if (step instanceof ReplaceStep || (step instanceof RemoveMarkStep && step.mark.type.name === this.schema.marks.highlight.name)) {
        // TODO: handle case where the space between two highlights is eliminated
        // pad the range where we look for effected highlights in order to accommodate edge cases with cursor at beginning or end of highlight
        let from = Math.max(step.from - 1, 0), to = step.to;
        if (step.to - step.from < 1) {
          let resolvedFrom = tx.doc.resolve(step.from);
          if (resolvedFrom.parentOffset < 1) {
            to += 1;
          }
        }
        const effectedMarks = this.collectHighlights(this.props.editorStates[this.props.document_id].doc, from, to);
        const additionTo = step.to + (tx.doc.nodeSize - tx.before.nodeSize);
        const possibleNewMarks = this.collectHighlights(tx.doc, step.from, additionTo);
        possibleNewMarks.forEach(mark => {
          if (!effectedMarks.includes(mark) && !this.highlightsToDuplicate.map(item => item.newHighlightUid).includes(mark.attrs.highlightUid)) {
            this.createHighlight(mark, tx.doc.slice(step.from, additionTo), serializer);
          }
        });
        if (effectedMarks.length > 0) {
          let removedMarks = effectedMarks.slice(0);
          tx.doc.descendants(node => {
            node.marks.forEach(mark => {
              if (mark.type.name === this.schema.marks.highlight.name) {
                const effectedIndex = effectedMarks.indexOf(mark);
                if (effectedIndex >= 0) {
                  if (this.props.highlight_map[mark.attrs.highlightUid] && serializer.serializeNode(node).textContent !== this.props.highlight_map[mark.attrs.highlightUid].excerpt) {
                    alteredHighlights.push({
                      id: this.props.highlight_map[mark.attrs.highlightUid].id,
                      excerpt: serializer.serializeNode(node).textContent
                    });
                  }
                  removedMarks.splice(effectedIndex, 1); // the mark remains, so exclude it from the list of removed marks
                }
              }
            });
          });
          if (removedMarks.length > 0) {
            postponeCallback = true;
            postContentChanges = false;
            this.props.openDeleteDialog(
              'Removing highlight' + (removedMarks.length > 1 ? 's' : ''),
              'Deleting the selected text will destroy ' + (removedMarks.length > 1 ? (removedMarks.length) + ' highlights and their ' : 'a highlight and its ') + 'links.',
              'Destroy ' + (removedMarks.length > 1 ? (removedMarks.length) + ' highlights' : 'highlight'),
              {
                transaction: tx,
                document_id,
                highlights: removedMarks.map(mark => this.props.highlight_map[mark.attrs.highlightUid]),
                highlightsToDuplicate: this.highlightsToDuplicate.slice(0),
                alteredHighlights
              },
              TEXT_HIGHLIGHT_DELETE
            );
          }
        }
      }
    });
    if (postContentChanges && tx.before.content !== tx.doc.content)
      this.scheduleContentUpdate(tx.doc.content);
    if (!postponeCallback) {
      if (this.highlightsToDuplicate.length > 0) {
        this.props.duplicateHighlights(this.highlightsToDuplicate, document_id);
      }
      alteredHighlights.forEach(highlight => {
        this.props.updateHighlight(highlight.id, {excerpt: highlight.excerpt});
      });
      callback(tx);
    }
    this.highlightsToDuplicate = [];
  }

  scheduleContentUpdate(content) {
    const delay = 1000; // milliseconds
    if (this.scheduledContentUpdate)
      window.clearTimeout(this.scheduledContentUpdate);
    this.scheduledContentUpdate = window.setTimeout(function() {
      this.props.updateDocument(this.props.document_id, {content: {type: 'doc', content}});
    }.bind(this), delay);
  }

  getInstanceKey() {
    const { document_id, timeOpened } = this.props;
    return `${document_id}-${timeOpened}`;
  }

  renderDropDownMenu() {
    return (
      <DropDownMenu
          value={2}
          onChange={this.handleChange}
          autoWidth={false}
        >
          <MenuItem value={1} primaryText="Small" />
          <MenuItem value={2} primaryText="Normal" />
          <MenuItem value={3} primaryText="Large" />
          <MenuItem value={4} primaryText="Huge" />
      </DropDownMenu>
    );
  }

  renderToolbar() {
    const { highlightColors, displayColorPickers, setTextHighlightColor, toggleTextColorPicker, writeEnabled } = this.props;

    if( !writeEnabled ) return <div></div>;
    const instanceKey = this.getInstanceKey();

    return (
      <Toolbar>
        <ToolbarGroup>
          <HighlightColorSelect
            highlightColor={highlightColors[instanceKey]}
            displayColorPicker={displayColorPickers[instanceKey]}
            setHighlightColor={(color) => {setTextHighlightColor(instanceKey, color);}}
            toggleColorPicker={() => {toggleTextColorPicker(instanceKey);}}
          />
          <IconButton onClick={this.onHighlight} tooltip='Highlight a passage of text.'>
            <BorderColor />
          </IconButton>
          <IconButton tooltip='Bold selected text.'>
            <FormatBold />
          </IconButton>
          <IconButton tooltip='Italicize selected text.'>
            <FormatItalic />
          </IconButton>
          <IconButton tooltip='Underline selected text.'>
            <FormatUnderlined />
          </IconButton>
          Font Size: { this.renderDropDownMenu() }
          <IconButton tooltip='Create a hyperlink.'>
            <InsertLink />
          </IconButton>
          <IconButton tooltip='Create a bulleted list.'>
            <FormatListBulleted />
          </IconButton>
          <IconButton tooltip='Create a numbered list.'>
            <FormatListNumbered />
          </IconButton>
        </ToolbarGroup>
      </Toolbar>
    );
  }

  render() {
    const { writeEnabled } = this.props;
    
    return (
      <div className="editorview-wrapper" style={{ flexGrow: '1', display: 'flex', flexDirection: 'column', padding: '10px' }}>
        { writeEnabled ? this.renderToolbar() : "" }
        <div ref={this.createEditorView.bind(this)} style={{ flexGrow: '1', overflowY: 'scroll' }} />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  editorStates: state.textEditor.editorStates,
  highlightColors: state.textEditor.highlightColors,
  displayColorPickers: state.textEditor.displayColorPickers
});

const mapDispatchToProps = dispatch => bindActionCreators({
  updateEditorState,
  addHighlight,
  updateHighlight,
  duplicateHighlights,
  setTextHighlightColor,
  toggleTextColorPicker,
  updateDocument,
  openDeleteDialog,
  setGlobalCanvasDisplay
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TextResource);
