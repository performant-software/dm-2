import {TEXT_RESOURCE_TYPE, CANVAS_RESOURCE_TYPE, loadProject} from './project';
import {addLink, selectSidebarTarget, closeSidebarTarget, refreshTarget, closeDocumentTargets, refreshTargetByDocumentID, closeTarget} from './annotationViewer';
import {updateEditorState, selectHighlight, setHighlightSelectMode} from './textEditor';
import {deleteFolder} from './folders';
import {setAddTileSourceMode,  UPLOAD_SOURCE_TYPE} from './canvasEditor';

export const DEFAULT_LAYOUT = 'default';
export const TEXT_HIGHLIGHT_DELETE = 'TEXT_HIGHLIGHT_DELETE';
export const CANVAS_HIGHLIGHT_DELETE = 'CANVAS_HIGHLIGHT_DELETE';
export const DOCUMENT_DELETE = 'DOCUMENT_DELETE';
export const FOLDER_DELETE = 'FOLDER_DELETE';
export const OPEN_DOCUMENT = 'document_grid/OPEN_DOCUMENT';
export const OPEN_DOCUMENT_SUCCESS = 'document_grid/OPEN_DOCUMENT_SUCCESS';
export const OPEN_DOCUMENT_ERRORED = 'document_grid/OPEN_DOCUMENT_ERRORED';
export const CLOSE_DOCUMENT = 'document_grid/CLOSE_DOCUMENT';
export const REPLACE_DOCUMENT = 'document_grid/REPLACE_DOCUMENT';
export const CLEAR_RESOURCES = 'document_grid/CLEAR_RESOURCES';
export const ADD_HIGHLIGHT = 'document_grid/ADD_HIGHLIGHT';
export const ADD_HIGHLIGHT_SUCCESS = 'document_grid/ADD_HIGHLIGHT_SUCCESS';
export const ADD_HIGHLIGHT_ERRORED = 'document_grid/ADD_HIGHLIGHT_ERRORED';
export const DELETE_HIGHLIGHT = 'document_grid/DELETE_HIGHLIGHT';
export const DELETE_HIGHLIGHT_ERRORED = 'document_grid/DELETE_HIGHLIGHT_ERRORED';
export const DELETE_HIGHLIGHT_SUCCESS = 'document_grid/DELETE_HIGHLIGHT_SUCCESS';
export const UPDATE_HIGHLIGHT = 'document_grid/UPDATE_HIGHLIGHT';
export const UPDATE_HIGHLIGHT_ERRORED = 'document_grid/UPDATE_HIGHLIGHT_ERRORED';
export const UPDATE_HIGHLIGHT_SUCCESS = 'document_grid/UPDATE_HIGHLIGHT_SUCCESS';
export const DUPLICATE_HIGHLIGHTS = 'document_grid/DUPLICATE_HIGHLIGHTS';
export const DUPLICATE_HIGHLIGHTS_SUCCESS = 'document_grid/DUPLICATE_HIGHLIGHTS_SUCCESS';
export const DUPLICATE_HIGHLIGHTS_ERRORED = 'document_grid/DUPLICATE_HIGHLIGHTS_ERRORED';
export const MOVE_DOCUMENT = 'document_grid/MOVE_DOCUMENT';
export const MOVE_DOCUMENT_SUCCESS = 'document_grid/MOVE_DOCUMENT_SUCCESS';
export const MOVE_DOCUMENT_ERRORED = 'document_grid/MOVE_DOCUMENT_ERRORED';
export const UPDATE_DOCUMENT = 'document_grid/UPDATE_CONTENT';
export const PATCH_SUCCESS = 'document_grid/PATCH_SUCCESS';
export const PATCH_ERRORED = 'document_grid/PATCH_ERRORED';
export const NEW_DOCUMENT = 'document_grid/NEW_DOCUMENT';
export const POST_SUCCESS = 'document_grid/POST_SUCCESS';
export const POST_ERRORED = 'document_grid/POST_ERRORED';
export const DELETE_DOCUMENT = 'document_grid/DELETE_DOCUMENT';
export const DELETE_SUCCESS = 'document_grid/DELETE_SUCCESS';
export const DELETE_ERRORED = 'document_grid/DELETE_ERRORED';
export const OPEN_DELETE_DIALOG = 'document_grid/OPEN_DELETE_DIALOG';
export const CLOSE_DELETE_DIALOG = 'document_grid/CLOSE_DELETE_DIALOG';
export const ADD_IMAGE_TO_DOCUMENT = 'document_grid/ADD_IMAGE_TO_DOCUMENT';
export const ADD_IMAGE_SUCCESS = 'document_grid/ADD_IMAGE_SUCCESS';
export const ADD_IMAGE_ERRORED = 'document_grid/ADD_IMAGE_ERRORED';
export const SET_CURRENT_LAYOUT = 'document_grid/SET_CURRENT_LAYOUT';
export const MOVE_DOCUMENT_WINDOW = 'document_grid/MOVE_DOCUMENT_WINDOW';


