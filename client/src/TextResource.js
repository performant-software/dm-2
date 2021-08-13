import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import { yellow500 } from 'material-ui/styles/colors';
import DropDownMenu from 'material-ui/DropDownMenu';
import Popover from 'material-ui/Popover';
import MenuItem from 'material-ui/MenuItem';
import { Toolbar, ToolbarGroup } from 'material-ui/Toolbar';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import CircularProgress from 'material-ui/CircularProgress';
import DeleteForever from 'material-ui/svg-icons/action/delete-forever';

import { SketchPicker } from 'react-color';

import IconButton from 'material-ui/IconButton';
import TextFields from 'material-ui/svg-icons/editor/text-fields';
import FormatBold from 'material-ui/svg-icons/editor/format-bold';
import FormatItalic from 'material-ui/svg-icons/editor/format-italic';
import FormatUnderlined from 'material-ui/svg-icons/editor/format-underlined';
import FormatStrikethrough from 'material-ui/svg-icons/editor/format-strikethrough';
import FormatQuote from 'material-ui/svg-icons/editor/format-quote';
import InsertLink from 'material-ui/svg-icons/editor/insert-link';
import FormatListBulleted from 'material-ui/svg-icons/editor/format-list-bulleted';
import FormatListNumbered from 'material-ui/svg-icons/editor/format-list-numbered';
import IncreaseIndent from 'material-ui/svg-icons/editor/format-indent-increase';
import DecreaseIndent from 'material-ui/svg-icons/editor/format-indent-decrease';
import EllipsisIcon from 'material-ui/svg-icons/navigation/more-horiz';
import BorderColor from 'material-ui/svg-icons/editor/border-color';
import CropFree from 'material-ui/svg-icons/image/crop-free';
import { Hr } from 'react-bootstrap-icons';
import { Schema, DOMSerializer } from 'prosemirror-model';
import { EditorState, TextSelection, Plugin } from 'prosemirror-state';
import { EditorView, Decoration, DecorationSet } from 'prosemirror-view';
import { AddMarkStep, RemoveMarkStep, ReplaceStep } from 'prosemirror-transform';

import { addListNodes, wrapInList } from 'prosemirror-schema-list';
import { toggleMark, wrapIn } from 'prosemirror-commands';
import { exampleSetup } from 'prosemirror-example-setup';
import { undo, redo } from "prosemirror-history"
import { keymap } from "prosemirror-keymap"
import {tableEditing, columnResizing, tableNodes } from "prosemirror-tables"

import { schema } from './TextSchema';
import {
  addMark, decreaseIndent, increaseIndent, removeMark, replaceNodeWith
} from './TextCommands';
import HighlightColorSelect from './HighlightColorSelect';
import { updateEditorState, setTextHighlightColor, toggleTextColorPicker, setHighlightSelectMode, selectHighlight, closeEditor } from './modules/textEditor';
import { setGlobalCanvasDisplay } from './modules/canvasEditor';
import { TEXT_HIGHLIGHT_DELETE, MAX_EXCERPT_LENGTH, addHighlight, updateHighlight, duplicateHighlights, updateDocument, openDeleteDialog } from './modules/documentGrid';

import ProseMirrorEditorView from './ProseMirrorEditorView';

const fontFamilies = ['sans-serif', 'serif', 'monospace', 'cursive']

const buttonWidth = 48;

const validURLRegex = /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i

class TextResource extends Component {

