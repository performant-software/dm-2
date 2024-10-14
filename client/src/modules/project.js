import { push, replace } from 'react-router-redux';
import { CLOSE_SEARCH_POPUP } from './search'
import { CHECK_IN_DOCS } from './documentGrid'

export const TEXT_RESOURCE_TYPE = 'text';
export const CANVAS_RESOURCE_TYPE = 'canvas';
export const READ_PERMISSION = 'read';
export const WRITE_PERMISSION = 'write';
export const ADMIN_PERMISSION = 'admin';

export const LOAD_PROJECT = 'project/LOAD_PROJECT';
export const GET_SUCCESS = 'project/GET_SUCCESS';
export const GET_ERRORED = 'project/GET_ERRORED';
export const CLEAR_PROJECT = 'project/CLEAR_PROJECT';
export const NEW_PROJECT = 'project/NEW_PROJECT';
export const POST_SUCCESS = 'project/POST_SUCCESS';
export const POST_ERRORED = 'project/POST_ERRORED';
export const UPDATE_PROJECT = 'project/UPDATE_PROJECT';
export const PATCH_SUCCESS = 'project/PATCH_SUCCESS';
export const PATCH_ERRORED = 'project/PATCH_ERRORED';
export const DELETE_PROJECT = 'project/DELETE_PROJECT';
export const DELETE_SUCCESS = 'project/DELETE_SUCCESS';
export const DELETE_ERRORED = 'project/DELETE_ERRORED';
export const OPEN_DOCUMENT_POPOVER = 'project/OPEN_DOCUMENT_POPOVER';
export const CLOSE_DOCUMENT_POPOVER = 'project/CLOSE_DOCUMENT_POPOVER';
export const SETTINGS_SHOWN = 'project/SETTINGS_SHOWN';
export const SETTINGS_HIDDEN = 'project/SETTINGS_HIDDEN';
export const NEW_PERMISSION_LEVEL_CHANGE = 'project/NEW_PERMISSION_LEVEL_CHANGE';
export const NEW_PERMISSION_USER_CHANGE = 'project/NEW_PERMISSION_USER_CHANGE';
export const CREATE_PERMISSION_LOADING = 'project/CREATE_PERMISSION_LOADING';
export const CREATE_PERMISSION_ERRORED = 'project/CREATE_PERMISSION_ERRORED';
export const CREATE_PERMISSION_SUCCESS = 'project/CREATE_PERMISSION_SUCCESS';
export const TOGGLE_DELETE_CONFIRMATION = 'project/TOGGLE_DELETE_CONFIRMATION';
export const TOGGLE_SIDEBAR = 'project/TOGGLE_SIDEBAR';
export const HIDE_BATCH_IMAGE_PROMPT = 'project/HIDE_BATCH_IMAGE_PROMPT';
export const SHOW_BATCH_IMAGE_PROMPT = 'project/SHOW_BATCH_IMAGE_PROMPT';
export const IMAGE_UPLOAD_STARTED = 'project/IMAGE_UPLOAD_STARTED';
export const IMAGE_UPLOAD_COMPLETE = 'project/IMAGE_UPLOAD_COMPLETE';
export const IMAGE_UPLOAD_ERRORED = 'project/IMAGE_UPLOAD_ERRORED';
export const IMAGE_UPLOAD_TIMEOUT = 'project/IMAGE_UPLOAD_TIMEOUT';
export const IMAGE_UPLOAD_TO_RAILS_SUCCESS = 'project/IMAGE_UPLOAD_TO_RAILS_SUCCESS';
export const SET_UPLOADING_TRUE = 'project/SET_UPLOADING_TRUE';
export const KILL_UPLOADING = 'project/KILL_UPLOADING';
export const ADD_FOLDER_DATA = 'project/ADD_FOLDER_DATA';
export const SHOW_CLOSE_DIALOG = 'project/SHOW_CLOSE_DIALOG';
export const HIDE_CLOSE_DIALOG = 'project/HIDE_CLOSE_DIALOG';
export const IMAGE_UPLOAD_DOC_CREATED = 'project/IMAGE_UPLOAD_DOC_CREATED';
export const GET_EXPORTS_LOADING = 'project/GET_EXPORTS_LOADING';
export const GET_EXPORTS_SUCCESS = 'project/GET_EXPORTS_SUCCESS';
export const GET_EXPORTS_ERRORED = 'project/GET_EXPORTS_ERRORED';
export const CREATE_EXPORT_LOADING = 'project/CREATE_EXPORT_LOADING';
export const CREATE_EXPORT_SUCCESS = 'project/CREATE_EXPORT_SUCCESS';
export const CREATE_EXPORT_ERRORED = 'project/CREATE_EXPORT_ERRORED';

