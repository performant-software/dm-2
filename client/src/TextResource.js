// adapted from https://discuss.prosemirror.net/t/using-with-react/904

import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { updateEditorState, setTextHighlightColor, toggleTextColorPicker } from './modules/textEditor';
import { setGlobalCanvasDisplay } from './modules/canvasEditor';
import { TEXT_HIGHLIGHT_DELETE, addHighlight, updateHighlight, duplicateHighlights, updateDocument, openDeleteDialog } from './modules/documentGrid';
import { schema } from 'prosemirror-schema-basic';
import { EditorState, Plugin, TextSelection } from 'prosemirror-state';
import { Schema, DOMSerializer } from 'prosemirror-model';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup, buildMenuItems } from 'prosemirror-example-setup';
import { toggleMark } from 'prosemirror-commands';
import { MenuItem } from 'prosemirror-menu';
import { AddMarkStep, RemoveMarkStep, ReplaceStep } from 'prosemirror-transform';
import { yellow500 } from 'material-ui/styles/colors';
import ProseMirrorEditorView from './ProseMirrorEditorView';
import HighlightColorSelect from './HighlightColorSelect';

class TextResource extends Component {

  constructor(props: TextResourceProps) {
    super(props);

    const {document_id, timeOpened, setTextHighlightColor} = this.props;
    this.highlight_map = this.props.highlight_map;
    this.highlightsToDuplicate = [];

    const dmHighlightSpec = {
      attrs: {highlightUid: {default: 'dm_new_highlight'}, documentId: {default: null}, tempColor: {default: null}},
      toDOM: function(mark) {
        const color = this.highlight_map[mark.attrs.highlightUid] ? this.highlight_map[mark.attrs.highlightUid].color : (mark.attrs.tempColor || this.props.highlightColors[this.props.document_id]);
        const properties = {class: 'dm-highlight', style: `background: ${color};`, onmouseenter: `window.setFocusHighlight('${document_id}', '${mark.attrs.highlightUid}')`, onclick: 'if (window.highlightFocusTimeout) window.clearTimeout(highlightFocusTimeout)', onmouseout: 'if (window.highlightFocusTimeout) window.clearTimeout(highlightFocusTimeout)'};
        properties['data-highlight-uid'] = mark.attrs.highlightUid;
        properties['data-document-id'] = mark.attrs.documentId;
        return ['span', properties, 0];
      }.bind(this),
      parseDOM: [{tag: 'span.dm-highlight', getAttrs(dom) {
        return {
          highlightUid: dom.getAttribute('data-highlight-uid'),
          documentId: dom.getAttribute('data-document-id'),
          tempColor: dom.style.background
        };
      }}]
    }

    const dmSchema = new Schema({
      nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
      marks: schema.spec.marks.addBefore('link', 'highlight', dmHighlightSpec)
    });
    this.schema = dmSchema;

    function cmdItem(cmd, options) {
      let passedOptions = {
        label: options.title,
        run: cmd
      }
      for (let prop in options) passedOptions[prop] = options[prop]
      if ((!options.enable || options.enable === true) && !options.select)
        passedOptions[options.enable ? "enable" : "select"] = state => cmd(state)

      return new MenuItem(passedOptions)
    }
    function markActive(state, type) {
      let {from, $from, to, empty} = state.selection
      if (empty) return type.isInSet(state.storedMarks || $from.marks())
      else return state.doc.rangeHasMark(from, to, type)
    }
    function markItem(markType, options) {
      let passedOptions = {
        active(state) { return markActive(state, markType) },
        enable: true
      }
      for (let prop in options) passedOptions[prop] = options[prop]
      return cmdItem((state, dispatch) => {return toggleMark(markType, {highlightUid: `dm_text_highlight_${Date.now()}`, documentId: document_id}).call(null, state, dispatch);}, passedOptions)
    }

    let dmMenuContent = [];
    if (this.props.writeEnabled) {
      const toggleHighlight = markItem(dmSchema.marks.highlight, {
        title: 'Toggle highlight',
        icon: {
          width: 60, height: 60,
          path: 'm12.32,59.74a1,1 0 0 0 1.32,0l33.3,-28.3l0,0l0,0l9.19,-9.19a13,13 0 0 0 -18.32,-18.44l-9.2,9.19l0,0l0,0l-28.38,34.36a1,1 0 0 0 0.1,1.37l11.99,11.01zm26.9,-54.52a11,11 0 1 1 15.56,15.56l-8.49,8.49l-2.47,-2.48l-2.47,-2.48l7.78,-7.78a1,1 0 0 0 0,-1.41l-4.24,-4.24a1,1 0 0 0 -1.41,0l-7.78,7.78l-2.48,-2.47l-2.48,-2.47l8.48,-8.5zm-5.66,21.22a2,2 0 0 1 -0.25,-0.31l0,-0.09a2,2 0 0 1 -0.14,-0.26l0,-0.07a2,2 0 0 1 -0.09,-0.3s0,-0.05 0,-0.08a2,2 0 0 1 0,-0.62s0,0 0,-0.07a2,2 0 0 1 0.09,-0.31l0,-0.07a2,2 0 0 1 0.14,-0.27l0,-0.08a2,2 0 0 1 0.25,-0.31l10.61,-10.6l2.83,2.83l-10.61,10.61a2,2 0 0 1 -2.83,0zm-4.17,-11.25l2.56,2.56l2.32,2.32l-2.12,2.12a4,4 0 0 0 -0.51,0.62l-0.07,0.13a4,4 0 0 0 -0.3,0.57l0,0.07a3.91,3.91 0 0 0 0,2.87l0,0.07a4,4 0 0 0 0.3,0.57l0.07,0.13a4,4 0 0 0 1.13,1.13l0.13,0.07a4,4 0 0 0 0.56,0.3l0.09,0a4,4 0 0 0 0.65,0.19l0,0a3.87,3.87 0 0 0 1.5,0l0,0a4,4 0 0 0 0.66,-0.19l0.09,0a4,4 0 0 0 0.57,-0.3l0.13,-0.07a4,4 0 0 0 0.62,-0.51l2.12,-2.12l2.35,2.35l2.54,2.54l-31.78,27.06l-10.62,-9.77l27.01,-32.71z'
        },
        // active(state) { return false; },
        enable: true
      });
      dmMenuContent = buildMenuItems(dmSchema).fullMenu;
      dmMenuContent.unshift([toggleHighlight]);
    }

    const dmDoc = dmSchema.nodeFromJSON(this.props.content);

    this.props.updateEditorState(document_id, EditorState.create({
      doc: dmDoc,
      selection: TextSelection.create(dmDoc, 0),
      plugins: exampleSetup({
        schema: dmSchema,
        menuContent: dmMenuContent,
        floatingMenu: true
      })
    }));

    setTextHighlightColor(`${document_id}-${timeOpened}`, yellow500);

    this.scheduledContentUpdate = null;
  }

