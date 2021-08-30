
export const SELECT_TARGET = 'annotationViewer/SELECT_TARGET';
export const SELECT_LOAD_SUCCESS = 'annotationViewer/SELECT_LOAD_SUCCESS';
export const SELECT_SIDEBAR_TARGET = 'annotationViewer/SELECT_SIDEBAR_TARGET';
export const SELECT_SIDEBAR_LOAD_SUCCESS = 'annotationViewer/SELECT_SIDEBAR_LOAD_SUCCESS';
export const SELECT_LOAD_ERRORED = 'annotationViewer/SELECT_LOAD_ERRORED';
export const REFRESH_TARGET = 'annotationViewer/REFRESH_TARGET';
export const REFRESH_SUCCESS = 'annotationViewer/REFRESH_SUCCESS';
export const REFRESH_ERRORED = 'annotationViewer/REFRESH_ERRORED';
export const CLOSE_TARGET = 'annotationViewer/CLOSE_TARGET';
export const CLOSE_TARGET_ROLLOVER = 'annotationViewer/CLOSE_TARGET_ROLLOVER';
export const CLOSE_SIDEBAR_TARGET = 'annotationViewer/CLOSE_SIDEBAR_TARGET';
export const CLOSE_DOCUMENT_TARGETS = 'annotationViewer/CLOSE_DOCUMENT_TARGETS';
export const PROMOTE_TARGET = 'annotationViewer/PROMOTE_TARGET';
export const CLEAR_SELECTION = 'annotationViewer/CLEAR_SELECTION';
export const DELETE_LINK_SUCCESS = 'annotationViewer/DELETE_LINK_SUCCESS';
export const ADD_LINK_SUCCESS = 'annotationViewer/ADD_LINK_SUCCESS';
export const MOVE_LINK = 'annotationViewer/MOVE_LINK';
export const MOVE_LINK_SUCCESS = 'annotationViewer/MOVE_LINK_SUCCESS';
export const MOVE_LINK_ERRORED = 'annotationViewer/MOVE_LINK_ERRORED';

const initialState = {
  selectedTargets: [],
  sidebarTarget: null,
  sidebarLoading: true,
  addedLink: {},
};

