// Add new CSS styles here
const supportedTextStyles = {
  fontSize: { cssKey: 'font-size', default: '12pt' },
  textDecoration: { cssKey: 'text-decoration', default: 'none' },
};

// The textStyle ProseMirror MarkSpec
export const textStyle = {
  attrs: textStyleMarkAttributes(),
  parseDOM: [{
    tag: 'span',
    getAttrs(dom) {
      return cssToMarkAttr(dom.getAttribute('style'));
    },
  }],
  toDOM(mark) {
    return ['span', { style: markAttrsToCSS(mark.attrs) }, 0];
  },
};

function textStyleMarkAttributes() {
  const markAttrs = {};
  for (const styleKey of Object.keys(supportedTextStyles)) {
    const defaultValue = supportedTextStyles[styleKey].default;
    markAttrs[styleKey] = { default: defaultValue };
  }
  return markAttrs;
}

function cssToMarkAttr(styleAttribute) {
  if (!styleAttribute) return null;

  const cssExpressions = styleAttribute.split(';');
  const foundStyles = {};
  for (const cssExpression of cssExpressions) {
    for (const styleKey of Object.keys(supportedTextStyles)) {
      const { cssKey } = supportedTextStyles[styleKey];
      const styleRegEx = new RegExp(`^\\s*${cssKey}:\\s*([^;]*)`);
      const matches = cssExpression.match(styleRegEx);
      const value = matches && matches.length > 1 ? matches[1] : null;
      if (value) {
        foundStyles[styleKey] = value;
      }
    }
  }

  return foundStyles;
}

function markAttrsToCSS(attrs) {
  let styleStr = '';
  for (const styleKey of Object.keys(supportedTextStyles)) {
    const { cssKey } = supportedTextStyles[styleKey];
    const value = attrs[styleKey];
    if (value) {
      styleStr = styleStr.concat(`${cssKey}:${value};`);
    }
  }
  return styleStr;
}
