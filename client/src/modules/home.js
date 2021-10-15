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
export const CONFIRM_USER_SUCCESS = 'home/CONFIRM_USER_SUCCESS';
export const CONFIRM_USER_ERRORED = 'home/CONFIRM_USER_ERRORED';
export const CONFIRM_USER_SUCCESS_DIALOG_CLOSED = 'home/CONFIRM_USER_SUCCESS_DIALOG_CLOSED';
export const RESEND_CONFIRMATION_STARTED = 'home/RESEND_CONFIRMATION_STARTED';
export const RESEND_CONFIRMATION_SUCCESS = 'home/RESEND_CONFIRMATION_SUCCESS';
export const RESEND_CONFIRMATION_ERRORED = 'home/RESEND_CONFIRMATION_ERRORED';

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
  userAdminListErrored: false,
  confirmUserSuccessDialogShown: false,
  confirmUserErrored: false,
  confirmUserErroredDialogShown: false,
  confirmationEmailResent: false,
  confirmationEmailErrored: false,
  confirmationResendButtonDisabled: false,
  confirmationEmailErrorMsg: '',
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
        userPasswordConfirmation: '',
        confirmationEmailResent: false,
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
        userAuthError: false,
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
        userAuthError: action.error
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
        userAuthError: false,
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

    case CONFIRM_USER_SUCCESS:
      return {
        ...state,
        userAuthError: false,
        confirmUserSuccessDialogShown: true,
        confirmUserErrored: false,
      };

    case CONFIRM_USER_SUCCESS_DIALOG_CLOSED:
      return {
        ...state,
        userAuthError: false,
        confirmUserSuccessDialogShown: false,
        confirmUserErrored: false,
      }

    case CONFIRM_USER_ERRORED:
      return {
        ...state,
        userAuthError: false,
        confirmUserSuccessDialogShown: true,
        confirmUserErrored: true,
      };

    case RESEND_CONFIRMATION_STARTED:
      return {
        ...state,
        confirmationResendButtonDisabled: true,
        confirmationEmailErrored: false,
        confirmationEmailResent: false,
        confirmationEmailErrorMsg: '',
      }

    case RESEND_CONFIRMATION_SUCCESS:
      return {
        ...state,
        confirmationEmailResent: true,
        confirmationEmailErrored: false,
        confirmationResendButtonDisabled: true,
        confirmationEmailErrorMsg: '',
      };
    
    case RESEND_CONFIRMATION_ERRORED:
      return {
        ...state,
        confirmationEmailErrored: true,
        confirmationEmailErrorMsg: action.error,
        confirmationEmailResent: false,
        confirmationResendButtonDisabled: false,
      }
      
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

export function confirmUser(token) {
  return function(dispatch) {
    fetch(`/auth/confirmation?confirmation_token=${token}`, {
      method: 'GET',
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
    .then(res => {
      if (res.account_confirmation_success === "true" || res.account_confirmation_success === true) {
        dispatch({
          type: CONFIRM_USER_SUCCESS
        });
      } else {
        throw Error(res);
      }
    })
    .catch((error) => {
      dispatch({
        type: CONFIRM_USER_ERRORED,
        error
      });
    })
  }
}

export function resendConfirmationEmail() {
  return function(dispatch, getState) {
    dispatch({
      type: RESEND_CONFIRMATION_STARTED,
    })
    fetch('/auth/confirmation', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'access-token': localStorage.getItem('access-token'),
        'token-type': localStorage.getItem('token-type'),
        'client': localStorage.getItem('client'),
        'expiry': localStorage.getItem('expiry'),
        'uid': localStorage.getItem('uid')
      },
      body: JSON.stringify({
        email: getState().home.userEmail
      }),
    })
    .then(response => {
      if (!response.ok) {
        const { errors } = response.json();
        if (errors && errors.length > 0) {
          throw Error(errors[0]);
        }
        throw Error(response.statusText);
      }
      dispatch({
        type: RESEND_CONFIRMATION_SUCCESS,
      });
      return response;
    })
    .catch(err => {
      dispatch({
        type: RESEND_CONFIRMATION_ERRORED,
        err
      });
    })
  }
}

export function closeConfirmDialog() {
  return function (dispatch) {
    dispatch({
      type: CONFIRM_USER_SUCCESS_DIALOG_CLOSED,
    })
  }
}