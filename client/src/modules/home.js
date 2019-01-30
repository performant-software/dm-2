import { push } from 'react-router-redux';

export const LOADING = 'home/LOADING';
export const ERRORED = 'home/ERRORED';
export const FETCH_SUCCESS = 'home/FETCH_SUCCESS';
export const LOGIN_SHOWN = 'home/LOGIN_SHOWN';
export const LOGIN_HIDDEN = 'home/LOGIN_HIDDEN';
export const REGISTRATION_SHOWN = 'home/REGISTRATION_SHOWN';
export const REGISTRATION_HIDDEN = 'home/REGISTRATION_HIDDEN';
export const APPROVAL_PENDING_SHOWN = 'home/APPROVAL_PENDING_SHOWN';
export const APPROVAL_PENDING_HIDDEN = 'home/APPROVAL_PENDING_HIDDEN';
export const USER_EMAIL_CHANGED = 'home/USER_EMAIL_CHANGED';
export const USER_NAME_CHANGED = 'home/USER_NAME_CHANGED';
export const USER_PASSWORD_CHANGED = 'home/USER_PASSWORD_CHANGED';
export const USER_PASSWORD_CONFIRMATION_CHANGED = 'home/USER_PASSWORD_CONFIRMATION_CHANGED';
export const USER_AUTH_ERRORED = 'home/USER_AUTH_ERRORED';
export const AUTH_MENU_TOGGLED = 'home/AUTH_MENU_TOGGLED';
export const AUTH_MENU_HIDDEN = 'home/AUTH_MENU_HIDDEN';
export const ADMIN_DIALOG_SHOWN = 'home/ADMIN_DIALOG_SHOWN';
export const ADMIN_DIALOG_HIDDEN = 'home/ADMIN_DIALOG_HIDDEN';
export const USER_ADMIN_LIST_LOADING = 'home/USER_ADMIN_LIST_LOADING';
export const USER_ADMIN_LIST_ERRORED = 'home/USER_ADMIN_LIST_ERRORED';
export const USER_ADMIN_LIST_SUCCESS = 'home/USER_ADMIN_LIST_SUCCESS';
export const UPDATE_USER_LOADING = 'home/UPDATE_USER_LOADING';
export const UPDATE_USER_ERRORED = 'home/UPDATE_USER_ERRORED';
export const UPDATE_USER_SUCCESS = 'home/UPDATE_USER_SUCCESS';
export const DELETE_USER_LOADING = 'home/DELETE_USER_LOADING';
export const DELETE_USER_ERRORED = 'home/DELETE_USER_ERRORED';
export const DELETE_USER_SUCCESS = 'home/DELETE_USER_SUCCESS';

const initialState = {
  projects: [],
  loading: false,
  errored: false,
  loginShown: false,
  registrationShown: false,
  approvalPendingShown: false,
  userEmail: '',
  userName: '',
  userPassword: '',
  userPasswordConfirmation: '',
  userAuthError: false,
  authMenuShown: false,
  authMenuAnchor: null,
  adminDialogShown: false,
  userAdminList: [],
  userAdminListLoading: false,
  userAdminListErrored: false
};

export default function(state = initialState, action) {
  switch (action.type) {
    case LOADING:
      return {
        ...state,
        loading: true
      };

    case ERRORED:
      return {
        ...state,
        errored: true
      };

    case FETCH_SUCCESS:
      return {
        ...state,
        loading: false,
        projects: action.projects
      };

    case LOGIN_SHOWN:
      return {
        ...state,
        loginShown: true,
        registrationShown: false,
        approvalPendingShown: false,
        authMenuShown: false
      };

    case LOGIN_HIDDEN:
      return {
        ...state,
        loginShown: false,
        userAuthError: false,
        userEmail: '',
        userName: '',
        userPassword: '',
        userPasswordConfirmation: ''
      }

    case REGISTRATION_SHOWN:
      return {
        ...state,
        registrationShown: true,
        loginShown: false,
        approvalPendingShown: false,
        authMenuShown: false
      };

    case REGISTRATION_HIDDEN:
      return {
        ...state,
        registrationShown: false,
        userAuthError: false,
        userEmail: '',
        userName: '',
        userPassword: '',
        userPasswordConfirmation: ''
      };

    case APPROVAL_PENDING_SHOWN:
      return {
        ...state,
        approvalPendingShown: true,
        registrationShown: false,
        loginShown: false,
        authMenuShown: false
      };

    case APPROVAL_PENDING_HIDDEN:
      return {
        ...state,
        approvalPendingShown: false,
        userAuthError: false,
        userEmail: '',
        userName: '',
        userPassword: '',
        userPasswordConfirmation: ''
      };

    case USER_EMAIL_CHANGED:
      return {
        ...state,
        userEmail: action.value
      };

    case USER_NAME_CHANGED:
      return {
        ...state,
        userName: action.value
      };

    case USER_PASSWORD_CHANGED:
      return {
        ...state,
        userPassword: action.value
      };

    case USER_PASSWORD_CONFIRMATION_CHANGED:
      return {
        ...state,
        userPasswordConfirmation: action.value
      };

    case USER_AUTH_ERRORED:
      return {
        ...state,
        userAuthError: true
      };

    case AUTH_MENU_TOGGLED:
      return {
        ...state,
        authMenuShown: !state.authMenuShown,
        authMenuAnchor: action.anchor
      };

    case AUTH_MENU_HIDDEN:
      return {
        ...state,
        authMenuShown: false
      };

    case ADMIN_DIALOG_SHOWN:
      return {
        ...state,
        adminDialogShown: true
      };

    case ADMIN_DIALOG_HIDDEN:
      return {
        ...state,
        adminDialogShown: false
      };

    case USER_ADMIN_LIST_LOADING:
    case UPDATE_USER_LOADING:
    case DELETE_USER_LOADING:
      return {
        ...state,
        userAdminListLoading: true,
      };

    case USER_ADMIN_LIST_ERRORED:
    case UPDATE_USER_ERRORED:
    case DELETE_USER_ERRORED:
      return {
        ...state,
        userAdminListErrored: true,
        userAdminListLoading: false
      };

    case USER_ADMIN_LIST_SUCCESS:
    case UPDATE_USER_SUCCESS:
    case DELETE_USER_SUCCESS:
      return {
        ...state,
        userAdminListLoading: false,
        userAdminListErrored: false,
        userAdminList: action.users
      };

    default:
      return state;
  }
}