export const layoutOptions = [
  { rows: 1, cols: 1, description: '1 x 1' },
  { rows: 1, cols: 2, description: '1 x 2' },
  { rows: 2, cols: 2, description: '2 x 2' },
  { rows: 3, cols: 3, description: '3 x 3' }
];

export const MAX_EXCERPT_LENGTH = 80;

const initialState = {
  layout: DEFAULT_LAYOUT,
  openDocuments: [],
  loading: false,
  errored: false,
  deleteDialogOpen: false,
  deleteDialogTitle: 'Confirm Delete',
  deleteDialogBody: 'Are you sure you want to delete this item?',
  deleteDialogSubmit: 'Delete',
  deleteDialogPayload: null,
  deleteDialogKind: null,
  currentLayout: 2
};

export default function(state = initialState, action) {
  switch (action.type) {
    case OPEN_DOCUMENT:
    case ADD_HIGHLIGHT:
    case DELETE_HIGHLIGHT:
    case UPDATE_HIGHLIGHT:
    case DUPLICATE_HIGHLIGHTS:
    case UPDATE_DOCUMENT:
    case NEW_DOCUMENT:
    case DELETE_DOCUMENT:
    case MOVE_DOCUMENT:
      return {
        ...state,
        loading: true
      }

    case OPEN_DOCUMENT_SUCCESS:
    case POST_SUCCESS:
      let openDocumentsCopy = state.openDocuments.slice(0);
      state.openDocuments.forEach((document, index) => {
        if (+document.id === +action.document.id)
          openDocumentsCopy.splice(index, 1, Object.assign({timeOpened: document.timeOpened}, action.document));
      });
      let positionToSplice = action.documentPosition;
      openDocumentsCopy.splice(positionToSplice, 0, Object.assign({timeOpened: Date.now(), firstTarget: action.firstTarget }, action.document));
      return {
        ...state,
        openDocuments: openDocumentsCopy,
        loading: false
      }

    case OPEN_DOCUMENT_ERRORED:
    case PATCH_ERRORED:
    case POST_ERRORED:
    case DELETE_ERRORED:
    case DELETE_HIGHLIGHT_ERRORED:
    case UPDATE_HIGHLIGHT_ERRORED:
    case DUPLICATE_HIGHLIGHTS_ERRORED:
      console.log('document/highlight error!');
      return {
        ...state,
        loading: false,
        errored: true
      }

    case PATCH_SUCCESS:
    case REPLACE_DOCUMENT:
      let preReplaceDocumentsCopy = state.openDocuments.slice(0);
      state.openDocuments.forEach((document, index) => {
        if (+document.id === +action.document.id) {
          const { timeOpened } = document;
          preReplaceDocumentsCopy.splice(index, 1, Object.assign({timeOpened}, action.document));
        }
      });
      return {
        ...state,
        loading: false,
        openDocuments: preReplaceDocumentsCopy
      };

    case CLOSE_DOCUMENT:
      let preCloseDocumentsCopy = state.openDocuments.slice(0);
      let toCloseIndex = state.openDocuments.findIndex(resource => resource.id.toString() === action.documentId.toString());
      if (toCloseIndex >= 0) {
        preCloseDocumentsCopy.splice(toCloseIndex, 1);
      }
      return {
        ...state,
        openDocuments: preCloseDocumentsCopy
      };

    case DELETE_SUCCESS:
      const targetID = action.documentId.toString();
      const openDocuments = state.openDocuments.filter( openDocument => ( openDocument.id.toString() !== targetID ) )
      return {
        ...state,
        openDocuments
      };

    case CLEAR_RESOURCES:
      return {
        ...state,
        openDocuments: []
      };

    case ADD_HIGHLIGHT_SUCCESS:
      let resourceIndex = state.openDocuments.findIndex(resource => resource.id === action.document_id);
      let updatedopenDocuments = state.openDocuments.slice(0);
      if (resourceIndex >= 0) {
        let updatedResource = Object.assign(updatedopenDocuments[resourceIndex], {});
        updatedResource.highlight_map[action.highlight_id] = {
          id: action.id,
          target: action.highlightTarget,
          color: action.color,
          excerpt: action.excerpt,
          links: []
        };
        updatedopenDocuments.splice(resourceIndex, 1, updatedResource);
      }
      return {
        ...state,
        openDocuments: updatedopenDocuments,
        loading: false
      }

    case DUPLICATE_HIGHLIGHTS_SUCCESS:
      let duplicatesUpdatedOpenDocuments = state.openDocuments.slice(0);
      action.highlights.forEach(highlight => {
        let resourceIndex = state.openDocuments.findIndex(resource => resource.id === action.document_id);
        if (resourceIndex >= 0) {
          let updatedResource = Object.assign(duplicatesUpdatedOpenDocuments[resourceIndex], {});
          updatedResource.highlight_map[highlight.uid] = {
            id: highlight.id,
            target: highlight.target,
            color: highlight.color,
            excerpt: highlight.excerpt,
            links: highlight.links
          };
          duplicatesUpdatedOpenDocuments.splice(resourceIndex, 1, updatedResource);
        }
      });
      return {
        ...state,
        openDocuments: duplicatesUpdatedOpenDocuments
      }

    case UPDATE_HIGHLIGHT_SUCCESS:
      let hResourceIndex = state.openDocuments.findIndex(resource => resource.id === action.document_id);
      let hUpdatedOpenDocuments = state.openDocuments.slice(0);
      if (hResourceIndex >= 0) {
        let hUpdatedResource = Object.assign(hUpdatedOpenDocuments[hResourceIndex], {});
        if (hUpdatedResource.highlight_map[action.highlight_id])
          hUpdatedResource.highlight_map[action.highlight_id].color = action.color;
        hUpdatedOpenDocuments.splice(hResourceIndex, 1, hUpdatedResource);
      }
      return {
        ...state,
        openDocuments: hUpdatedOpenDocuments,
        loading: false
      }

    case DELETE_HIGHLIGHT_SUCCESS:
      return {
        ...state,
        loading: false
      }

    case OPEN_DELETE_DIALOG:
      return {
        ...state,
        deleteDialogOpen: true,
        deleteDialogTitle: action.title,
        deleteDialogBody: action.body,
        deleteDialogSubmit: action.submit,
        deleteDialogPayload: action.payload,
        deleteDialogKind: action.kind
      };

    case CLOSE_DELETE_DIALOG:
      return {
        ...state,
        deleteDialogOpen: false,
        deleteDialogTitle: initialState.deleteDialogTitle,
        deleteDialogBody: initialState.deleteDialogBody,
        deleteDialogSubmit: initialState.deleteDialogSubmit,
        deleteDialogPayload: initialState.deleteDialogPayload,
        deleteDialogKind: initialState.deleteDialogKind
      };

    case SET_CURRENT_LAYOUT:
      return {
        ...state,
        currentLayout: action.index
      };

    case MOVE_DOCUMENT_WINDOW:
      let draggedDocument = state.openDocuments[action.dragIndex];
      let openDocumentsMoveCopy = state.openDocuments.slice(0);
      openDocumentsMoveCopy.splice(action.dragIndex, 1);
      openDocumentsMoveCopy.splice(action.moveIndex, 0, draggedDocument);
      return {
        ...state,
        openDocuments: openDocumentsMoveCopy
      };

    default:
      return state;
  }
}