  componentWillReceiveProps(props) {
    this.highlight_map = props.highlight_map;
  }

  onEditorState = (editorState: EditorState) => {
    this.props.updateEditorState(this.props.document_id, editorState);
  }

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
    let div = document.createElement('div');
    div.appendChild(serializer.serializeFragment(slice.content));
    this.props.addHighlight(document_id, highlightUid, highlightUid, highlightColors[document_id], div.textContent);
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

  processAndConfirmTransaction = (tx, callback) => {
    let postponeCallback = false;
    let postContentChanges = true;
    const serializer = DOMSerializer.fromSchema(this.schema);
    const { steps } = tx;
    const { document_id, highlightColors } = this.props;
    let highlightsToDuplicate = [];
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

  render() {
    const { document_id, timeOpened, editorStates, highlightColors, displayColorPickers, setTextHighlightColor, toggleTextColorPicker, writeEnabled } = this.props;
    const editorState = editorStates[document_id];
    if (!editorState) return null;
    const key = `${document_id}-${timeOpened}`;
    return (
      <div className="editorview-wrapper" style={{ flexGrow: '1', display: 'flex', flexDirection: 'column', padding: '10px' }}>
        {writeEnabled &&
          <HighlightColorSelect
            highlightColor={highlightColors[key]}
            displayColorPicker={displayColorPickers[key]}
            setHighlightColor={(color) => {setTextHighlightColor(key, color);}}
            toggleColorPicker={() => {toggleTextColorPicker(key);}}
          />
        }
        <ProseMirrorEditorView
          writeEnabled={writeEnabled}
          ref={this.onEditorView}
          editorState={editorState}
          onEditorState={this.onEditorState}
          processAndConfirmTransaction={this.processAndConfirmTransaction}
          handlePaste={this.handlePaste}
          setGlobalCanvasDisplay={this.props.setGlobalCanvasDisplay}
        />
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