export default function(state = initialState, action) {
  switch (action.type) {
    case SELECT_TARGET:
      return {
        ...state,
        selectedTargets: state.selectedTargets.concat([Object.assign({loading: true, opened: Date.now()}, action.target)])
      };

    case SELECT_LOAD_SUCCESS:
      let preUpdateTargetsCopy = state.selectedTargets.slice(0);
      let toUpdateIndex = -1;
      if (action.target.highlight_id) {
        toUpdateIndex = preUpdateTargetsCopy.findIndex(target => target.highlight_id === action.target.highlight_id);
      }
      else {
        toUpdateIndex = preUpdateTargetsCopy.findIndex(target => target.document_id === action.target.document_id && !target.highlight_id);
      }
      if (toUpdateIndex >= 0) {
        let updatedTarget = Object.assign({opened: Date.now()}, action.target);
        updatedTarget.loading = false;
        Object.assign(updatedTarget, action.loadedTarget);
        preUpdateTargetsCopy.splice(toUpdateIndex, 1, updatedTarget);
      }
      return {
        ...state,
        selectedTargets: preUpdateTargetsCopy
      };

    case REFRESH_TARGET:
      let preRefreshTargetsCopy = state.selectedTargets.slice(0);
      if (action.index >= 0) {
        let refreshingTarget = Object.assign({}, preRefreshTargetsCopy[action.index]);
        refreshingTarget.loading = true;
        preRefreshTargetsCopy.splice(action.index, 1, refreshingTarget);
      }
      return {
        ...state,
        selectedTargets: preRefreshTargetsCopy
      }

    case REFRESH_SUCCESS:
      let preReplaceTargetsCopy = state.selectedTargets.slice(0);
      if (action.index >= 0) {
        let refreshedTarget = Object.assign({}, state.selectedTargets[action.index]);
        refreshedTarget.loading = false;
        Object.assign(refreshedTarget, action.loadedTarget);
        preReplaceTargetsCopy.splice(action.index, 1, refreshedTarget);
      }
      return {
        ...state,
        selectedTargets: preReplaceTargetsCopy
      };

    case SELECT_SIDEBAR_TARGET:
      return {
        ...state,
        sidebarTarget: action.target,
        sidebarLoading: true
      };

    case SELECT_SIDEBAR_LOAD_SUCCESS:
      let updatedTarget = Object.assign({}, action.target);
      Object.assign(updatedTarget, action.loadedTarget);
      return {
        ...state,
        sidebarTarget: updatedTarget,
        sidebarLoading: false
      };

    case CLOSE_TARGET: {
      let preCloseTargetsCopy = state.selectedTargets.slice(0);
      let toCloseIndex = -1;
      if (action.highlight_id) {
        toCloseIndex = preCloseTargetsCopy.findIndex(target => target.highlight_id === action.highlight_id);
      }
      else {
        toCloseIndex = preCloseTargetsCopy.findIndex(target => (target.document_id === action.document_id && !target.highlight_id))
      }
      if (toCloseIndex >= 0) {
        preCloseTargetsCopy.splice(toCloseIndex, 1);
      }
      return {
        ...state,
        selectedTargets: preCloseTargetsCopy
      };
    }

    case CLOSE_TARGET_ROLLOVER: {
      let preCloseTargetsCopy = state.selectedTargets.slice(0);
      let toCloseIndex = -1;
      toCloseIndex = preCloseTargetsCopy.findIndex(target => target.rollover && target.uid === action.highlight_uid);
      if (toCloseIndex >= 0) {
        preCloseTargetsCopy.splice(toCloseIndex, 1);
      }
      return {
        ...state,
        selectedTargets: preCloseTargetsCopy
      };
    }

    case CLOSE_DOCUMENT_TARGETS:
      const newSelectedTargets = state.selectedTargets.filter(target => target.document_id !== action.document_id)
      return {
        ...state,
        selectedTargets: newSelectedTargets
      };

    case CLOSE_SIDEBAR_TARGET:
      return {
        ...state,
        sidebarTarget: null
      };

    case PROMOTE_TARGET:
      let prePromoteTargetsCopy = state.selectedTargets.slice(0);
      let toPromoteIndex = -1;
      if (action.highlight_id) {
        toPromoteIndex = prePromoteTargetsCopy.findIndex(target => target.highlight_id === action.highlight_id);
      }
      else {
        toPromoteIndex = prePromoteTargetsCopy.findIndex(target => target.document_id === action.document_id && !target.highlight_id)
      }
      if (toPromoteIndex >= 0 && toPromoteIndex < prePromoteTargetsCopy.length - 1) {
        const targetToPromote = prePromoteTargetsCopy.splice(toPromoteIndex, 1)[0];
        prePromoteTargetsCopy.push(targetToPromote);
      }
      return {
        ...state,
        selectedTargets: prePromoteTargetsCopy
      }

    case CLEAR_SELECTION:
      return {
        ...state,
        selectedTargets: []
      };

    case DELETE_LINK_SUCCESS:
      // remove the link from the active targets
      const {selectedTargets, sidebarTarget} = state
      let nextSidebarTarget = null, nextSelectedTargets; 
      if (sidebarTarget) {
        nextSidebarTarget = { ...sidebarTarget }
        nextSidebarTarget.links_to = sidebarTarget.links_to.filter( link => link.link_id !== action.link_id )
      }

      nextSelectedTargets = [ ...selectedTargets ]
      nextSelectedTargets.forEach( target => {
        target.links_to = target.links_to.filter( link => link.link_id !== action.link_id )
      })

      return {
        ...state,
        sidebarTarget: nextSidebarTarget,
        selectedTargets: nextSelectedTargets
      };

    case ADD_LINK_SUCCESS:
      const { id, highlight_id, document_id, position, listType } = action.payload;
      return {
        ...state,
        addedLink: {
          id,
          highlight_id,
          document_id,
          position,
          listType,
        }
      };

    case MOVE_LINK:
      return {
        ...state,
        sidebarLoading: true
      };

    case MOVE_LINK_SUCCESS:
      return {
        ...state,
        sidebarLoading: false
      };

    case MOVE_LINK_ERRORED:
      return {
        ...state,
        sidebarLoading: false
      };
      
    default:
      return state;
  }
}

