import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { yellow500 } from 'material-ui/styles/colors';
import DropDownMenu from 'material-ui/DropDownMenu';
import MenuItem from 'material-ui/MenuItem';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import DeleteForever from 'material-ui/svg-icons/action/delete-forever';

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
import {tableEditing, columnResizing, tableNodes, fixTables} from "prosemirror-tables"
import { goToNextCell } from "prosemirror-tables"

import { schema } from './TextSchema';
import { addMark, removeMark } from './TextCommands';
import HighlightColorSelect from './HighlightColorSelect';
import { updateEditorState, setTextHighlightColor, toggleTextColorPicker } from './modules/textEditor';
import { setGlobalCanvasDisplay } from './modules/canvasEditor';
import { TEXT_HIGHLIGHT_DELETE, MAX_EXCERPT_LENGTH, addHighlight, updateHighlight, duplicateHighlights, updateDocument, openDeleteDialog } from './modules/documentGrid';

import ProseMirrorEditorView from './ProseMirrorEditorView';

// font sizes as defined in DM1
const fontSize = {
  small: 'x-small',
  normal: null,
  large: 'large',
  huge: 'xx-large'
}

const validURLRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i

class TextResource extends Component {

  constructor(props) {
    super(props);

    this.highlightsToDuplicate = [];
    this.props.setTextHighlightColor(this.getInstanceKey(), yellow500);
    this.scheduledContentUpdate = null;

    this.initialLinkDialogState = {
      linkDialogOpen: false,
      linkDialogBuffer: "",
      linkDialogBufferInvalid: false,
      createHyperlink: null,
    } 

    this.state = { 
      editorView: null, 
      documentSchema: this.createDocumentSchema(),
      ...this.initialLinkDialogState
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
        onclick: `window.setFocusHighlight('${document_id}', '${mark.attrs.highlightUid}')`,
        onmouseenter: `window.showRollover('${document_id}', '${mark.attrs.highlightUid}')`,
        onmouseleave: `window.hideRollover('${mark.attrs.highlightUid}')`
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
    let nodes = addListNodes( schema.spec.nodes, 'paragraph block*', 'block')
    nodes = nodes.append( tableNodes({
        tableGroup: "block",
        cellContent: "block+",
        cellAttributes: {
          background: {
            default: null,
            getFromDOM(dom) { return dom.style.backgroundColor || null },
            setDOMAttr(value, attrs) { if (value) attrs.style = (attrs.style || "") + `background-color: ${value};` }
          }
        }
    }))

    // create schema based on prosemirror-schema-basic
    return new Schema({ nodes, marks });
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

    // add table and history commands
    plugins.push( 
      columnResizing(),
      tableEditing(),
      keymap({
        "Mod-z": undo, 
        "Mod-y": redo, 
        "Tab": goToNextCell(1),
        "Shift-Tab": goToNextCell(-1)
      })
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
    const cmd = addMark( markType, {highlightUid: `dm_text_highlight_${Date.now()}`, documentId: document_id });
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


  // markActive(state, type) {
  //   let {from, $from, to, empty} = state.selection
  //   if (empty) return type.isInSet(state.storedMarks || $from.marks())
  //   else return state.doc.rangeHasMark(from, to, type)
  // }

  onHyperLink = () => {

    // http://prosemirror.net/examples/menu/
    // is the caret in a hyperlink presently?

    const createHyperlink = (url) => {
      const markType = this.state.documentSchema.marks.link;
      const editorState = this.getEditorState();
      const cmd = addMark( markType, { href: url } );
      cmd( editorState, this.state.editorView.dispatch );  
    }
    this.setState( {...this.state, linkDialogOpen: true, createHyperlink } );
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

  onDeleteHighlight() {
    const markType = this.state.documentSchema.marks.highlight;
    const editorState = this.getEditorState();
    const cmd = removeMark( markType );
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

      // if a highlight is targeted, locate it in props
      if( this.props.firstTarget ) {
        let targetHighlight = null;
        for( let key in this.props.highlight_map ) {
          let currentHighlight = this.props.highlight_map[key]
          if( currentHighlight.id === this.props.firstTarget ) {
            targetHighlight = currentHighlight
            break
          }
        }
        if( targetHighlight ) {
          // find the highlight position in the doc
          let targetPosition
          editorState.doc.descendants( (node, pos) => {
            if( targetPosition ) return false 
            if( node.marks.find( mark => { return mark.attrs.highlightUid === targetHighlight.target } ) )
              targetPosition = pos
          })
          // scroll to position
          if( targetPosition ) {
            const domNode = editorView.nodeDOM(targetPosition)
            if( domNode ) {
              // parent node is the highlight span
              domNode.parentNode.scrollIntoView({block: "center"})
              window.scrollTo(0,0)
            } 
          }
        }
      }

      // to allow resize of tables
      document.execCommand("enableObjectResizing", false, false)
      document.execCommand("enableInlineTableEditing", false, false)

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
    const excerpt = div.textContent.length > MAX_EXCERPT_LENGTH ? `${div.textContent.slice(0,MAX_EXCERPT_LENGTH-3)}...` : div.textContent
    this.props.addHighlight(document_id, highlightUid, highlightUid, highlightColors[instanceKey],excerpt);
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
          { this.renderDropDownMenu() }
          <IconButton onClick={this.onHyperLink} tooltip='Create a hyperlink.'>
            <InsertLink />
          </IconButton>
          <IconButton onClick={this.onBulletList.bind(this)} tooltip='Create a bulleted list.'>
            <FormatListBulleted />
          </IconButton>
          <IconButton onClick={this.onOrderedList.bind(this)} tooltip='Create a numbered list.'>
            <FormatListNumbered />
          </IconButton>
          <IconButton onClick={this.onDeleteHighlight.bind(this)} tooltip='Delete selected highlight.'>
            <DeleteForever />
          </IconButton>
        </ToolbarGroup>
      </Toolbar>
    );
  }

  onCancelHyperlinkDialog = () => {
    // discard the buffer state and close dialog
    this.setState({...this.state, ...this.initialLinkDialogState});
  }

  onSubmitHyperlinkDialog = () => {
    // call the callback if it is valid, otherwise, set error state and stay open
    const url = this.state.linkDialogBuffer;
    if( url && url.length > 0 && validURLRegex.test( url ) ) {
      this.state.createHyperlink( url );
      this.setState({
        ...this.state, 
        ...this.initialLinkDialogState
      });  
    } else {
      this.setState({ ...this.state, linkDialogBufferInvalid: true });
    }    
  }

  renderLinkDialog() {
    const actions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={this.onCancelHyperlinkDialog}
      />,
      <FlatButton
        label="Add"
        primary={true}
        onClick={this.onSubmitHyperlinkDialog}
      />,
    ];

    return (
      <Dialog
          title="Add Hyperlink"
          actions={actions}
          modal={true}
          open={this.state.linkDialogOpen}
          onRequestClose={this.onCancelHyperlinkDialog}
        >
          <TextField
            value={this.state.linkDialogBuffer}
            errorText={ this.state.linkDialogBufferInvalid ? "Please enter a valid URL." : "" }
            floatingLabelText={"Enter a website URL."}
            onChange={(event, newValue) => {this.setState( { ...this.state, linkDialogBuffer: newValue}) }}
          />
        </Dialog>
    );
  }

  render() {    
    const editorViewWrapperStyle = {
      flexGrow: '1', display: 'flex', flexDirection: 'column', overflowY: 'scroll', overflowX: 'hidden'
    };

    return (
      <div style={{flexGrow: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        { this.props.writeEnabled ? this.renderToolbar() : "" }
        <div className="editorview-wrapper" style={editorViewWrapperStyle}>
          <ProseMirrorEditorView
            editorView={this.state.editorView}
            createEditorView={this.createEditorView}
          />
          { this.renderLinkDialog() }
        </div>
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
