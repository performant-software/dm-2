import {TEXT_RESOURCE_TYPE, CANVAS_RESOURCE_TYPE, loadProject} from './project';

export const DEFAULT_LAYOUT = 'default';
export const OPEN_DOCUMENT = 'document_grid/OPEN_DOCUMENT';
export const OPEN_DOCUMENT_SUCCESS = 'document_grid/OPEN_DOCUMENT_SUCCESS';
export const OPEN_DOCUMENT_ERRORED = 'document_grid/OPEN_DOCUMENT_ERRORED';
export const OPEN_DUMMY_RESOURCES = 'document_grid/OPEN_DUMMY_RESOURCES';
export const CLOSE_DOCUMENT = 'document_grid/CLOSE_DOCUMENT';
export const CLEAR_RESOURCES = 'document_grid/CLEAR_RESOURCES';
export const ADD_HIGHLIGHT = 'document_grid/ADD_HIGHLIGHT';
export const ADD_HIGHLIGHT_SUCCESS = 'document_grid/ADD_HIGHLIGHT_SUCCESS';
export const ADD_HIGHLIGHT_ERRORED = 'document_grid/ADD_HIGHLIGHT_ERRORED';
export const UPDATE_DOCUMENT = 'document_grid/UPDATE_CONTENT';
export const PATCH_SUCCESS = 'document_grid/PATCH_SUCCESS';
export const PATCH_ERRORED = 'document_grid/PATCH_ERRORED';
export const NEW_DOCUMENT = 'document_grid/NEW_DOCUMENT';
export const POST_SUCCESS = 'document_grid/POST_SUCCESS';
export const POST_ERRORED = 'document_grid/POST_ERRORED';
export const DELETE_DOCUMENT = 'document_grid/DELETE_DOCUMENT';
export const DELETE_SUCCESS = 'document_grid/DELETE_SUCCESS';
export const DELETE_ERRORED = 'document_grid/DELETE_ERRORED';

const initialState = {
  layout: DEFAULT_LAYOUT,
  openDocuments: [],
  loading: false,
  errored: false
};

export default function(state = initialState, action) {
  switch (action.type) {
    case OPEN_DUMMY_RESOURCES:
      return {
        ...state,
        openDocuments: [
          {
            id: 'dm_resource_1',
            title: 'A Text Resource in the Store',
            document_kind: TEXT_RESOURCE_TYPE,
            content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"One."}]},{"type":"horizontal_rule"},{"type":"paragraph","content":[{"type":"text","text":"Two! Here is some longer text, et cetera et "},{"type":"text","marks":[{"type":"highlight","attrs":{"highlightId":"dm_text_highlight_1522476560480"}}],"text":"cetera"}]},{"type":"paragraph","content":[{"type":"text","text":"Third "},{"type":"text","marks":[{"type":"highlight","attrs":{"highlightId":"dm_text_highlight_1522476566058"}}],"text":"paragraph"},{"type":"text","text":" hello hello hello"}]}]},
            highlight_map: {
              'dm_text_highlight_1522476560480': {
                target: 'dm_text_highlight_1522476560480',
                excerpt: 'cetera',
                color: '#FFEB3B',
                links: [
                  {
                    resourceId: 'dm_resource_4',
                    document_kind: 'text',
                    highlightId: 'dm_text_highlight_1522476879313',
                    documentTitle: 'One Last Redux Text Resource',
                    excerpt: 'Third'
                  }
                ]
              },
              'dm_text_highlight_1522476566058': {
                target: 'dm_text_highlight_1522476566058',
                excerpt: 'paragraph',
                color: '#F44336',
                links: []
              }
            }
          },
          {
            id: 'dm_resource_2',
            title: 'A Canvas Resource in the Store',
            document_kind: CANVAS_RESOURCE_TYPE,
            content: {"Image":{"xmlns":"http://schemas.microsoft.com/deepzoom/2008","Url":"http://openseadragon.github.io/example-images/highsmith/highsmith_files/","Format":"jpg","Overlap":"2","TileSize":"256","Size":{"Height":"9221","Width":"7026"}}},
            highlight_map: {
              'dm_canvas_highlight_1523143914946': {
                target: '{"type":"rect","originX":"left","originY":"top","left":850,"top":1000,"width":300,"height":300,"fill":"transparent","stroke":"#2196F3","strokeWidth":5,"strokeDashArray":null,"strokeLineCap":"butt","strokeLineJoin":"miter","strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"clipTo":null,"backgroundColor":"","fillRule":"nonzero","globalCompositeOperation":"source-over","transformMatrix":null,"skewX":0,"skewY":0,"rx":0,"ry":0}',
                color: '#2196F3',
                thumbnailUrl: '/DummyCanvasThumbnail.png',
                links: []
              }
            }
          },
          {
            id: 'dm_resource_3',
            title: 'Another Canvas Resource from Redux',
            document_kind: CANVAS_RESOURCE_TYPE,
            content: {"Image":{"xmlns":"http://schemas.microsoft.com/deepzoom/2008","Url":"http://openseadragon.github.io/example-images/highsmith/highsmith_files/","Format":"jpg","Overlap":"2","TileSize":"256","Size":{"Height":"9221","Width":"7026"}}},
            highlight_map: {}
          },
          {
            id: 'dm_resource_4',
            title: 'One Last Redux Text Resource',
            document_kind: TEXT_RESOURCE_TYPE,
            content: {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Text! Here is some longer text, et cetera et cetera"}]},{"type":"paragraph","content":[{"type":"text","marks":[{"type":"highlight","attrs":{"highlightId":"dm_text_highlight_1522476879313"}}],"text":"Third"},{"type":"text","text":" paragraph hello hello hello"}]}]},
            highlight_map: {
              'dm_text_highlight_1522476879313': {
                target: 'dm_text_highlight_1522476879313',
                excerpt: 'Third',
                color: '#FFEB3B',
                links: [
                  {
                    resourceId: 'dm_resource_1',
                    document_kind: 'text',
                    highlightId: 'dm_text_highlight_1522476560480',
                    documentTitle: 'A Text Resource in the Store',
                    excerpt: 'cetera'
                  }
                ]
              }
            }
          }
        ]
      };

    case OPEN_DOCUMENT:
    case ADD_HIGHLIGHT:
    case UPDATE_DOCUMENT:
    case NEW_DOCUMENT:
    case DELETE_DOCUMENT:
      return {
        ...state,
        loading: true
      }

    case OPEN_DOCUMENT_SUCCESS:
    case POST_SUCCESS:
      let openDocumentsCopy = state.openDocuments.slice(0);
      let documentPresentIndex = state.openDocuments.findIndex(resource => resource.id.toString() === action.document.id.toString());
      if (documentPresentIndex !== action.documentPosition) {
        if (documentPresentIndex >= 0) {
          openDocumentsCopy.splice(documentPresentIndex, 1);
        }
        openDocumentsCopy.splice(action.documentPosition, 0, action.document);
      }
      return {
        ...state,
        openDocuments: openDocumentsCopy,
        loading: false
      }

    case OPEN_DOCUMENT_ERRORED:
    case PATCH_ERRORED:
    case POST_ERRORED:
    case DELETE_ERRORED:
      return {
        ...state,
        loading: false,
        errored: true
      }

    case CLOSE_DOCUMENT:
    case DELETE_SUCCESS:
      let preCloseDocumentsCopy = state.openDocuments.slice(0);
      let toCloseIndex = state.openDocuments.findIndex(resource => resource.id.toString() === action.documentId.toString());
      if (toCloseIndex >= 0) {
        preCloseDocumentsCopy.splice(toCloseIndex, 1);
      }
      return {
        ...state,
        openDocuments: preCloseDocumentsCopy
      };

    case CLEAR_RESOURCES:
      return {
        ...state,
        openDocuments: []
      };

    case ADD_HIGHLIGHT_SUCCESS:
      let resourceIndex = state.openDocuments.findIndex(resource => resource.id === action.resourceId);
      let updatedopenDocuments = state.openDocuments.slice(0);
      if (resourceIndex >= 0) {
        let updatedResource = Object.assign(updatedopenDocuments[resourceIndex], {});
        updatedResource.highlight_map[action.highlightId] = {
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
        openDocuments: updatedopenDocuments
      }

    default:
      return state;
  }
}

