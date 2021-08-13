import {Schema} from "prosemirror-model"
import {textStyle} from "./TextStyleMarkSpec"

const blockquoteDOM = ["blockquote", 0], hrDOM = ["hr"],
      preDOM = ["pre", ["code", 0]], brDOM = ["br"]

// :: Object
// [Specs](#model.NodeSpec) for the nodes defined in this schema.
export const nodes = {
  // :: NodeSpec The top level document node.
  doc: {
    content: "block+"
  },

  // :: NodeSpec A plain paragraph textblock. Represented in the DOM
  // as a `<p>` element.
  paragraph: {
    content: "inline*",
    group: "block",
    parseDOM: [{
      tag: "p",
      getAttrs: node => {
        const marginLeft = node.style['margin-left'].split('px')[0];
        const indentLevel = parseInt(marginLeft, 10) / 48;
        return {
          indented: node.style['text-indent'] === '3em',
          indentLevel,
        }
      }
    }],
    attrs: {
      indented: {default: false},
      indentLevel: {default: 0},
    },
    toDOM(node) {
      const textIndent = node.attrs.indented ? '3em' : '0';
      const marginLeft = `${node.attrs.indentLevel * 48}px`;
      return ["p", {
        style: `text-indent: ${textIndent}; margin-left: ${marginLeft}`
      }, 0];
    }
  },

  // :: NodeSpec A blockquote (`<blockquote>`) wrapping one or more blocks.
  blockquote: {
    content: "block+",
    group: "block",
    defining: true,
    parseDOM: [{tag: "blockquote"}],
    toDOM() { return blockquoteDOM }
  },

  // :: NodeSpec A horizontal rule (`<hr>`).
  horizontal_rule: {
    group: "block",
    parseDOM: [{tag: "hr"}],
    toDOM() { return hrDOM }
  },

  // :: NodeSpec A heading textblock, with a `level` attribute that
  // should hold the number 1 to 6. Parsed and serialized as `<h1>` to
  // `<h6>` elements.
  heading: {
    attrs: {level: {default: 1}},
    content: "inline*",
    group: "block",
    defining: true,
    parseDOM: [{tag: "h1", attrs: {level: 1}},
               {tag: "h2", attrs: {level: 2}},
               {tag: "h3", attrs: {level: 3}},
               {tag: "h4", attrs: {level: 4}},
               {tag: "h5", attrs: {level: 5}},
               {tag: "h6", attrs: {level: 6}}],
    toDOM(node) { return ["h" + node.attrs.level, 0] }
  },

  // :: NodeSpec A code listing. Disallows marks or non-text inline
  // nodes by default. Represented as a `<pre>` element with a
  // `<code>` element inside of it.
  code_block: {
    content: "text*",
    marks: "",
    group: "block",
    code: true,
    defining: true,
    parseDOM: [{tag: "pre", preserveWhitespace: "full"}],
    toDOM() { return preDOM }
  },

  // :: NodeSpec The text node.
  text: {
    group: "inline"
  },

  // :: NodeSpec An inline image (`<img>`) node. Supports `src`,
  // `alt`, and `href` attributes. The latter two default to the empty
  // string.
  image: {
    inline: true,
    attrs: {
      src: {},
      alt: {default: null},
      title: {default: null}
    },
    group: "inline",
    draggable: true,
    parseDOM: [{tag: "img[src]", getAttrs(dom) {
      return {
        src: dom.getAttribute("src"),
        title: dom.getAttribute("title"),
        alt: dom.getAttribute("alt")
      }
    }}],
    toDOM(node) { return ["img", node.attrs] }
  },

  // :: NodeSpec A hard line break, represented in the DOM as `<br>`.
  hard_break: {
    inline: true,
    group: "inline",
    selectable: false,
    parseDOM: [{tag: "br"}],
    toDOM() { return brDOM }
  }
}

const emDOM = ["em", 0], strongDOM = ["strong", 0], codeDOM = ["code", 0]

// :: Object [Specs](#model.MarkSpec) for the marks in the schema.
export const marks = {
  // :: MarkSpec A link. Has `href` and `title` attributes. `title`
  // defaults to the empty string. Rendered and parsed as an `<a>`
  // element.
  link: {
    attrs: {
      href: {},
      title: {default: null},
      target: {default: '_blank'}
    },
    inclusive: false,
    parseDOM: [{tag: "a[href]", getAttrs(dom) {
      return {href: dom.getAttribute("href"), title: dom.getAttribute("title")}
    }}],
    toDOM(node) { return ["a", node.attrs, 0] }
  },

  // :: MarkSpec An emphasis mark. Rendered as an `<em>` element.
  // Has parse rules that also match `<i>` and `font-style: italic`.
  em: {
    parseDOM: [{tag: "i"}, {tag: "em"}],
    toDOM() { return emDOM }
  },

  underline: {
    parseDOM: [{tag: "u"}],
    toDOM() { return ["u", 0] }
  },

  strikethrough: {
    parseDOM: [{tag: "s"}],
    toDOM() { return ["s", 0] }
  },

  fontSize: {
    attrs: {fontSize: {default: '12pt'}},
    toDOM(mark) {
        let fontSize=mark.attrs.fontSize; 
        return ["span", { style: `font-size:${fontSize}` }, 0] 
    }
  },

  fontFamily: {
    attrs: {fontFamily: {default: '12pt'}},
    toDOM(mark) {
        let fontFamily=mark.attrs.fontFamily; 
        return ["span", { style: `font-family:${fontFamily}` }, 0] 
    }
  },

  color: {
    attrs: {color: {default: 'black'}},
    toDOM(mark) {
        let color=mark.attrs.color; 
        return ["span", { style: `color:${color}` }, 0] 
    }
  },

  textStyle: textStyle,

  // :: MarkSpec A strong mark. Rendered as `<strong>`, parse rules
  // also match `<b>` and `font-weight: bold`.
  strong: {
    parseDOM: [{tag: "strong"},
               // This works around a Google Docs misbehavior where
               // pasted content will be inexplicably wrapped in `<b>`
               // tags with a font-weight normal.
               {tag: "b", getAttrs: node => node.style.fontWeight !== "normal" && null},
               {style: "font-weight", getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null}],
    toDOM() { return strongDOM }
  },

  // :: MarkSpec Code font mark. Represented as a `<code>` element.
  code: {
    parseDOM: [{tag: "code"}],
    toDOM() { return codeDOM }
  }
}

// :: Schema
// This schema rougly corresponds to the document schema used by
// [CommonMark](http://commonmark.org/), minus the list elements,
// which are defined in the [`prosemirror-schema-list`](#schema-list)
// module.
//
// To reuse elements from this schema, extend or read from its
// `spec.nodes` and `spec.marks` [properties](#model.Schema.spec).
export const schema = new Schema({nodes, marks})
