import { generateAuthActions } from 'redux-token-auth';
import { authUrl } from './constants';

const config = {
  authUrl,
  userAttributes: {
    name: 'name',
    approved: 'approved',
    admin: 'admin',
    id: 'id',
    confirmed: 'confirmed',
  },
  userRegistrationAttributes: {
    name: 'name',
    password_confirmation: 'password_confirmation'
  }
}

const {
  registerUser,
  signInUser,
  signOutUser,
  verifyCredentials
} = generateAuthActions(config);

export {
  registerUser,
  signInUser,
  signOutUser,
  verifyCredentials
};