const sidebarOpenWidth = 490

const initialState = {
  id: null,
  title: 'No project selected',
  description: '',
  contentsChildren: [],
  userProjectPermissions: [],
  public: false,
  currentUserPermissions: {},
  loading: false,
  errored: false,
  documentPopoverOpenFor: null,
  settingsShown: false,
  newPermissionLoading: false,
  newPermissionUser: null,
  newPermissionLevel: READ_PERMISSION,
  newPermissionError: null,
  deleteConfirmed: false,
  sidebarWidth: sidebarOpenWidth,
  sidebarOpen: true,
  batchImagePromptShown: false,
  uploads: [],
  uploading: false,
  folderData: [],
  closeDialogShown: false,
  uploadError: null,
  exports: {},
  exportsError: null,
  exportsLoading: false,
  exportJobId: null,
};

export default function(state = initialState, action) {
  switch (action.type) {
    case LOAD_PROJECT:
      return {
        ...state,
        title: action.title || state.title,
        loading: true
      };

    case DELETE_SUCCESS:
    case CLEAR_PROJECT:
      return initialState;

    case NEW_PROJECT:
      return {
        ...state,
        loading: true,
        title: 'Untitled Project'
      };

    case UPDATE_PROJECT:
    case DELETE_PROJECT:
      return {
        ...state,
        loading: true
      }

    case GET_SUCCESS:
    case POST_SUCCESS:
    case PATCH_SUCCESS:
      return {
        ...state,
        loading: false,
        id: action.projectId,
        title: action.projectTitle,
        description: action.projectDescription,
        userProjectPermissions: action.userProjectPermissions || [],
        contentsChildren: action.contentsChildren || [],
        public: action.public,
        currentUserPermissions: action.currentUserPermissions
      };

    case GET_ERRORED:
    case POST_ERRORED:
    case PATCH_ERRORED:
    case DELETE_ERRORED:
      console.log('project error');
      return {
        ...state,
        loading: false,
        errored: true
      };

    case OPEN_DOCUMENT_POPOVER:
      return {
        ...state,
        documentPopoverOpenFor: action.target
      };

    case CLOSE_DOCUMENT_POPOVER:
      return {
        ...state,
        documentPopoverOpenFor: null
      };

    case SETTINGS_SHOWN:
      return {
        ...state,
        settingsShown: true
      };

    case SETTINGS_HIDDEN:
      return {
        ...state,
        settingsShown: false
      };

    case CREATE_PERMISSION_LOADING:
      return {
        ...state,
        newPermissionLoading: true,
      };

    case CREATE_PERMISSION_SUCCESS:
      return {
        ...state,
        newPermissionLoading: false,
        newPermissionError: null,
        newPermissionUser: null
      };

    case CREATE_PERMISSION_ERRORED:
      return {
        ...state,
        newPermissionLoading: false,
        newPermissionError: 'Unable to add user.',
      }

    case NEW_PERMISSION_USER_CHANGE:
      return {
        ...state,
        newPermissionUser: action.user
      };

    case NEW_PERMISSION_LEVEL_CHANGE:
      return {
        ...state,
        newPermissionLevel: action.level
      };

    case TOGGLE_DELETE_CONFIRMATION:
      return {
        ...state,
        deleteConfirmed: !state.deleteConfirmed
      };

    case TOGGLE_SIDEBAR:
      const sidebarOpen = !state.sidebarOpen
      const sidebarWidth = sidebarOpen ? sidebarOpenWidth : 0
      return {
        ...state,
        sidebarOpen,
        sidebarWidth 
      };

    case SHOW_BATCH_IMAGE_PROMPT:
      return {
        ...state,
        batchImagePromptShown: action.projectId,
      };

    case HIDE_BATCH_IMAGE_PROMPT:
      return {
        ...state,
        batchImagePromptShown: false,
        uploading: false,
        uploads: [],
        folderData: [],
        uploadError: null,
      };

    case SET_UPLOADING_TRUE:
      return {
        ...state,
        uploading: true,
        uploadError: null,
      };

    case KILL_UPLOADING:
      return {
        ...state,
        uploading: false,
        uploadError: action.err,
      };
    
    case IMAGE_UPLOAD_STARTED:
      const uploads = action.signedIds.map((signedId) => ({
        signedId,
        state: 'uploading',
      }));
      return {
        ...state,
        uploads,
      };
    
    case IMAGE_UPLOAD_TO_RAILS_SUCCESS:
      const uploadsWithFilename = state.uploads.map((upload) => ({
        ...upload,
        filename: upload.signedId === action.signedId ? action.image.filename : upload.filename,
      }));
      return {
        ...state,
        uploads: uploadsWithFilename,
      };

    case IMAGE_UPLOAD_DOC_CREATED:
      const createdUploads = state.uploads.map((upload) => ({
        ...upload,
        state: upload.signedId === action.signedId ? 'doc-created' : upload.state,
      }));
      return {
        ...state,
        uploads: createdUploads,
      };
      
    case IMAGE_UPLOAD_COMPLETE:
      const newUploads = state.uploads.map((upload) => ({
        ...upload,
        state: upload.signedId === action.signedId ? 'finished' : upload.state,
      }));
      const stillUploadingComplete = newUploads.some(upload => !['timeout', 'finished', 'error'].includes(upload.state));
      return {
        ...state,
        uploads: newUploads,
        uploading: stillUploadingComplete,
      };
    
    case IMAGE_UPLOAD_ERRORED:
      const uploadsWithError = state.uploads.map((upload) => ({
        ...upload,
        state: upload.signedId === action.signedId ? 'error' : upload.state,
        error: upload.signedId === action.signedId ? action.error : upload.error,
      }));
      const stillUploadingErrored = uploadsWithError.some(upload => !['timeout', 'finished', 'error'].includes(upload.state));
      return {
        ...state,
        uploads: uploadsWithError,
        uploading: stillUploadingErrored,
      };

    case IMAGE_UPLOAD_TIMEOUT:
      const uploadsWithTimeout = state.uploads.map((upload) => ({
        ...upload,
        state: upload.signedId === action.signedId ? 'timeout' : upload.state,
        error: upload.signedId === action.signedId ? action.error : upload.error,
      }));
      const stillUploadingTimeout = uploadsWithTimeout.some(upload => !['timeout', 'finished', 'error'].includes(upload.state));
      return {
        ...state,
        uploads: uploadsWithTimeout,
        uploading: stillUploadingTimeout,
      };

    case ADD_FOLDER_DATA:
      return {
        ...state,
        folderData: action.folders,
      }
      
    case SHOW_CLOSE_DIALOG:
      return {
        ...state,
        closeDialogShown: true,
      }

    case HIDE_CLOSE_DIALOG:
      return {
        ...state,
        closeDialogShown: false,
      }

    case GET_EXPORTS_LOADING:
      return {
        ...state,
        exportsError: null,
        exportsLoading: true,
      }

    case GET_EXPORTS_SUCCESS:
      return {
        ...state,
        exports: action.exports,
        exportsError: null,
        exportsLoading: false,
        exportJobId: null,
      }

    case GET_EXPORTS_ERRORED:
      return {
        ...state,
        exportsError: action.error,
        exportsLoading: false,
      }

    case CREATE_EXPORT_LOADING:
      return {
        ...state,
        exportsError: null,
        exportsLoading: true,
      }

    case CREATE_EXPORT_SUCCESS:
      return {
        ...state,
        exportJobId: action.jobId,
        exportsError: null,
        exportsLoading: false,
      }

    case CREATE_EXPORT_ERRORED:
      return {
        ...state,
        exportsError: action.error,
        exportsLoading: false,
      }
    
    default:
      return state;
  }
}

