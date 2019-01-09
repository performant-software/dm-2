import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { yellow500 } from 'material-ui/styles/colors';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';

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
import { EditorView } from 'prosemirror-view';
import { AddMarkStep, RemoveMarkStep, ReplaceStep } from 'prosemirror-transform';

import { addListNodes, wrapInList } from 'prosemirror-schema-list';
import { toggleMark } from 'prosemirror-commands';
import { exampleSetup } from 'prosemirror-example-setup';
import { undo, redo } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"

import { schema } from './TextSchema';
import { addMark, removeMark } from './TextCommands';
import HighlightColorSelect from './HighlightColorSelect';
import { updateEditorState, setTextHighlightColor, toggleTextColorPicker } from './modules/textEditor';
import { setGlobalCanvasDisplay } from './modules/canvasEditor';
import { TEXT_HIGHLIGHT_DELETE, addHighlight, updateHighlight, duplicateHighlights, updateDocument, openDeleteDialog } from './modules/documentGrid';

import ProseMirrorEditorView from './ProseMirrorEditorView';

// font sizes as defined in DM1
const fontSize = {
  small: 'x-small',
  normal: null,
  large: 'large',
  huge: 'xx-large'
}

class TextResource extends Component {

  constructor(props) {
    super(props);

    this.highlightsToDuplicate = [];
    this.props.setTextHighlightColor(this.getInstanceKey(), yellow500);
    this.scheduledContentUpdate = null;

    this.state = { 
      editorView: null, 
      documentSchema: this.createDocumentSchema() 
    };
  }

