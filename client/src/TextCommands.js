function markApplies(doc, ranges, type) {
    for (let i = 0; i < ranges.length; i++) {
        let {$from, $to} = ranges[i]
        let can = $from.depth === 0 ? doc.type.allowsMarkType(type) : false
        doc.nodesBetween($from.pos, $to.pos, node => {
            if (can) return false
            can = node.inlineContent && node.type.allowsMarkType(type)
        })
        if (can) return true
    }
    return false
}

export function addMark(markType, attrs) {
    return function(state, dispatch) {
        let {empty, $cursor, ranges} = state.selection
        if ((empty && !$cursor) || !markApplies(state.doc, ranges, markType)) return false
        if (dispatch) {
            if ($cursor) {
                dispatch(state.tr.addStoredMark(markType.create(attrs)))
            } else {
                let has = false, tr = state.tr
                for (let i = 0; !has && i < ranges.length; i++) {
                    let {$from, $to} = ranges[i]
                    has = state.doc.rangeHasMark($from.pos, $to.pos, markType)
                }
                for (let i = 0; i < ranges.length; i++) {
                    let {$from, $to} = ranges[i]
                    tr.addMark($from.pos, $to.pos, markType.create(attrs))
                }
                dispatch(tr) 
            }
        }
        return true
    }
}

export function removeMark(markType, uid) {
    return function(state, dispatch) {
        let {empty, $cursor, ranges} = state.selection
        if (!uid && ((empty && !$cursor) || !markApplies(state.doc, ranges, markType))) return false
        if (dispatch) {
            if (markType && uid) {
              let transform = null;
              state.doc.descendants((node, position) => {
                node.marks.forEach(mark => {
                  if (mark.type.name === markType.name && mark.attrs.highlightUid === uid) {
                    if (transform) {
                      // chain removal steps for additional marks onto the first step in the transform
                      transform.removeMark(position, position + node.nodeSize, mark);
                    }
                    else {
                      transform = state.tr.removeMark(position, position + node.nodeSize, mark);
                    }
                  }
                });
              });
              if (transform) dispatch(transform);
            }
            // no longer used for deleting highlights
            else if ($cursor) {
                dispatch(state.tr.removeStoredMark(markType))
            } else {
                let has = false, tr = state.tr
                for (let i = 0; !has && i < ranges.length; i++) {
                    let {$from, $to} = ranges[i]
                    has = state.doc.rangeHasMark($from.pos, $to.pos, markType)
                }
                for (let i = 0; i < ranges.length; i++) {
                    let {$from, $to} = ranges[i]
                    if (has) tr.removeMark($from.pos, $to.pos, markType)
                }
                dispatch(tr.scrollIntoView())
            }
        }
        return true
    }
}

function canInsert(state, nodeType) {
    const $from = state.selection.$from;
    for (let d = $from.depth; d >= 0; d--) {
      const index = $from.index(d);
      if ($from.node(d).canReplaceWith(index, index, nodeType)) { return true }
    }
    return false
  }

export function replaceNodeWith (nodeType) {
    return function(state, dispatch) {
        if (canInsert(state, nodeType)) {
            dispatch(state.tr.replaceSelectionWith(nodeType.create()));
        }
        return true
    }
}