export function openDocument(documentId, documentPosition) {
  return function(dispatch) {
    dispatch({
      type: OPEN_DOCUMENT
    });

    fetch(`/documents/${documentId}`)
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
      documentPosition
    }))
    .catch(() => dispatch({
      type: OPEN_DOCUMENT_ERRORED
    }));
  };
}

export function openDummyResources() {
  return function(dispatch) {
    dispatch({
      type: OPEN_DUMMY_RESOURCES
    });
  }
}

export function closeAllResources() {
  return function(dispatch) {
    dispatch({
      type: CLEAR_RESOURCES
    });
  }
}

export function addHighlight(resourceId, highlightId, highlightTarget, color, excerpt) {
  return function(dispatch) {
    dispatch({
      type: ADD_HIGHLIGHT
    });

    fetch('/highlights', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        document_id: resourceId,
        uid: highlightId,
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
    .then(savedHighlight => dispatch({
      type: ADD_HIGHLIGHT_SUCCESS,
      resourceId,
      highlightId,
      highlightTarget,
      color,
      excerpt,
      id: savedHighlight.id
    }))
    .catch(() => dispatch({
      type: ADD_HIGHLIGHT_ERRORED
    }));
  }
}

export function createTextDocument(parentId, parentType) {
  return function(dispatch, getState) {
    dispatch({
      type: NEW_DOCUMENT
    });

    fetch('/documents', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
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
        documentPosition: 0
      });
      if (parentType === 'Project') // refresh project if document has been added to its table of contents
        dispatch(loadProject(getState().project.id));
    })
    .catch(() => dispatch({
      type: POST_ERRORED
    }));
  }
}

export function updateDocument(documentId, attributes, options) {
  return function(dispatch, getState) {
    dispatch({
      type: UPDATE_DOCUMENT
    });

    fetch(`/documents/${documentId}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'PATCH',
      body: JSON.stringify(attributes)
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
    })
    .then(() => {
      dispatch({
        type: PATCH_SUCCESS
      });
      if (options.refreshProject)
        dispatch(loadProject(getState().project.id));
    })
    .catch(() => dispatch({
      type: PATCH_ERRORED
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

export function deleteDocument(documentId) {
  return function(dispatch, getState) {
    dispatch({
      type: DELETE_DOCUMENT
    });

    fetch(`/documents/${documentId}`, {
      method: 'DELETE'
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
      dispatch(loadProject(getState().project.id));
    })
    .catch(() => dispatch({
      type: DELETE_ERRORED
    }));
  };
}