  createDocumentSchema() {
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

    const highlightSpec = {
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

    const marks = schema.spec.marks.addBefore('link', 'highlight', highlightSpec)

    // create schema based on prosemirror-schema-basic
    return new Schema({
      nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
      marks: marks
    });
  }

  getEditorState() {
    const { editorStates, document_id } = this.props;
    const existingEditorState = editorStates[document_id];
 
    if( !existingEditorState ) {
      return this.createEditorState();
    } else {
      return existingEditorState;
    }
  }

  createEditorState() {
    const document_id = this.props.document_id;
    const dmSchema = this.state.documentSchema;

    let plugins = exampleSetup({
      schema: dmSchema,
      menuBar: false
    });

    // add keyboard commands
    plugins.push( 
      keymap({"Mod-z": undo, "Mod-y": redo})
    );

    // create a new editor state
    const doc = dmSchema.nodeFromJSON(this.props.content);
    const editorState = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 0),
      plugins
    })
    this.props.updateEditorState(document_id, editorState);
    return editorState;
  }

  toSearchText(document) {
    return document.textBetween(0,document.textContent.length+1, ' ');
  }

  onHighlight = () => {
    const markType = this.state.documentSchema.marks.highlight;
    const { document_id } = this.props;
    const editorState = this.getEditorState();
    const cmd = toggleMark( markType, {highlightUid: `dm_text_highlight_${Date.now()}`, documentId: document_id });
    cmd( editorState, this.state.editorView.dispatch );
  }

  onBold = () => {
    const markType = this.state.documentSchema.marks.strong;
    const editorState = this.getEditorState();
    const cmd = toggleMark( markType );
    cmd( editorState, this.state.editorView.dispatch );
  }

  onItalic = () => {
    const markType = this.state.documentSchema.marks.em;
    const editorState = this.getEditorState();
    const cmd = toggleMark( markType );
    cmd( editorState, this.state.editorView.dispatch );
  }

  onUnderline = () => {
    const markType = this.state.documentSchema.marks.underline;
    const editorState = this.getEditorState();
    const cmd = toggleMark( markType );
    cmd( editorState, this.state.editorView.dispatch );
  }

  onOrderedList() {
    const orderedListNodeType = this.state.documentSchema.nodes.ordered_list;
    const editorState = this.getEditorState();
    const cmd = wrapInList( orderedListNodeType );
    cmd( editorState, this.state.editorView.dispatch );
  }

  onBulletList() {
    const bulletListNodeType = this.state.documentSchema.nodes.bullet_list;
    const editorState = this.getEditorState();
    const cmd = wrapInList( bulletListNodeType );
    cmd( editorState, this.state.editorView.dispatch );
  }

  onFontSizeChange(e,i,fontSize) {
    const textStyleMarkType = this.state.documentSchema.marks.textStyle;
    const editorState = this.getEditorState();
    const cmd = fontSize ? addMark( textStyleMarkType, { fontSize } ) : removeMark( textStyleMarkType );
    cmd( editorState, this.state.editorView.dispatch );
  }

  componentWillReceiveProps(nextProps) {
    // When we receive new EditorState through props — we apply it to the
    // EditorView instance and update local state for this component
    const editorState = this.getEditorState();
    if (editorState && nextProps.editorStates ) {
     const nextEditorState = nextProps.editorStates[this.props.document_id];
     if( this.state.editorView && nextEditorState !== editorState ) {
        this.state.editorView.updateState(nextEditorState);
     }
    }      
  }

  isEditable = () => {
    const { writeEnabled, lockedByMe } = this.props;
    return ( writeEnabled && lockedByMe );
  }

  createEditorView = (element) => {
    if( !this.state.editorView ) {
      const editorState = this.getEditorState();      
      const editorView = new EditorView(element, {
        state: editorState,
        dispatchTransaction: this.dispatchTransaction,
        handlePaste: this.handlePaste,
        editable: this.isEditable
      });    

      this.setState( { ...this.state, editorView });
    }
  }

  collectHighlights(startNode, from, to) {
    let highlights = [];
    startNode.nodesBetween(from, to, node => {
      node.marks.forEach(mark => {
        if (mark.type.name === this.state.documentSchema.marks.highlight.name)
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
        if (mark.type === this.state.documentSchema.marks.highlight) pastedMarks.push(mark);
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
      this.state.editorView.updateState(nextEditorState);
      this.props.updateEditorState(this.props.document_id, nextEditorState);
    }.bind(this));
  };

  processAndConfirmTransaction = (tx, callback) => {
    let postponeCallback = false;
    let postContentChanges = true;
    const serializer = DOMSerializer.fromSchema(this.state.documentSchema);
    const { steps } = tx;
    const { document_id } = this.props;
    let alteredHighlights = [];
    const editorState = this.getEditorState();
    steps.forEach(step => {
      // save new highlight
      if (step instanceof AddMarkStep && step.mark.type.name === this.state.documentSchema.marks.highlight.name) {
        this.createHighlight(step.mark, tx.curSelection.content(), serializer);
      }
      // process highlights that have been removed or altered by a text content change or a mark toggle
      else if (step instanceof ReplaceStep || (step instanceof RemoveMarkStep && step.mark.type.name === this.state.documentSchema.marks.highlight.name)) {
        // TODO: handle case where the space between two highlights is eliminated
        // pad the range where we look for effected highlights in order to accommodate edge cases with cursor at beginning or end of highlight
        let from = Math.max(step.from - 1, 0), to = step.to;
        if (step.to - step.from < 1) {
          let resolvedFrom = tx.doc.resolve(step.from);
          if (resolvedFrom.parentOffset < 1) {
            to += 1;
          }
        }
        const effectedMarks = this.collectHighlights(editorState.doc, from, to);
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
              if (mark.type.name === this.state.documentSchema.marks.highlight.name) {
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
      this.scheduleContentUpdate(tx.doc) 
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

  scheduleContentUpdate(doc) {
    const delay = 3000; // milliseconds
    const content = doc.content;
    const search_text = this.toSearchText(doc)
    if (this.scheduledContentUpdate) {
      window.clearTimeout(this.scheduledContentUpdate);
    }
    this.scheduledContentUpdate = window.setTimeout(function() {
      this.props.updateDocument(this.props.document_id, {content: {type: 'doc', content}, search_text});
    }.bind(this), delay);
  }

  getInstanceKey() {
    const { document_id, timeOpened } = this.props;
    return `${document_id}-${timeOpened}`;
  }

  renderDropDownMenu() {
    return (
      <DropDownMenu
        value={fontSize['normal']}
        onChange={this.onFontSizeChange.bind(this)}
        autoWidth={false}
      >
        <MenuItem value={fontSize['small']} primaryText="Small" />
        <MenuItem value={fontSize['normal']} primaryText="Normal" />
        <MenuItem value={fontSize['large']} primaryText="Large" />
        <MenuItem value={fontSize['huge']} primaryText="Huge" />
      </DropDownMenu>
    );
  }

  renderToolbar() {
    const { highlightColors, displayColorPickers, setTextHighlightColor, toggleTextColorPicker } = this.props;

    if( !this.isEditable() ) return <div></div>;
    const instanceKey = this.getInstanceKey();

    return (
      <Toolbar style={{ minHeight: '55px' }}>
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
          <IconButton onClick={this.onBold} tooltip='Bold selected text.'>
            <FormatBold />
          </IconButton>
          <IconButton onClick={this.onItalic} tooltip='Italicize selected text.'>
            <FormatItalic />
          </IconButton>
          <IconButton onClick={this.onUnderline} tooltip='Underline selected text.'>
            <FormatUnderlined />
          </IconButton>
          Font Size: { this.renderDropDownMenu() }
          <IconButton tooltip='Create a hyperlink.'>
            <InsertLink />
          </IconButton>
          <IconButton onClick={this.onBulletList.bind(this)} tooltip='Create a bulleted list.'>
            <FormatListBulleted />
          </IconButton>
          <IconButton onClick={this.onOrderedList.bind(this)} tooltip='Create a numbered list.'>
            <FormatListNumbered />
          </IconButton>
        </ToolbarGroup>
      </Toolbar>
    );
  }

  render() {    
    const editorViewWrapperStyle = {
      flexGrow: '1', display: 'flex', flexDirection: 'column'
    };

    return (
      <div className="editorview-wrapper" style={editorViewWrapperStyle}>
        { this.props.writeEnabled ? this.renderToolbar() : "" }
        <ProseMirrorEditorView
          editorView={this.state.editorView}
          createEditorView={this.createEditorView}
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
