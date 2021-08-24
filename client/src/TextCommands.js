import { liftListItem } from 'prosemirror-schema-list';
import { ReplaceAroundStep } from 'prosemirror-transform';
import { Slice, Fragment } from 'prosemirror-model';

function markApplies(doc, ranges, type) {
  for (let i = 0; i < ranges.length; i++) {
    const { $from, $to } = ranges[i];
    let can = $from.depth === 0 ? doc.type.allowsMarkType(type) : false;
    doc.nodesBetween($from.pos, $to.pos, (node) => {
      if (can) return false;
      can = node.inlineContent && node.type.allowsMarkType(type);
    });
    if (can) return true;
  }
  return false;
}

export function addMark(markType, attrs) {
  return function (state, dispatch) {
    const { empty, $cursor, ranges } = state.selection;
    if ((empty && !$cursor) || !markApplies(state.doc, ranges, markType)) return false;
    if (dispatch) {
      if ($cursor) {
        dispatch(state.tr.addStoredMark(markType.create(attrs)));
      } else {
        let has = false; const
          { tr } = state;
        for (let i = 0; !has && i < ranges.length; i++) {
          const { $from, $to } = ranges[i];
          has = state.doc.rangeHasMark($from.pos, $to.pos, markType);
        }
        for (let i = 0; i < ranges.length; i++) {
          const { $from, $to } = ranges[i];
          tr.addMark($from.pos, $to.pos, markType.create(attrs));
        }
        dispatch(tr);
      }
    }
    return true;
  };
}

export function removeMark(markType, uid) {
  return function (state, dispatch) {
    const { empty, $cursor, ranges } = state.selection;
    if (!uid && ((empty && !$cursor) || !markApplies(state.doc, ranges, markType))) return false;
    if (dispatch) {
      if (markType && uid) {
        let transform = null;
        state.doc.descendants((node, position) => {
          node.marks.forEach((mark) => {
            if (mark.type.name === markType.name && mark.attrs.highlightUid === uid) {
              if (transform) {
                // chain removal steps for additional marks onto the first step in the transform
                transform.removeMark(position, position + node.nodeSize, mark);
              } else {
                transform = state.tr.removeMark(position, position + node.nodeSize, mark);
              }
            }
          });
        });
        if (transform) dispatch(transform);
      }
      // no longer used for deleting highlights
      else if ($cursor) {
        dispatch(state.tr.removeStoredMark(markType));
      } else {
        let has = false; const
          { tr } = state;
        for (let i = 0; !has && i < ranges.length; i++) {
          const { $from, $to } = ranges[i];
          has = state.doc.rangeHasMark($from.pos, $to.pos, markType);
        }
        for (let i = 0; i < ranges.length; i++) {
          const { $from, $to } = ranges[i];
          if (has) tr.removeMark($from.pos, $to.pos, markType);
        }
        dispatch(tr.scrollIntoView());
      }
    }
    return true;
  };
}

function canInsert(state, nodeType) {
  const { $from } = state.selection;
  for (let d = $from.depth; d >= 0; d--) {
    const index = $from.index(d);
    if ($from.node(d).canReplaceWith(index, index, nodeType)) { return true; }
  }
  return false;
}

export function replaceNodeWith(nodeType) {
  return function (state, dispatch) {
    if (canInsert(state, nodeType)) {
      dispatch(state.tr.replaceSelectionWith(nodeType.create()));
    }
    return true;
  };
}

export function setNodeAttributes(nodeType, attributes) {
  return function (state, dispatch) {
    const { ranges } = state.selection;
    const transaction = state.tr;
    for (let i = 0; i < ranges.length; i++) {
      const { $from, $to } = ranges[i];
      state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.name === nodeType.name) {
          const attrs = { ...node.attrs, ...attributes };
          const newNode = nodeType.create(attrs, null, node.marks);
          transaction.step(
            new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1,
              pos + node.nodeSize - 1,
              new Slice(Fragment.from(newNode), 0, 0),
              1, true),
          );
        }
      });
    }
    if (transaction.docChanged) {
      dispatch(transaction);
    }
    return true;
  };
}

export function increaseIndent(nodeType, withHanging) {
  return function (state, dispatch) {
    const { ranges } = state.selection;
    const transaction = state.tr;
    for (let i = 0; i < ranges.length; i++) {
      const { $from, $to } = ranges[i];
      state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.name === nodeType.name) {
          if (node.attrs.indented === false && node.attrs.indentLevel === 0 && withHanging) {
            const attrs = { ...node.attrs, indented: true };
            const newNode = nodeType.create(attrs, null, node.marks);
            transaction.step(
              new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1,
                pos + node.nodeSize - 1,
                new Slice(Fragment.from(newNode), 0, 0),
                1, true),
            );
          } else if (node.attrs.indentLevel < 5) {
            let { indentLevel } = node.attrs;
            indentLevel += 1;
            const attrs = { ...node.attrs, indentLevel };
            const newNode = nodeType.create(attrs, null, node.marks);
            transaction.step(
              new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1,
                pos + node.nodeSize - 1,
                new Slice(Fragment.from(newNode), 0, 0),
                1, true),
            );
          }
        }
      });
    }
    if (transaction.docChanged) {
      dispatch(transaction);
    }
    return true;
  };
}

export function decreaseIndent(nodeType, withHanging) {
  return function (state, dispatch) {
    const { ranges } = state.selection;
    const transaction = state.tr;
    for (let i = 0; i < ranges.length; i++) {
      const { $from, $to } = ranges[i];
      let removedFromList = false;
      state.doc.nodesBetween($from.pos, $to.pos, (node) => {
        if (node.type.name === 'list_item') {
          node.descendants((node) => {
            if (node.type.name === nodeType.name) {
              if (node.attrs.indentLevel === 0 && node.attrs.indented === false) {
                removedFromList = true;
              }
            }
          });
          if (removedFromList) {
            const cmd = liftListItem(node.type);
            cmd(state, dispatch);
          }
        }
      });
      if (removedFromList) return true;

      state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
        if (node.type.name === nodeType.name) {
          if (node.attrs.indentLevel > 0 && (
            node.attrs.indented === false || (withHanging && node.attrs.indented === true)
          )) {
            let { indentLevel } = node.attrs;
            indentLevel -= 1;
            const attrs = { ...node.attrs, indentLevel };
            const newNode = nodeType.create(attrs, null, node.marks);
            transaction.step(
              new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1,
                pos + node.nodeSize - 1,
                new Slice(Fragment.from(newNode), 0, 0),
                1, true),
            );
          } else if (node.attrs.indented === true && !withHanging) {
            const attrs = { ...node.attrs, indented: false };
            const newNode = nodeType.create(attrs, null, node.marks);
            transaction.step(
              new ReplaceAroundStep(pos, pos + node.nodeSize, pos + 1,
                pos + node.nodeSize - 1,
                new Slice(Fragment.from(newNode), 0, 0),
                1, true),
            );
          }
        }
      });
      if (transaction.docChanged) {
        dispatch(transaction);
      }
      return true;
    }
  };
}
