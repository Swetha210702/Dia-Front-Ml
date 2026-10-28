import {emptyWorkspace} from './workspace-state.js';

export function applyAccountSession(state,account) {
  const theme=state.theme;
  // Sign-in is not proof of workspace membership. Never retain a prior account's data.
  for(const key of Object.keys(state))delete state[key];
  Object.assign(state,emptyWorkspace(theme));
  if(account?.uid) {
    state.session=true;
    state.userId=account.uid;
    state.emailVerified=account.emailVerified===true;
    state.profile.email=account.email||'';
    state.profile.name=account.displayName||'';
  }
}
