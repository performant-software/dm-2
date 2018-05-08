export const OPEN_DOCUMENT_POPOVER = 'tableOfContents/OPEN_DOCUMENT_POPOVER';
export const CLOSE_DOCUMENT_POPOVER = 'tableOfContents/CLOSE_DOCUMENT_POPOVER';

const initialState = {
  documentPopoverOpen: false
};

export default function(state = initialState, action) {
  switch (action.type) {
    case OPEN_DOCUMENT_POPOVER:
      return {
        ...state,
        documentPopoverOpen: true
      };

    case CLOSE_DOCUMENT_POPOVER:
      return {
        ...state,
        documentPopoverOpen: false
      };

    default:
      return state;
  }
}

export function openDocumentPopover() {
  return function(dispatch) {
    dispatch({
      type: OPEN_DOCUMENT_POPOVER
    });
  }
}

export function closeDocumentPopover() {
  return function(dispatch) {
    dispatch({
      type:CLOSE_DOCUMENT_POPOVER
    });
  }
}