export function openDocument(documentId, firstTarget) {
  return function(dispatch, getState) {
    const documentPosition = getState().documentGrid.openDocuments.length;
    dispatch({
      type: OPEN_DOCUMENT
    });

    fetch(`/documents/${documentId}`, {
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      }
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(document => {
      return document;
    })
    .then(document => dispatch({
      type: OPEN_DOCUMENT_SUCCESS,
      document,
      firstTarget,
      documentPosition
    }))
    .catch(() => dispatch({
      type: OPEN_DOCUMENT_ERRORED
    }));
  };
}

export function closeAllResources() {
  return function(dispatch) {
    dispatch({
      type: CLEAR_RESOURCES
    });
  };
}

export function addHighlight(document_id, highlight_id, highlightTarget, color, excerpt, callback) {
  return function(dispatch) {
    dispatch({
      type: ADD_HIGHLIGHT
    });

    fetch('/highlights', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      },
      method: 'POST',
      body: JSON.stringify({
        document_id: document_id,
        uid: highlight_id,
        target: highlightTarget,
        color: color,
        excerpt: excerpt
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(savedHighlight => {
      dispatch({
        type: ADD_HIGHLIGHT_SUCCESS,
        document_id,
        highlight_id,
        highlightTarget,
        color,
        excerpt,
        id: savedHighlight.id
      });
      return savedHighlight
    })
    .then(savedHighlight => {
      if (callback) {
        callback(savedHighlight);
      }
    })
    .catch(() => dispatch({
      type: ADD_HIGHLIGHT_ERRORED
    }));
  }
}

export function deleteHighlights(highlights = []) {
  return function(dispatch, getState) {
    highlights.forEach(highlight => {
      if (highlight && highlight.id) {
        fetch(`/highlights/${highlight.id}`, {
          headers: {
            'access-token': localStorage.getItem('access-token'),
            'token-type': localStorage.getItem('token-type'),
            'client': localStorage.getItem('client'),
            'expiry': localStorage.getItem('expiry'),
            'uid': localStorage.getItem('uid')
          },
          method: 'DELETE'
        })
        .then(response => {
          if (!response.ok) {
            throw Error(response.statusText);
          }
        })
        .then(() => {
          dispatch({
            type: DELETE_HIGHLIGHT_SUCCESS,
            uid: highlight.uid,
            document_id: highlight.document_id
          });
          const sidebarTarget = getState().annotationViewer.sidebarTarget;
          if (sidebarTarget && (+sidebarTarget.document_id === +highlight.document_id && +sidebarTarget.highlight_id === +highlight.id)) {
            dispatch(closeSidebarTarget());
          }
          else if (sidebarTarget && sidebarTarget.links_to.reduce((matched, link) => matched || (+link.document_id === +highlight.document_id && +link.highlight_id === +highlight.id), false)) {
            dispatch(selectSidebarTarget(sidebarTarget));
          }
          getState().annotationViewer.selectedTargets.forEach((target, index) => {
            if (+target.document_id === +highlight.document_id && +target.highlight_id === +highlight.id) {
              dispatch(closeTarget(highlight.document_id, highlight.id));
            }
            else if(target.links_to.reduce((matched, link) => matched || (+link.document_id === +highlight.document_id && +link.highlight_id === +highlight.id), false)) {
              dispatch(refreshTarget(index));
            }
          });
        })
        .catch(() => dispatch({
          type: DELETE_HIGHLIGHT_ERRORED
        }));
      }
    });
  }
}

export function updateHighlight(id, attributes) {
  return function(dispatch, getState) {
    dispatch({
      type: UPDATE_HIGHLIGHT
    });

    return fetch(`/highlights/${id}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      },
      method: 'PATCH',
      body: JSON.stringify(attributes)
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(highlight => {
      dispatch({
        type: UPDATE_HIGHLIGHT_SUCCESS,
        color: highlight.color,
        highlight_id: highlight.uid,
        document_id: highlight.document_id
      });
      const sidebarTarget = getState().annotationViewer.sidebarTarget;
      if (sidebarTarget && ((+sidebarTarget.document_id === +highlight.document_id && +sidebarTarget.highlight_id === +highlight.id) || sidebarTarget.links_to.reduce((matched, link) => matched || (+link.document_id === +highlight.document_id && +link.highlight_id === +highlight.id), false))) {
        dispatch(selectSidebarTarget(sidebarTarget));
      }
      getState().annotationViewer.selectedTargets.forEach((target, index) => {
        if ((+target.document_id === +highlight.document_id && +target.highlight_id === +highlight.id) || target.links_to.reduce((matched, link) => matched || (+link.document_id === +highlight.document_id && +link.highlight_id === +highlight.id), false)) {
          dispatch(refreshTarget(index));
        }
      });
    })
    .catch(() => dispatch({
      type: UPDATE_HIGHLIGHT_ERRORED
    }));
  }
}

export function duplicateHighlights(highlights, document_id) {
  return function(dispatch) {
    dispatch({
      type: DUPLICATE_HIGHLIGHTS
    });

    fetch('/highlights/duplicate', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      },
      method: 'POST',
      body: JSON.stringify({
        highlights,
        document_id
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(newHighlights => {
      dispatch({
        type: DUPLICATE_HIGHLIGHTS_SUCCESS,
        highlights: newHighlights,
        document_id
      });
    })
    .catch(() => dispatch({
      type: DUPLICATE_HIGHLIGHTS_ERRORED
    }));
  }
}


export function createTextDocument(parentId, parentType, callback) {
  return function(dispatch, getState) {
    dispatch({
      type: NEW_DOCUMENT
    });

    fetch('/documents', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      },
      method: 'POST',
      body: JSON.stringify({
        title: 'Untitled Document',
        project_id: getState().project.id,
        document_kind: TEXT_RESOURCE_TYPE,
        content: {type: 'doc', content: [{"type":"paragraph","content":[]}]},
        parent_id: parentId,
        parent_type: parentType
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(document => {
      dispatch({
        type: POST_SUCCESS,
        document,
        documentPosition: getState().documentGrid.openDocuments.length
      });
      if (parentType === 'Project') // refresh project if document has been added to its table of contents
        dispatch(loadProject(getState().project.id));
      return document;
    })
    .then(document => {
      if (callback) {
        callback(document);
      }
    })
    .catch(() => dispatch({
      type: POST_ERRORED
    }));
  }
}

export function createTextDocumentWithLink(origin, parentId = null, parentType = null) {
  return function(dispatch) {
    dispatch(createTextDocument(parentId, parentType, document => {
      dispatch(addLink(origin, {
        linkable_id: document.id,
        linkable_type: 'Document'
      }));
    }));
  }
}

export function moveDocument(documentId, destination_id, position ) {
  return function(dispatch, getState) {
    dispatch({
      type: MOVE_DOCUMENT
    });

    return fetch(`/documents/${documentId}/move`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      },
      method: 'PATCH',
      body: JSON.stringify({
        document: {
          destination_id,
          position
        }
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(() => {
      dispatch({
        type: MOVE_DOCUMENT_SUCCESS
      });
    })
    .catch(() => dispatch({
      type: MOVE_DOCUMENT_ERRORED
    }));
  }
}

export function updateDocument(documentId, attributes, options) {
  return function(dispatch, getState) {
    dispatch({
      type: UPDATE_DOCUMENT
    });

    // patch via the lock method if we're adjusting the state of the lock
    const url = ( options && options.adjustLock ) ? `/documents/${documentId}/lock` : `/documents/${documentId}`;

    return fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      },
      method: 'PATCH',
      body: JSON.stringify(attributes)
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(document => {
      dispatch({
        type: PATCH_SUCCESS,
        document
      });
      if (options && options.adjustLock && attributes.locked === false) {
        dispatch(selectHighlight(documentId, null));
        dispatch(setHighlightSelectMode(documentId, false));
      }
      if (options && options.refreshLists) {
        if (getState().project.contentsChildren.map(child => child.document_id).includes(documentId)) {
          dispatch(loadProject(getState().project.id));
        }
        const sidebarTarget = getState().annotationViewer.sidebarTarget;
        if (sidebarTarget && (sidebarTarget.document_id === documentId || sidebarTarget.links_to.map(link => link.document_id).includes(documentId))) {
          dispatch(selectSidebarTarget(sidebarTarget));
        }
        getState().annotationViewer.selectedTargets.forEach((target, index) => {
          if (target.document_id === documentId || target.links_to.map(link => link.document_id).includes(documentId)) {
            dispatch(refreshTarget(index));
          }
        });
      }
    })
    .catch(() => dispatch({
      type: PATCH_ERRORED
    }));
  }
}

export function setDocumentThumbnail(documentId, image_url) {
  return function(dispatch, getState) {
    dispatch({
      type: UPDATE_DOCUMENT
    });

    fetch(`/documents/${documentId}/set_thumbnail`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      },
      method: 'POST',
      body: JSON.stringify({
        image_url
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(document => {
      dispatch({
        type: PATCH_SUCCESS,
        document
      });
      if (getState().project.contentsChildren.map(child => child.document_id).includes(documentId)) {
        dispatch(loadProject(getState().project.id));
      }
      const sidebarTarget = getState().annotationViewer.sidebarTarget;
      if (sidebarTarget && (sidebarTarget.document_id === documentId || sidebarTarget.links_to.map(link => link.document_id).includes(documentId))) {
        dispatch(selectSidebarTarget(sidebarTarget));
      }
      getState().annotationViewer.selectedTargets.forEach((target, index) => {
        if (target.document_id === documentId || target.links_to.map(link => link.document_id).includes(documentId)) {
          dispatch(refreshTarget(index));
        }
      });
    })
    .catch(() => dispatch({
      type: PATCH_ERRORED
    }));
  }
}

export function setHighlightThumbnail(highlightId, image_url, coords, svg_string) {
  return function(dispatch, getState) {
    dispatch({
      type: UPDATE_HIGHLIGHT
    });

    fetch(`/highlights/${highlightId}/set_thumbnail`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      },
      method: 'POST',
      body: JSON.stringify({
        image_url,
        coords,
        svg_string
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(highlight => {
      dispatch({
        type: UPDATE_HIGHLIGHT_SUCCESS
      });
      const sidebarTarget = getState().annotationViewer.sidebarTarget;
      if (sidebarTarget && ((+sidebarTarget.document_id === +highlight.document_id && +sidebarTarget.highlight_id === +highlight.id) || sidebarTarget.links_to.reduce((matched, link) => matched || (+link.document_id === +highlight.document_id && +link.highlight_id === +highlight.id), false))) {
        dispatch(selectSidebarTarget(sidebarTarget));
      }
      getState().annotationViewer.selectedTargets.forEach((target, index) => {
        if ((+target.document_id === +highlight.document_id && +target.highlight_id === +highlight.id) || target.links_to.reduce((matched, link) => matched || (+link.document_id === +highlight.document_id && +link.highlight_id === +highlight.id), false)) {
          dispatch(refreshTarget(index));
        }
      });
    })
    .catch(() => dispatch({
      type: UPDATE_HIGHLIGHT_ERRORED
    }));
  }
}

export function createCanvasDocument(parentId, parentType, callback) {
  return function(dispatch, getState) {
    dispatch({
      type: NEW_DOCUMENT
    });

    fetch('/documents', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      },
      method: 'POST',
      body: JSON.stringify({
        title: 'Untitled Image',
        project_id: getState().project.id,
        document_kind: CANVAS_RESOURCE_TYPE,
        content: { tileSources: [] },
        parent_id: parentId,
        parent_type: parentType
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(document => {
      dispatch({
        type: POST_SUCCESS,
        document,
        documentPosition: getState().documentGrid.openDocuments.length
      });
      dispatch(setAddTileSourceMode(document.id, UPLOAD_SOURCE_TYPE));
      if (parentType === 'Project') // refresh project if document has been added to its table of contents
        dispatch(loadProject(getState().project.id));
      return document;
    })
    .then(document => {
      if (callback) {
        callback(document);
      }
    })
    .catch(() => dispatch({
      type: POST_ERRORED
    }));
  }
}

export function closeDocument(documentId) {
  return function(dispatch) {
    dispatch({
      type: CLOSE_DOCUMENT,
      documentId
    });
  };
}

export function replaceDocument(document) {
  return function(dispatch) {
    dispatch({
      type: REPLACE_DOCUMENT,
      document
    });
  };
}

export function deleteDocument(documentId) {
  return function(dispatch, getState) {
    dispatch({
      type: DELETE_DOCUMENT
    });

    fetch(`/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      }
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
    })
    .then(() => {
      dispatch({
        type: DELETE_SUCCESS,
        documentId
      });
      dispatch(closeDocumentTargets(documentId));
      dispatch(refreshTargetByDocumentID(documentId));
      dispatch(loadProject(getState().project.id));
    })
    .catch(() => dispatch({
      type: DELETE_ERRORED
    }));
  };
}

export function openDeleteDialog(title, body, submit, payload, kind) {
  return function(dispatch) {
    dispatch({
      type: OPEN_DELETE_DIALOG,
      title,
      body,
      submit,
      payload,
      kind
    });
  }
}

export function closeDeleteDialog() {
  return function(dispatch) {
    dispatch({
      type: CLOSE_DELETE_DIALOG
    });
  }
}

// close any documents found in these folders
export function closeDocumentFolders( folders ) {
  return function(dispatch, getState) {
    const openDocuments = getState().documentGrid.openDocuments
    openDocuments.forEach( (document) => {
      const found = folders.find( folderID => folderID === document.parent_id )
      if( found ) {
        dispatch(closeDocumentTargets(document.id));
        dispatch(closeDocument(document.id));
        dispatch(refreshTargetByDocumentID(document.id));
      }
    })
  }
}

export function confirmDeleteDialog() {
  return function(dispatch, getState) {
    const payload = getState().documentGrid.deleteDialogPayload;
    switch (getState().documentGrid.deleteDialogKind) {
      case TEXT_HIGHLIGHT_DELETE:
        const { editorStates } = getState().textEditor;
        if (payload.transaction && payload.document_id) {
          const newState = editorStates[payload.document_id].apply(payload.transaction);
          dispatch(updateEditorState(payload.document_id, newState));
          dispatch(updateDocument(payload.document_id, {content: {type: 'doc', content: payload.transaction.doc.content}}));
          dispatch(deleteHighlights(payload.highlights));
          if (payload.highlightsToDuplicate.length > 0) dispatch(duplicateHighlights(payload.highlightsToDuplicate, payload.document_id));
          payload.alteredHighlights.forEach(highlight => {
            dispatch(updateHighlight(highlight.id, {excerpt: highlight.excerpt}));
          });
          dispatch(selectHighlight(payload.document_id, null));
        }
        dispatch(closeDeleteDialog());
        break;

      case CANVAS_HIGHLIGHT_DELETE:
        dispatch(deleteHighlights(payload.highlights));
        if (payload.canvas) {
          payload.fabricObjects.forEach(object => {
            payload.canvas.remove(object);
          });
        }
        dispatch(closeDeleteDialog());
        break;

      case DOCUMENT_DELETE:
        dispatch(deleteDocument(payload.documentId));
        dispatch(closeDeleteDialog());
        break;

      case FOLDER_DELETE:
        // TODO close any document windows that are children of this folder and any target windows related to those documents
        dispatch(deleteFolder(payload.folderId, payload.parentType, payload.parentId));
        dispatch(closeDeleteDialog());
        break;

      default:
        dispatch(closeDeleteDialog());
    }
  }
}

export function setCurrentLayout(event, index) {
  return function(dispatch) {
    dispatch({
      type: SET_CURRENT_LAYOUT,
      index
    });
  };
}

export function moveDocumentWindow(dragIndex, moveIndex) {
  return function(dispatch) {
    dispatch({
      type: MOVE_DOCUMENT_WINDOW,
      dragIndex,
      moveIndex
    });
  };
}