export function load() {
  return function(dispatch) {
    dispatch({
      type: LOADING
    });

    fetch('/projects', {
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
    .then(projects => {
      // sort by title
      projects = projects.sort(createAlphaNumericComparator('title'));
      dispatch({
        type: FETCH_SUCCESS,
        projects
      })
      dispatch(push('/'));
    })
    .catch(() => dispatch({
      type: ERRORED
    }));
  };
}

export function showLogin() {
  return function(dispatch) {
    dispatch({
      type: LOGIN_SHOWN
    });
  };
}

export function hideLogin() {
  return function(dispatch) {
    dispatch({
      type: LOGIN_HIDDEN
    });
  };
}

export function showRegistration() {
  return function(dispatch) {
    dispatch({
      type: REGISTRATION_SHOWN
    });
  };
}

export function hideRegistration() {
  return function(dispatch) {
    dispatch({
      type: REGISTRATION_HIDDEN
    });
  };
}

export function showApprovalPending() {
  return function(dispatch) {
    dispatch({
      type: APPROVAL_PENDING_SHOWN
    });
  };
}

export function hideApprovalPending() {
  return function(dispatch) {
    dispatch({
      type: APPROVAL_PENDING_HIDDEN
    });
  };
}

export function userEmailChanged(event) {
  return function(dispatch) {
    dispatch({
      type: USER_EMAIL_CHANGED,
      value: event.target.value
    });
  };
}

export function userNameChanged(event) {
  return function(dispatch) {
    dispatch({
      type: USER_NAME_CHANGED,
      value: event.target.value
    });
  };
}

export function userPasswordChanged(event) {
  return function(dispatch) {
    dispatch({
      type: USER_PASSWORD_CHANGED,
      value: event.target.value
    });
  };
}

export function userPasswordConfirmationChanged(event) {
  return function(dispatch) {
    dispatch({
      type: USER_PASSWORD_CONFIRMATION_CHANGED,
      value: event.target.value
    });
  };
}

export function userAuthErrored(error) {
  return function(dispatch) {
    dispatch({
      type: USER_AUTH_ERRORED,
      error
    });
  };
}

export function toggleAuthMenu(anchor) {
  return function(dispatch) {
    dispatch({
      type: AUTH_MENU_TOGGLED,
      anchor
    });
  };
}

export function hideAuthMenu(anchor) {
  return function(dispatch) {
    dispatch({
      type: AUTH_MENU_HIDDEN
    });
  };
}

export function showAdminDialog() {
  return function(dispatch) {
    dispatch({
      type: ADMIN_DIALOG_SHOWN
    });
    dispatch(loadUserAdminList());
  };
}

export function loadUserAdminList() {
  return function(dispatch) {
    dispatch({
      type: USER_ADMIN_LIST_LOADING
    });

    fetch('/users/list_admin', {
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
    .then(users => dispatch({
      type: USER_ADMIN_LIST_SUCCESS,
      users
    }))
    .catch(() => dispatch({
      type: USER_ADMIN_LIST_ERRORED
    }));
  };
}

export function hideAdminDialog() {
  return function(dispatch) {
    dispatch({
      type: ADMIN_DIALOG_HIDDEN
    });
  };
}

export function updateUser(userId, attributes) {
  return function(dispatch) {
    dispatch({
      type: UPDATE_USER_LOADING
    });

    fetch(`/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(attributes),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
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
    .then(users => dispatch({
      type: UPDATE_USER_SUCCESS,
      users
    }))
    .catch(() => dispatch({
      type: UPDATE_USER_ERRORED
    }));
  }
}

export function deleteUser(userId) {
  return function(dispatch) {
    dispatch({
      type: DELETE_USER_LOADING
    });

    fetch(`/users/${userId}`, {
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
      return response;
    })
    .then(response => response.json())
    .then(users => dispatch({
      type: DELETE_USER_SUCCESS,
      users
    }))
    .catch(() => dispatch({
      type: DELETE_USER_ERRORED
    }));
  }
}

function createAlphaNumericComparator( field ) {
  return function alphaNumericCompare(a,b) {
    var nameA = a[field].toUpperCase(); // ignore upper and lowercase
    var nameB = b[field].toUpperCase(); // ignore upper and lowercase
    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }
  
    // names must be equal
    return 0;
  }  
}