export function selectTarget(target) {
  return function(dispatch) {
    dispatch({
      type: CLOSE_TARGET,
      document_id: target.document_id,
      highlight_id: target.highlight_id
    });
    dispatch({
      type: SELECT_TARGET,
      target
    });

    const targetUrl = target.highlight_id ? `/highlights/${target.highlight_id}` : `/documents/${target.document_id}`;
    fetch(targetUrl, {
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
    .then(loadedTarget => dispatch({
      type: SELECT_LOAD_SUCCESS,
      loadedTarget,
      target
    }))
    // .catch(() => dispatch({
    //   type: SELECT_LOAD_ERRORED
    // }));
  }
}

// refresh all the targets that have links to this document
export function refreshTargetByDocumentID( document_id ) {
  return function(dispatch, getState) {
    const selectedTargets = getState().annotationViewer.selectedTargets;
    selectedTargets.forEach( (target,targetIndex) => {
      const linkToDoc = target.links_to.find( link => link.document_id === document_id )
      if( linkToDoc ) {
        dispatch( refreshTarget(targetIndex) );
      }
    })
  }
}

export function refreshTarget(index) {
  return function(dispatch, getState) {
    dispatch({
      type: REFRESH_TARGET,
      index
    });

    const existingTarget = getState().annotationViewer.selectedTargets[index];
    if (existingTarget) {
      const targetUrl = existingTarget.highlight_id ? `/highlights/${existingTarget.highlight_id}` : `/documents/${existingTarget.document_id}`;

      fetch(targetUrl, {
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
      .then(loadedTarget => dispatch({
        type: REFRESH_SUCCESS,
        loadedTarget,
        index
      }))
      .catch(() => dispatch({
        type: REFRESH_ERRORED,
        index
      }));
    }
  }
}

export function selectSidebarTarget(target) {
  return function(dispatch) {
    dispatch({
      type: SELECT_SIDEBAR_TARGET,
      target
    });

    const targetUrl = target.highlight_id ? `/highlights/${target.highlight_id}` : `/documents/${target.document_id}`;
    fetch(targetUrl, {
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
    .then(loadedTarget => dispatch({
      type: SELECT_SIDEBAR_LOAD_SUCCESS,
      loadedTarget,
      target
    }))
    .catch(() => dispatch({
      type: SELECT_LOAD_ERRORED
    }));
  }
}

export function closeTargetRollover(highlight_uid) {
  return function(dispatch) {
    dispatch({
      type: CLOSE_TARGET_ROLLOVER,
      highlight_uid
    });
  }
}

export function closeTarget(document_id, highlight_id) {
  return function(dispatch) {
    dispatch({
      type: CLOSE_TARGET,
      document_id,
      highlight_id
    });
  }
}

// close all targets related to this document
export function closeDocumentTargets(document_id) {
  return function(dispatch) {
    dispatch({
      type: CLOSE_DOCUMENT_TARGETS,
      document_id
    });
  }
}

export function closeSidebarTarget() {
  return function(dispatch) {
    dispatch({
      type: CLOSE_SIDEBAR_TARGET
    });
  }
}

export function promoteTarget(document_id, highlight_id) {
  return function(dispatch) {
    dispatch({
      type: PROMOTE_TARGET,
      document_id,
      highlight_id
    });
  }
}

export function clearSelection() {
  return function(dispatch) {
    dispatch({
      type: CLEAR_SELECTION
    });
  }
}

export function addLink(origin, linked, newLinkPosition, listType) {
  return function(dispatch, getState) {
    fetch('/links', {
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
        linkable_a_id: origin.linkable_id,
        linkable_a_type: origin.linkable_type,
        linkable_b_id: linked.linkable_id,
        linkable_b_type: linked.linkable_type
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(response => response.json())
    .then((newLink) => {
      const sidebarTarget = getState().annotationViewer.sidebarTarget;
      if (sidebarTarget) {
        let { highlight_id, document_id } = sidebarTarget;
        if (highlight_id) {
          if ((origin.linkable_type === 'Highlight' && origin.linkable_id === highlight_id) || (linked.linkable_type === 'Highlight' && linked.linkable_id === highlight_id))
            dispatch(selectSidebarTarget(sidebarTarget));
        }
        else if ((origin.linkable_type === 'Document' && origin.linkable_id === document_id) || (linked.linkable_type === 'Document' && linked.linkable_id === document_id))
          dispatch(selectSidebarTarget(sidebarTarget));
      }
      getState().annotationViewer.selectedTargets.forEach((target, index) => {
        let { highlight_id, document_id } = target;
        if (highlight_id) {
          if ((origin.linkable_type === 'Highlight' && origin.linkable_id === highlight_id) || (linked.linkable_type === 'Highlight' && linked.linkable_id === highlight_id))
            dispatch(refreshTarget(index));
        }
        else if ((origin.linkable_type === 'Document' && origin.linkable_id === document_id) || (linked.linkable_type === 'Document' && linked.linkable_id === document_id))
          dispatch(refreshTarget(index));
      });
      if (newLinkPosition) {
        dispatch({
          type: ADD_LINK_SUCCESS,
          payload: {
            id: newLink.id,
            highlight_id: newLink.linkable_a.highlight_id || newLink.linkable_b.highlight_id,
            document_id: newLink.linkable_a.document_id || newLink.linkable_b.document_id,
            position: newLinkPosition,
            listType,
          },
        });
      }
    })
    .catch(() => {
      // TODO
    });
  };
}

export function deleteLink(doomedLinkID) {
  return function(dispatch, getState) {
    fetch(`/links/${doomedLinkID}`, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
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
      return response;
    })
    .then(() => {
      dispatch({
        type: DELETE_LINK_SUCCESS,
        link_id: doomedLinkID
      });
    })
    .then(() => {
      // Update positions in UI
      const sidebarTarget = getState().annotationViewer.sidebarTarget;
      if (sidebarTarget && (sidebarTarget.highlight_id || sidebarTarget.document_id)) {
        dispatch(selectSidebarTarget(sidebarTarget));
      }
      getState().annotationViewer.selectedTargets.forEach((target, index) => {
        if (target.highlight_id || target.document_id) {
          dispatch(refreshTarget(index));
        }
      });
    })
    .catch(() => {
      //  TODO
    });
  };
}

export function moveLink(linkId, targetId, targetParentType, position) {
  return function(dispatch, getState) {
    dispatch({
      type: MOVE_LINK
    });
    return fetch(`/links/${linkId}/move`, {
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
        targetId,
        targetParentType,
        position,
      })
    })
    .then(response => {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then(() => {
      // Update positions in UI
      const sidebarTarget = getState().annotationViewer.sidebarTarget;
      if (sidebarTarget && (sidebarTarget.highlight_id || sidebarTarget.document_id)) {
        dispatch(selectSidebarTarget(sidebarTarget));
      }
      getState().annotationViewer.selectedTargets.forEach((target, index) => {
        if (target.highlight_id || target.document_id) {
          dispatch(refreshTarget(index));
        }
      });
    })
    .then(() => {
      dispatch({
        type: MOVE_LINK_SUCCESS
      });
    })
    .catch(() => dispatch({
      type: MOVE_LINK_ERRORED
    }));
  }
}