export function clearProject() {
  return function(dispatch) {
    dispatch({
      type: CLOSE_SEARCH_POPUP
    });
    dispatch({
      type: CLEAR_PROJECT
    });
  };
}

export function loadProject(projectId, title) {
  return function(dispatch) {
    dispatch({
      type: LOAD_PROJECT
    });

    fetch(`projects/${projectId}`, {
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
    .then(project => {
      if( project.forbidden ) {
        dispatch(push('/'))
      } else {
        dispatch({
          type: GET_SUCCESS,
          projectId: project.id,
          projectTitle: project.title,
          projectDescription: project.description,
          contentsChildren: project['contents_children'],
          userProjectPermissions: project['user_project_permissions'],
          public: project.public,
          currentUserPermissions: project['current_user_permissions']
        });
        dispatch(loadExports(project.id));
      }
    })
    .catch(() => dispatch({
      type: GET_ERRORED
    }));
  };
}

export function newProject() {
  return function(dispatch) {
    dispatch({
      type: NEW_PROJECT
    });
    dispatch(push('/new'));

    fetch('/projects', {
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        title: 'Untitled Project'
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(project => {
      dispatch({
        type: POST_SUCCESS,
        projectId: project.id,
        projectTitle: project.title,
        userProjectPermissions: project['user_project_permissions'],
        public: project.public,
        currentUserPermissions: project['current_user_permissions']
      });
      dispatch(replace(`/${project.id}`));
      dispatch(showSettings());
    })
    .catch(() => dispatch({
      type: POST_ERRORED
    }));
  };
}

export function updateProject(projectId, attributes) {
  return function(dispatch) {
    dispatch({
      type: UPDATE_PROJECT
    });

    fetch(`/projects/${projectId}`, {
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
    .then(project => {
      dispatch({
        type: PATCH_SUCCESS,
        projectId: project.id,
        projectTitle: project.title,
        projectDescription: project.description,
        contentsChildren: project['contents_children'],
        userProjectPermissions: project['user_project_permissions'],
        public: project.public,
        currentUserPermissions: project['current_user_permissions']
      });
    })
    .catch(() => dispatch({
      type: PATCH_ERRORED
    }));
  };
}

export function openDocumentPopover(target) {
  return function(dispatch) {
    dispatch({
      type: OPEN_DOCUMENT_POPOVER,
      target
    });
  };
}

export function closeDocumentPopover() {
  return function(dispatch) {
    dispatch({
      type: CLOSE_DOCUMENT_POPOVER
    });
  };
}

export function showSettings() {
  return function(dispatch) {
    dispatch({
      type: SETTINGS_SHOWN
    });
  };
}

export function hideSettings() {
  return function(dispatch) {
    dispatch({
      type: SETTINGS_HIDDEN
    });
  };
}

export function setNewPermissionUser(user) {
  return function(dispatch) {
    dispatch({
      type: NEW_PERMISSION_USER_CHANGE,
      user
    });
  };
}

export function setNewPermissionLevel(level) {
  return function(dispatch) {
    dispatch({
      type: NEW_PERMISSION_LEVEL_CHANGE,
      level
    });
  };
}

export function createNewPermission() {
  return function(dispatch, getState) {
    const { id, newPermissionUser, newPermissionLevel } = getState().project;

    if (newPermissionUser !== null) {
      dispatch({
        type: CREATE_PERMISSION_LOADING
      });

      fetch('/user_project_permissions', {
        headers: {
          'access-token': localStorage.getItem('access-token'),
          'token-type': localStorage.getItem('token-type'),
          'client': localStorage.getItem('client'),
          'expiry': localStorage.getItem('expiry'),
          'uid': localStorage.getItem('uid'),
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          project_id: id,
          email: newPermissionUser,
          permission: newPermissionLevel
        })
      })
      .then(response => {
        if (!response.ok) {
          throw Error(response.statusText);
        }
      })
      .then(() => {
        dispatch({
          type: CREATE_PERMISSION_SUCCESS
        });
        dispatch(loadProject(id));
      })
      .catch(() => dispatch({
        type: CREATE_PERMISSION_ERRORED
      }));
    }
  }
}

export function deletePermission(id) {
  return function(dispatch, getState) {
    dispatch({
      type: CREATE_PERMISSION_LOADING
    });

    fetch(`/user_project_permissions/${id}`, {
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
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
        type: CREATE_PERMISSION_SUCCESS
      });
      dispatch(loadProject(getState().project.id));
    })
    .catch(() => dispatch({
      type: CREATE_PERMISSION_ERRORED
    }));
  }
}

export function updatePermission(id, permissionLevel) {
  return function(dispatch, getState) {
    dispatch({
      type: CREATE_PERMISSION_LOADING
    });

    fetch(`/user_project_permissions/${id}`, {
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'PATCH',
      body: JSON.stringify({
        permission: permissionLevel
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
    })
    .then(() => {
      dispatch({
        type: CREATE_PERMISSION_SUCCESS
      });
      dispatch(loadProject(getState().project.id));
    })
    .catch(() => dispatch({
      type: CREATE_PERMISSION_ERRORED
    }));
  }
}

export function checkInAll(projectID) {
  return function(dispatch) {
    fetch(`/projects/${projectID}/check_in`, {
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then(status => {
      dispatch({
        type: CHECK_IN_DOCS,
        projectId: projectID,
        docIDs: status.checked_in_docs,
      });
    })
    .catch(() => dispatch({
      type: POST_ERRORED
    }));
  };
}

export function toggleDeleteConfirmation() {
  return function(dispatch) {
    dispatch({
      type: TOGGLE_DELETE_CONFIRMATION
    });
  }
}

export function toggleSidebar() {
  return function(dispatch) {
    dispatch({
      type: TOGGLE_SIDEBAR
    });
  }
}

export function deleteProject(projectId) {
  return function(dispatch) {
    dispatch({
      type: DELETE_PROJECT
    });

    fetch(`/projects/${projectId}`, {
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
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
        type: DELETE_SUCCESS
      });
      dispatch(push('/'));
    })
    .catch(() => dispatch({
      type: DELETE_ERRORED
    }));
  }
}

export function hideBatchImagePrompt() {
  return function(dispatch) {
    dispatch({
      type: HIDE_BATCH_IMAGE_PROMPT,
    });
  }
}

export function showBatchImagePrompt({ projectId }) {
  return function(dispatch) {
    dispatch({
      type: SHOW_BATCH_IMAGE_PROMPT,
      projectId,
    });
    dispatch(getFolderData({ projectId }));
  }
}

export function startUploading() {
  return function(dispatch) {
    dispatch({
      type: SET_UPLOADING_TRUE,
    });
  }
}

export function killUploading(err) {
  return function(dispatch) {
    dispatch({
      type: KILL_UPLOADING,
      err,
    });
  }
}

function getFolderDataFromIds({ folderIds }) {
  return function(dispatch, getState) {
    const { id } = getState().project;
    fetch('/document_folders/get_many', {
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        folder_ids: folderIds,
        project_id: id,
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json()
    })
    .then(folders => {
      dispatch({
        type: ADD_FOLDER_DATA,
        folders: folders.map(folder => ({
          id: folder[0],
          title: folder[1],
          parent_type: folder[2],
          parent_id: folder[3],
        }))
      })
    })
    .catch(error => {
      console.error(error);
    });
  }
}

export function getFolderData({ projectId }) {
  return function(dispatch, getState) {
    fetch(`/projects/${projectId}`, {
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
    .then(project => {
      let folderIds = [];
      if (project.contents_children) { 
        project.contents_children.filter(
          child => child['document_kind'] === 'folder'
        ).forEach(child => {
          folderIds.push(child.id);
          child.descendant_folder_ids.forEach(descendant => {
            if (!folderIds.includes(descendant)) {
              folderIds.push(descendant);
            }
          })
        });
        dispatch(getFolderDataFromIds({ folderIds }));
      }
    });
  }
}

export function showCloseDialog() {
  return function(dispatch) {
    dispatch({
      type: SHOW_CLOSE_DIALOG,
    })
  }
}

export function hideCloseDialog() {
  return function(dispatch) {
    dispatch({
      type: HIDE_CLOSE_DIALOG,
    })
  }
}

export function loadExports(projectId) {
  return function(dispatch) {
    dispatch({
      type: GET_EXPORTS_LOADING
    });

    fetch(`projects/${projectId}/exports`, {
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
    .then(data => {
      dispatch({
        type: GET_EXPORTS_SUCCESS,
        exports: data,
      });
    })
    .catch(() => dispatch({
      type: GET_EXPORTS_ERRORED
    }));
  };
}

export function createExport() {
  return function(dispatch, getState) {
    const { id } = getState().project;
    dispatch({
      type: CREATE_EXPORT_LOADING
    });

    fetch(`/projects/${id}/create_export`, {
      headers: {
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid'),
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST',
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response.json();
    })
    .then((job) => {
      setTimeout(() => {
        dispatch(loadExports(id));
      }, 3000);
      dispatch({
        type: CREATE_EXPORT_SUCCESS,
        jobId: job.id,
      });
    })
    .catch((err) => dispatch({
      type: CREATE_EXPORT_ERRORED,
      error: err,
    }));
  }
}