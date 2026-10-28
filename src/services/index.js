/** Service boundary. Stage 3 supplies authenticated implementations. */
export class ServiceUnavailableError extends Error {
  constructor(service) {
    super(`${service} is not connected yet. Please contact your workspace administrator.`);
    this.name='ServiceUnavailableError';
    this.code='service-unavailable';
  }
}
const unavailable=name=>async()=>{throw new ServiceUnavailableError(name)};
const contracts=Object.freeze({
  auth:['signIn','signOut','resetPassword','observeSession'],
  repository:['loadWorkspace','saveWorkspace'],
  generation:['start','cancel','subscribe'],
  billing:['createCheckout','createCreditCheckout','getSubscription','listInvoices'],
  files:['uploadLogo','uploadCertification','remove']
});
export function createServices(adapters={}) {
  const registry={};
  for(const [name,methods] of Object.entries(contracts)) {
    const adapter=adapters[name];
    if(adapter&&methods.some(method=>typeof adapter[method]!=='function'))throw new TypeError(`Incomplete ${name} service adapter.`);
    registry[name]=Object.freeze(Object.fromEntries(methods.map(method=>[method,adapter?adapter[method].bind(adapter):unavailable(name==='auth'?'Account sign-in':name==='repository'?'Workspace storage':name==='generation'?'Diet-plan generation':name==='billing'?'Billing':'File storage')])));
  }
  return Object.freeze(registry);
}
export let services=createServices();
export const connectionStatus=Object.seal({auth:false,repository:false,generation:false,billing:false,files:false});
export function connectServices(adapters) {
  const registry=createServices(adapters);
  services=registry;
  for(const name of Object.keys(connectionStatus))connectionStatus[name]=Boolean(adapters[name]);
}
// No service is enabled merely because a session flag is present in browser storage.
export function canWriteWorkspace(session,status=connectionStatus) {
  return Boolean(session?.userId&&session?.workspaceId&&session?.verified===true&&status.auth===true&&status.repository===true);
}
export function publicError(error) {
  if(error?.code==='service-unavailable')return error.message;
  if(['auth/invalid-credential','auth/user-not-found','auth/wrong-password','auth/user-disabled'].includes(error?.code))return 'Email or password is incorrect, or this account is unavailable.';
  if(error?.code==='auth/invalid-email')return 'Enter a valid email address.';
  if(error?.code==='auth/network-request-failed')return 'Unable to reach sign-in. Check your internet connection and try again.';
  if(error?.code==='auth/too-many-requests')return 'Too many attempts. Please try again later.';
  if(error?.code==='workspace-conflict')return 'This workspace changed in another tab. Your edits are unsaved. Copy any text you need, then reload before editing again.';
  if(error?.code==='account-changed')return 'Your account changed. Please sign in again.';
  if(error?.code==='record-too-large')return 'This document is too large to save. Remove large embedded images or split the content.';
  if(error?.code==='permission-denied')return 'You do not have permission to perform this action.';
  if(error?.code==='unavailable'||error?.name==='AbortError')return 'The service is temporarily unavailable. Please try again.';
  return 'We couldn’t complete that action. Please try again.';
}