  constructor(props) {
    super(props);

    this.highlightsToDuplicate = [];
    this.props.setTextHighlightColor(this.getInstanceKey(), yellow500);
    this.scheduledContentUpdate = null;

    this.tools = [
      { name: 'highlight-color', width: buttonWidth },
      { name: 'highlight', width: buttonWidth, text: 'Highlight selected text' },
      { name: 'highlight-select', width: buttonWidth, text: 'Select a highlight' },
      { name: 'text-color', width: buttonWidth, text: 'Change text color' },
      { name: 'bold', width: buttonWidth, text: 'Bold' },
      { name: 'italic', width: buttonWidth, text: 'Italicize' },
      { name: 'underline', width: buttonWidth, text: 'Underline' },
      { name: 'strikethrough', width: buttonWidth, text: 'Strikethrough' },
      { name: 'font-family', width: 148 },
      { name: 'font-size', width: 72 },
      { name: 'link', width: buttonWidth, text: 'Hyperlink' },
      { name: 'bulleted-list', width: buttonWidth, text: 'Bulleted list' },
      { name: 'numbered-list', width: buttonWidth, text: 'Numbered list' },
      { name: 'decrease-indent', width: buttonWidth, text: 'Decrease indent' },
      { name: 'increase-indent', width: buttonWidth, text: 'Increase indent' },
      { name: 'blockquote', width: buttonWidth, text: 'Blockquote' },
      { name: 'hr', width: buttonWidth, text: 'Horizontal rule' },
      { name: 'highlight-delete', width: buttonWidth, text: 'Delete selected highlight' },
    ].map((tool, position) => {
      return { ...tool, position }
    });

    this.initialLinkDialogState = {
      linkDialogOpen: false,
      linkDialogBuffer: "",
      linkDialogBufferInvalid: false,
      createHyperlink: null,
    }

    this.state = {
      editorView: null,
      documentSchema: this.createDocumentSchema(),
      targetHighlights: [],
      currentScrollTop: 0,
      toolbarWidth: 0,
      hiddenTools: [],
      hiddenToolsOpen: false,
      hiddenToolsAnchor: undefined,
      textColor: 'teal',
      colorPickerOpen: false,
      colorPickerAnchor: undefined,
      tooltipOpen: {},
      tooltipAnchor: {},
      ...this.initialLinkDialogState
    };
  }
  
  componentDidUpdate(prevProps, prevState) {
    if (this.state.targetHighlights !== prevState.targetHighlights) {
      this.createEditorState();
    }
    if (this.props.content !== prevProps.content) {
      this.createEditorState();
    }
  }

  renderTool = ({ toolName, text }) => {
    const { 
      highlightColors,
      displayColorPickers,
      setTextHighlightColor,
      toggleTextColorPicker,
      highlightSelectModes,
      selectedHighlights,
      loading
    } = this.props;
  
    const instanceKey = this.getInstanceKey();

    switch (toolName) {
      case 'highlight-color':
        return (
          <HighlightColorSelect
            key={toolName}
            highlightColor={highlightColors[instanceKey]}
            displayColorPicker={displayColorPickers[instanceKey]}
            setHighlightColor={function(color) {
              setTextHighlightColor(instanceKey, color);
              const selectedHighlight = this.props.selectedHighlights[instanceKey];
              if (selectedHighlight) {
                // TODO: make this less heavy handed; following the highlight update, we recreate the schema and state to force prosemirror to rerender the necessary dom elements with the updated highlight data
                this.props.updateHighlight(this.props.highlight_map[selectedHighlight].id, {color})
                .then(function() {
                  this.props.closeEditor(instanceKey);
                  this.setState({documentSchema: this.createDocumentSchema()});
                  this.createEditorState();
                }.bind(this));
              }
            }.bind(this)}
            toggleColorPicker={() => {toggleTextColorPicker(instanceKey);}}
          />
        );

      case 'highlight':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onHighlight.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <BorderColor />
          </IconButton>
        );

      case 'text-color':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onColorPickerOpen.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <TextFields
              color={this.state.textColor}
              className="text-fields-icon"
            />
          </IconButton>
        )
  
      case 'bold':
        return (
            <IconButton
              key={toolName}
              onMouseDown={this.onBold.bind(this)}
              onMouseOver={this.onTooltipOpen.bind(this, toolName)}
              onMouseOut={this.onTooltipClose.bind(this, toolName)}
              tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
              disabled={loading}
            >
              <FormatBold />
            </IconButton>
        );

