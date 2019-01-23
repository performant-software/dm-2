import { loadProject } from './project';
import { closeDocumentFolders } from './documentGrid'

export const NEW_FOLDER = 'folders/NEW_FOLDER';
export const POST_SUCCESS = 'folders/POST_SUCCESS';
export const POST_ERRORED = 'folders/POST_ERRORED';
export const FOLDER_OPENED = 'folders/FOLDER_OPENED';
export const OPEN_SUCCESS = 'folders/OPEN_SUCCESS';
export const OPEN_ERRORED = 'folders/OPEN_ERRORED';
export const FOLDER_CLOSED = 'folders/FOLDER_CLOSED';
export const UPDATE_FOLDER = 'folders/UPDATE_FOLDER';
export const PATCH_SUCCESS = 'folders/PATCH_SUCCESS';
export const PATCH_ERRORED = 'folders/PATCH_ERRORED';
export const DELETE_FOLDER = 'folders/DELETE_DOCUMENT';
export const DELETE_SUCCESS = 'folders/DELETE_SUCCESS';
export const DELETE_ERRORED = 'folders/DELETE_ERRORED';
export const MOVE_FOLDER = 'folders/MOVE_FOLDER';
export const MOVE_FOLDER_SUCCESS = 'folders/MOVE_FOLDER_SUCCESS';
export const MOVE_FOLDER_ERRORED = 'folders/MOVE_FOLDER_ERRORED';

const initialState = {
  openFolderContents: {}
};

export default function(state = initialState, action) {
  switch (action.type) {
    case FOLDER_OPENED:
    case MOVE_FOLDER:
    case DELETE_FOLDER:
      let loadingOpenFolderContents = Object.assign({}, state.openFolderContents);
      loadingOpenFolderContents[action.id] = 'loading';
      return {
        ...state,
        openFolderContents: loadingOpenFolderContents
      };

    case OPEN_SUCCESS:
    case MOVE_FOLDER_SUCCESS:
      let successOpenFolderContents = Object.assign({}, state.openFolderContents);
      successOpenFolderContents[action.id] = action.contentsChildren;
      return {
        ...state,
        openFolderContents: successOpenFolderContents
      };

    case OPEN_ERRORED:
    case MOVE_FOLDER_ERRORED:
    case DELETE_ERRORED:
      let erroredOpenFolderContents = Object.assign({}, state.openFolderContents);
      erroredOpenFolderContents[action.id] = 'errored'
      return {
        ...state,
        openFolderContents: erroredOpenFolderContents
      };

    case FOLDER_CLOSED:
    case DELETE_SUCCESS:
      let closeOpenFolderContents = Object.assign({}, state.openFolderContents);
      closeOpenFolderContents[action.id] = null;
      return {
        ...state,
        openFolderContents: closeOpenFolderContents
      };

    default:
      return state;
  }
}

export function createFolder(parentId, parentType, title = 'New Folder') {
  return function(dispatch, getState) {
    dispatch({
      type: NEW_FOLDER
    });

    fetch('/document_folders', {
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
        title,
        project_id: getState().project.id,
        parent_id: parentId,
        parent_type: parentType
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
    })
    .then(() => dispatch(loadProject(getState().project.id)))
    .then(() => dispatch({
      type: POST_SUCCESS
    }))
    .catch(() => dispatch({
      type: POST_ERRORED
    }));
  }
}

export function openFolder(id) {
  return function(dispatch) {
    dispatch({
      type: FOLDER_OPENED,
      id
    });

    fetch(`document_folders/${id}`, {
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
    .then(folder => dispatch({
      type: OPEN_SUCCESS,
      id,
      contentsChildren: folder.contents_children
    }))
    .catch(() => dispatch({
      type: OPEN_ERRORED
    }));
  };
}

export function closeFolder(id) {
  return function(dispatch) {
    dispatch({
      type: FOLDER_CLOSED,
      id
    });
  };
}

export function moveFolder(folderID, destination_id, bouyancy ) {
  return function(dispatch) {
    dispatch({
      type: UPDATE_FOLDER
    });

    return fetch(`/document_folders/${folderID}/move`, {
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
        destination_id,
        bouyancy
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
        type: MOVE_FOLDER_SUCCESS
      });
    })
    .catch(() => dispatch({
      type: MOVE_FOLDER_ERRORED
    }));
  }
}

export function updateFolder(id, attributes) {
  return function(dispatch) {
    dispatch({
      type: UPDATE_FOLDER
    });

    return fetch(`/document_folders/${id}`, {
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
    .then(folder => {
      dispatch({
        type: PATCH_SUCCESS,
        folder
      });
    })
    .catch(() => dispatch({
      type: PATCH_ERRORED
    }));
  }
}

export function deleteFolder(folderId, parentType, parentId) {
  return function(dispatch, getState) {
    dispatch({
      type: DELETE_FOLDER,
      id: folderId
    });

    fetch(`/document_folders/${folderId}`, {
      method: 'DELETE',
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      }
    })
    .then(response => response.json())
    .then((descendants) => {
      dispatch(closeDocumentFolders(descendants));
      dispatch({
        type: DELETE_SUCCESS,
        id: folderId
      });
      if (parentType === 'Project') {
        dispatch(loadProject(getState().project.id));
      }
      if (parentType === 'DocumentFolder' && getState().folders.openFolderContents[parentId]) {
        dispatch(openFolder(parentId))
      }
    })
    .catch(() => dispatch({
      type: DELETE_ERRORED,
      id: folderId
    }));
  };
}
