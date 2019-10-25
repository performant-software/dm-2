const { Schema } = require('prosemirror-model');
const { schema } = require('./dm-text-schema');
const { addListNodes } = require('prosemirror-schema-list');

function createDocumentSchema() {

    const toDOM = function(mark) {
      const color = 'black';
      const properties = {
        class: 'dm-highlight', 
        style: `background: ${color};`
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

module.exports.createDocumentSchema = createDocumentSchema