      case 'italic':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onItalic.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <FormatItalic />
          </IconButton>
        );

      case 'underline':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onUnderline.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <FormatUnderlined />
          </IconButton>
        );

      case 'strikethrough':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onStrikethrough.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
            style={{ zIndex: 4 }}
          >
            <FormatStrikethrough />
          </IconButton>
        );
      
      case 'font-size':
        return this.renderFontSizeDropDown(loading);

      case 'font-family':
        return this.renderFontFamilyDropDown(loading);

      case 'link':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onHyperLink.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <InsertLink />
          </IconButton>
        );

      case 'bulleted-list':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onBulletList.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <FormatListBulleted />
          </IconButton>
        );

      case 'numbered-list':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onOrderedList.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <FormatListNumbered />
          </IconButton>
        );

      case 'decrease-indent':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onDecreaseIndent.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <DecreaseIndent />
          </IconButton>
        );

      case 'increase-indent':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onIncreaseIndent.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <IncreaseIndent />
          </IconButton>
        );
      
      case 'blockquote':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onBlockquote.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <FormatQuote />
          </IconButton>
        );

      case 'hr': {
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onHR.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <Hr
              color="black"
              size={24}
            />
          </IconButton>
        )
      }
        
      case 'highlight-select':
        return (
          <IconButton
            key={toolName}
            style={{backgroundColor: highlightSelectModes[instanceKey] ? 'rgb(188, 188, 188)' : 'initial'}}
            onMouseDown={this.onHighlightSelectMode.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={loading}
          >
            <CropFree />
          </IconButton>
        );
        
      case 'highlight-delete':
        return (
          <IconButton
            key={toolName}
            onMouseDown={this.onDeleteHighlight.bind(this)}
            onMouseOver={this.onTooltipOpen.bind(this, toolName)}
            onMouseOut={this.onTooltipClose.bind(this, toolName)}
            tooltip={!this.state.hiddenTools.includes(toolName) ? text : undefined}
            disabled={!selectedHighlights[instanceKey] || loading}
          >
            <DeleteForever />
          </IconButton>
        );
        
      default:
        return (<div />);
    }
  }

  renderTooltipFromHidden ({ toolName, text }) {
    return (
      <Popover
        key={toolName}
        open={this.state.tooltipOpen[toolName]}
        anchorEl={this.state.tooltipAnchor[toolName]}
        zDepth={5}
        className="tooltip-popover"
        anchorOrigin={{horizontal: 'middle', vertical: 'bottom'}}
        targetOrigin={{horizontal: 'middle', vertical: 'top'}}
        useLayerForClickAway={false}
        autoCloseWhenOffScreen={false}
      >
        {text}
      </Popover>
    );
  }

  onTooltipOpen (toolName, e) {
    e.persist();
    const anchorEl = e.currentTarget;
    e.preventDefault();
    this.setState((prevState) => {
      return {
        ...prevState,
        tooltipOpen: { ...prevState.tooltipOpen, [toolName]: true },
        tooltipAnchor: { ...prevState.tooltipAnchor, [toolName]: anchorEl },
      }
    });
  }

  onTooltipClose (toolName) {
    this.setState((prevState) => {
      return {
        ...prevState,
        tooltipOpen: { ...prevState.tooltipOpen, [toolName]: false },
      }
    });
    this.state.editorView.focus();
  }

  onToolbarWidthChange(node) {
    if (node && node.offsetWidth !== this.state.toolbarWidth) {
      let hiddenTools = this.state.hiddenTools;
      let sumWidths = 0;
      let hidingBegan = false;
      this.tools
        .sort((a, b) => a.position - b.position)
        .forEach((tool) => {
          if (sumWidths + tool.width + buttonWidth < node.offsetWidth && !hidingBegan) {
            sumWidths += tool.width;
            if (hiddenTools.includes(tool.name)) {
              hiddenTools.splice(hiddenTools.indexOf(tool.name), 1);
            }
          } else {
            hidingBegan = true;
            hiddenTools.push(tool.name);
          }
        });
      this.setState({ hiddenTools });
      this.setState({ toolbarWidth: node.offsetWidth });
    }
  }

  onScrollChange (node) {
    if (node !== null && node.scrollTop !== this.state.currentScrollTop) {
      this.setState({ currentScrollTop: node.scrollTop });
    }
  }

  createDocumentSchema() {
    const { document_id } = this.props;
    const instanceKey = this.getInstanceKey();

    const toDOM = function(mark) {
      const highlightInfo = this.props.getHighlightMap()[mark.attrs.highlightUid];
      const color = highlightInfo ? highlightInfo.color : (mark.attrs.tempColor || this.props.highlightColors[instanceKey]);
      const properties = {
        class: `dm-highlight ${instanceKey}-${mark.attrs.highlightUid}`,
        style: `background: ${color};`,
        onclick: `window.selectTextHighlight('${document_id}', '${mark.attrs.highlightUid}', '${instanceKey}')`,
        onmouseenter: `window.showRollover('${document_id}', '${mark.attrs.highlightUid}', '${instanceKey}')`,
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
    const { editorStates } = this.props;
    const existingEditorState = editorStates[this.getInstanceKey()];

    if( !existingEditorState ) {
      return this.createEditorState();
    } else {
      return existingEditorState;
    }
  }

  createEditorState() {
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
        "Mod-u": this.onUnderlineByKey.bind(this),
        "Ctrl-u": this.onUnderlineByKey.bind(this),
        "Mod-X": this.onStrikethroughByKey.bind(this),
        "Ctrl-X": this.onStrikethroughByKey.bind(this),
        "Tab": this.onIncreaseIndentByKey.bind(this),
        "Shift-Tab": this.onDecreaseIndentByKey.bind(this),
      })
    );

    const highlightSelectPlugin = new Plugin({
      props: {
        decorations: function(state) {
          let decorations = [];
          const selectedHighlight = this.props.getSelectedHighlight(this.getInstanceKey());
          if (selectedHighlight) {
            state.doc.descendants((node, position) => {
              node.marks.forEach(mark => {
                if (mark.type.name === this.state.documentSchema.marks.highlight.name && mark.attrs.highlightUid === selectedHighlight)
                  decorations.push(Decoration.node(position, position + node.nodeSize, {class: 'selected'}));
              });
            });
          }
          return DecorationSet.create(state.doc, decorations);
        }.bind(this)
      }
    });

    plugins.push(highlightSelectPlugin);


    const highlightTargetPlugin = new Plugin({
      props: {
        decorations: function(state) {
          let decorations = [];
          const targetHighlights = this.state.targetHighlights;
          if (targetHighlights && targetHighlights.length > 0) {
            state.doc.descendants((node, position) => {
              node.marks.forEach(mark => {
                if (mark.type.name === this.state.documentSchema.marks.highlight.name && targetHighlights.includes(mark.attrs.highlightUid)) {
                  decorations.push(Decoration.node(position, position + node.nodeSize, {class: 'targeted'}));
                }
              });
            });
          }
          return DecorationSet.create(state.doc, decorations);
        }.bind(this)
      }
    });

    plugins.push(highlightTargetPlugin);

    // create a new editor state
    const doc = dmSchema.nodeFromJSON(this.props.content);
    const editorState = EditorState.create({
      doc,
      selection: TextSelection.create(doc, 0),
      plugins
    })
    this.props.updateEditorState(this.getInstanceKey(), editorState);
    return editorState;
  }

  toSearchText(document) {
    return document.textBetween(0,document.textContent.length+1, ' ');
  }

  onHighlight = (e) => {
    e.preventDefault();
    const markType = this.state.documentSchema.marks.highlight;
    const { document_id } = this.props;
    const editorState = this.getEditorState();
    const cmd = addMark( markType, {highlightUid: `dm_text_highlight_${Date.now()}`, documentId: document_id });
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onColorPickerOpen(e) {
    e.preventDefault();
    this.setState({
      colorPickerOpen: true,
      colorPickerAnchor: e.currentTarget,
    });
  }

  onColorPickerClose() {
    this.setState({
      colorPickerOpen: false,
    });
    this.state.editorView.focus();
  }

  onChangeTextColor = (color) => {
    this.setState({ textColor: color.hex });
    const colorMarkType = this.state.documentSchema.marks.color;
    const editorState = this.getEditorState();
    const cmd = color ? addMark( colorMarkType, { color: color.hex } ) : removeMark( colorMarkType );
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onBold = (e) => {
    e.preventDefault();
    const markType = this.state.documentSchema.marks.strong;
    const editorState = this.getEditorState();
    const cmd = toggleMark( markType );
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onItalic = (e) => {
    e.preventDefault();
    const markType = this.state.documentSchema.marks.em;
    const editorState = this.getEditorState();
    const cmd = toggleMark( markType );
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onUnderlineByKey = (editorState) => {
    const markType = this.state.documentSchema.marks.underline;
    const cmd = toggleMark( markType );
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  preventDefaultKeymaps = (e) => {
    if (
      (e.metaKey && e.key === 'u')
      || (e.ctrlKey && e.key === 'u')
      || (e.key === 'Tab')
      ) {
      e.preventDefault();
    }
  }

  onUnderline = (e) => {
    e.preventDefault();
    const markType = this.state.documentSchema.marks.underline;
    const editorState = this.getEditorState();
    const cmd = toggleMark( markType );
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onStrikethrough = (e) => {
    e.preventDefault();
    const markType = this.state.documentSchema.marks.strikethrough;
    const editorState = this.getEditorState();
    const cmd = toggleMark( markType );
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onStrikethroughByKey = (editorState) => {
    const markType = this.state.documentSchema.marks.strikethrough;
    const cmd = toggleMark( markType );
    cmd( editorState, this.state.editorView.dispatch );
  }

  onIncreaseIndent = (e) => {
    e.preventDefault();
    const nodeType = this.state.documentSchema.nodes.paragraph;
    const editorState = this.getEditorState();
    const cmd = increaseIndent(nodeType, false);
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onDecreaseIndent = (e) => {
    e.preventDefault();
    const nodeType = this.state.documentSchema.nodes.paragraph;
    const editorState = this.getEditorState();
    const cmd = decreaseIndent(nodeType, true);
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onIncreaseIndentByKey = (editorState) => {
    const nodeType = this.state.documentSchema.nodes.paragraph;
    const cmd = increaseIndent(nodeType, true);
    cmd( editorState, this.state.editorView.dispatch );
  }

  onDecreaseIndentByKey = (editorState) => {
    const nodeType = this.state.documentSchema.nodes.paragraph;
    const cmd = decreaseIndent(nodeType, false);
    cmd( editorState, this.state.editorView.dispatch );
  }

  // markActive(state, type) {
  //   let {from, $from, to, empty} = state.selection
  //   if (empty) return type.isInSet(state.storedMarks || $from.marks())
  //   else return state.doc.rangeHasMark(from, to, type)
  // }

  onHyperLink = (e) => {
    e.preventDefault();

    // http://prosemirror.net/examples/menu/
    // is the caret in a hyperlink presently?

    const createHyperlink = (url) => {
      const markType = this.state.documentSchema.marks.link;
      const editorState = this.getEditorState();
      const cmd = addMark( markType, { href: url } );
      cmd( editorState, this.state.editorView.dispatch );
    }
    this.setState( {...this.state, linkDialogOpen: true, createHyperlink } );
    this.state.editorView.focus();
  }

  onOrderedList(e) {
    e.preventDefault();
    const orderedListNodeType = this.state.documentSchema.nodes.ordered_list;
    const editorState = this.getEditorState();
    const cmd = wrapInList( orderedListNodeType );
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onBulletList(e) {
    e.preventDefault();
    const bulletListNodeType = this.state.documentSchema.nodes.bullet_list;
    const editorState = this.getEditorState();
    const cmd = wrapInList( bulletListNodeType );
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onBlockquote(e) {
    e.preventDefault();
    const blockquoteNodeType = this.state.documentSchema.nodes.blockquote;
    const editorState = this.getEditorState();
    const cmd = wrapIn( blockquoteNodeType );
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onHR(e) {
    e.preventDefault();
    const hrNodeType = this.state.documentSchema.nodes.horizontal_rule;
    const editorState = this.getEditorState();
    const cmd = replaceNodeWith(hrNodeType);
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onFontSizeChange(e,i,fontSize) {
    e.preventDefault();
    const textStyleMarkType = this.state.documentSchema.marks.textStyle;
    const editorState = this.getEditorState();
    const cmd = fontSize ? addMark( textStyleMarkType, { fontSize } ) : removeMark( textStyleMarkType );
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onFontFamilyChange(e,i,fontFamily) {
    e.preventDefault();
    const fontFamilyMarkType = this.state.documentSchema.marks.fontFamily;
    const editorState = this.getEditorState();
    const cmd = fontFamily ? addMark( fontFamilyMarkType, { fontFamily } ) : removeMark( fontFamilyMarkType );
    cmd( editorState, this.state.editorView.dispatch );
    this.state.editorView.focus();
  }

  onHighlightSelectMode(e) {
    e.preventDefault();
    const key = this.getInstanceKey();
    this.props.setHighlightSelectMode(key, !this.props.highlightSelectModes[key]);
  }

  onDeleteHighlight(e) {
    e.preventDefault();
    const selectedHighlight = this.props.selectedHighlights[this.getInstanceKey()];
    if (selectedHighlight) {
      const markType = this.state.documentSchema.marks.highlight;
      const editorState = this.getEditorState();
      const cmd = removeMark( markType, selectedHighlight );
      cmd( editorState, this.state.editorView.dispatch );
    }
    this.state.editorView.focus();
  }

  onHiddenToolsOpen(e) {
    e.preventDefault();
    this.setState({
      hiddenToolsOpen: true,
      hiddenToolsAnchor: e.currentTarget,
    });
  }

  onHiddenToolsClose(e) {
    this.setState({
      hiddenToolsOpen: false,
    });
  }

  componentWillReceiveProps(nextProps) {
    // When we receive new EditorState through props — we apply it to the
    // EditorView instance and update local state for this component
    const editorState = this.getEditorState();
    if (editorState && nextProps.editorStates ) {
     const nextEditorState = nextProps.editorStates[this.getInstanceKey()];
     if( this.state.editorView && nextEditorState ) {
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
        editable: () => this.isEditable() && !this.props.loading,
      });

      let targetHighlight = null;
      // if a highlight is targeted, locate it in props
      if( this.props.firstTarget ) {
        for( let key in this.props.highlight_map ) {
          let currentHighlight = this.props.highlight_map[key]
          if( currentHighlight.uid === this.props.firstTarget ) {
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

      this.setState(prevState => (
        { 
          ...prevState,
          targetHighlights: targetHighlight !== null ? [...prevState.targetHighlights, targetHighlight.target] : [],
          editorView
        }
      ));
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
      this.props.updateEditorState(this.getInstanceKey(), nextEditorState);
    }.bind(this));
  };

  processAndConfirmTransaction = (tx, callback) => {
    let postponeCallback = false;
    let postContentChanges = true;
    const serializer = DOMSerializer.fromSchema(this.state.documentSchema);
    const { steps } = tx;
    const { document_id } = this.props;
    let alteredHighlights = [];
    let effectedMarks = [];
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
        effectedMarks = effectedMarks.concat(this.collectHighlights(editorState.doc, from, to));
        const additionTo = step.to + (tx.doc.nodeSize - tx.before.nodeSize);
        const possibleNewMarks = this.collectHighlights(tx.doc, step.from, additionTo);
        possibleNewMarks.forEach(mark => {
          if (!effectedMarks.includes(mark) && !this.highlightsToDuplicate.map(item => item.newHighlightUid).includes(mark.attrs.highlightUid)) {
            this.createHighlight(mark, tx.doc.slice(step.from, additionTo), serializer);
          }
        });
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
      let toRemoveUids = [];
      for (let i = 0; i < removedMarks.length; i++) {
        const uid = removedMarks[i].attrs.highlightUid;
        if (toRemoveUids.indexOf(uid) < 0) toRemoveUids.push(uid);
      }
      if (toRemoveUids.length > 0) {
        postponeCallback = true;
        postContentChanges = false;
        this.props.openDeleteDialog(
          'Removing highlight' + (toRemoveUids.length > 1 ? 's' : ''),
          'Are you sure you want to destroy ' + (toRemoveUids.length > 1 ? (toRemoveUids.length) + ' highlights and their ' : 'a highlight and its ') + 'links?',
          'Destroy ' + (toRemoveUids.length > 1 ? (toRemoveUids.length) + ' highlights' : 'highlight'),
          {
            transaction: tx,
            document_id,
            highlights: toRemoveUids.map(uid => this.props.highlight_map[uid]),
            highlightsToDuplicate: this.highlightsToDuplicate.slice(0),
            alteredHighlights,
            instanceKey: this.getInstanceKey(),
            timeOpened: this.props.timeOpened,
          },
          TEXT_HIGHLIGHT_DELETE
        );
      }
    }
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
    const delay = 500; // milliseconds
    const content = doc.content;
    const search_text = this.toSearchText(doc)
    if (this.scheduledContentUpdate) {
      window.clearTimeout(this.scheduledContentUpdate);
    }
    this.scheduledContentUpdate = window.setTimeout(function() {
      this.props.updateDocument(
        this.props.document_id,
        {content: {type: 'doc', content}, search_text},
        { refreshDocumentContent: true, timeOpened: this.props.timeOpened },
      );
    }.bind(this), delay);
  }

  getInstanceKey() {
    const { document_id, timeOpened } = this.props;
    return `${document_id}-${timeOpened}`;
  }

  renderColorPicker() {
    return (
      <Popover
        open={this.state.colorPickerOpen}
        anchorEl={this.state.colorPickerAnchor}
        className="color-picker-popover"
        anchorOrigin={{horizontal: 'left', vertical: 'bottom'}}
        targetOrigin={{horizontal: 'left', vertical: 'top'}}
        onRequestClose={this.onColorPickerClose.bind(this)}
        animated={false}
      >
        <SketchPicker
          color={this.state.textColor}
          onChangeComplete={this.onChangeTextColor.bind(this)}
        />
      </Popover>
    )
  }

  renderFontSizeDropDown(loading) {
    return (
      <DropDownMenu
        key="fontSizeDropdown"
        value={'12pt'}
        onChange={this.onFontSizeChange.bind(this)}
        onMouseOver={this.onTooltipOpen.bind(this, 'font-size')}
        onMouseOut={this.onTooltipClose.bind(this, 'font-size')}
        autoWidth={false}
        disabled={loading}
        className="font-size-dropdown"
      >
        {[...Array(128).keys()].filter(key => key !== 0).map(key =>
          <MenuItem key={`${key}pt`} value={`${key}pt`} primaryText={key} />
        )}
      </DropDownMenu>
    );
  }

  renderFontFamilyDropDown(loading) {
    return (
      <DropDownMenu
        key="fontFamilyDropdown"
        value={'sans-serif'}
        onChange={this.onFontFamilyChange.bind(this)}
        onMouseOver={this.onTooltipOpen.bind(this, 'font-family')}
        onMouseOut={this.onTooltipClose.bind(this, 'font-family')}
        autoWidth={false}
        disabled={loading}
        className="font-family-dropdown"
      >
        {fontFamilies.map(key =>
          <MenuItem
            key={key}
            value={key}
            style={{ fontFamily: key }}
            primaryText={key[0].toUpperCase() + key.slice(1)}
          />
        )}
      </DropDownMenu>
    );
  }

  renderToolbar() {

    if( !this.isEditable() ) return <div></div>;

    return (
      <div 
        ref={this.onToolbarWidthChange.bind(this)}
      >
        <Toolbar
          style={{ minHeight: '55px' }}
          onMouseDown={(e) => e.preventDefault()} 
        >
          <ToolbarGroup>
            {this.tools.sort((a, b) => a.position - b.position)
              .filter(tool => !this.state.hiddenTools.includes(tool.name))
              .map(tool => this.renderTool({ toolName: tool.name, text: tool.text }))
            }
            {this.state.hiddenTools.length > 0 && (
              <>
                <IconButton
                  onMouseDown={this.onHiddenToolsOpen.bind(this)}
                  disabled={this.props.loading}
                >
                  <EllipsisIcon />
                </IconButton>
                <Popover
                  open={this.state.hiddenToolsOpen}
                  anchorEl={this.state.hiddenToolsAnchor}
                  className="hidden-tools-popover"
                  anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
                  targetOrigin={{horizontal: 'right', vertical: 'top'}}
                  onRequestClose={this.onHiddenToolsClose.bind(this)}
                >
                  {this.tools.sort((a, b) => a.position - b.position)
                    .filter(tool => this.state.hiddenTools.includes(tool.name))
                    .map(tool => this.renderTool({ toolName: tool.name, text: tool.text }))
                  }
                </Popover>
                {this.tools.sort((a, b) => a.position - b.position)
                  .filter(tool => this.state.hiddenTools.includes(tool.name))
                  .map(tool => this.renderTooltipFromHidden({ toolName: tool.name, text: tool.text }))
                }
              </>
            )}
            {this.renderTooltipFromHidden({ toolName: 'font-family', text: 'Font' })}
            {this.renderTooltipFromHidden({ toolName: 'font-size', text: 'Font size (pt)' })}
          </ToolbarGroup>
        </Toolbar>
        { this.renderColorPicker() }
      </div>
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
    return (
      <div style={{flexGrow: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        { this.props.writeEnabled ? this.renderToolbar() : "" }
        <div
          ref={this.onScrollChange.bind(this)}
          className="editorview-wrapper" 
          style={{
            overflowY: (this.props.loading && this.isEditable()) ? 'hidden' : 'scroll',
          }}
          onKeyDown={this.preventDefaultKeymaps.bind(this)}
        >
          {this.props.loading && this.isEditable() && (
            <div className="editorview-loading-indicator" style={{
              top: this.state.currentScrollTop
            }}>
              <CircularProgress
                size={100}
                thickness={10}
                color="white"
              />
            </div>
          )}
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
  displayColorPickers: state.textEditor.displayColorPickers,
  highlightSelectModes: state.textEditor.highlightSelectModes,
  selectedHighlights: state.textEditor.selectedHighlights
});

const mapDispatchToProps = dispatch => bindActionCreators({
  updateEditorState,
  addHighlight,
  updateHighlight,
  duplicateHighlights,
  setTextHighlightColor,
  toggleTextColorPicker,
  setHighlightSelectMode,
  selectHighlight,
  updateDocument,
  openDeleteDialog,
  setGlobalCanvasDisplay,
  closeEditor,
}, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(TextResource);
