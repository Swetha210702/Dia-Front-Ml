import test from 'node:test';
import assert from 'node:assert/strict';
import {createFirebaseAuthAdapter} from '../src/services/firebase-auth.js';
import {applyAccountSession} from '../src/core/account-session.js';
import {emptyWorkspace} from '../src/core/workspace-state.js';
import {canWriteWorkspace,connectServices,connectionStatus,services} from '../src/services/index.js';

function fixture(){
 const calls=[],auth={name:'auth'};
 const user={uid:'account-1',email:'owner@example.com',displayName:'Owner',emailVerified:false,accessToken:'private-token'};
 const sdk={browserLocalPersistence:'local',browserSessionPersistence:'session',
  async setPersistence(...args){calls.push(['persistence',...args])},
  async signInWithEmailAndPassword(...args){calls.push(['signIn',...args]);return {user}},
  async signOut(...args){calls.push(['signOut',...args])},
  async sendPasswordResetEmail(...args){calls.push(['reset',...args])},
  onAuthStateChanged(instance,next,error){this.next=next;this.error=error;return ()=>calls.push(['unsubscribe'])}
 };
 return {auth,sdk,user,calls,adapter:createFirebaseAuthAdapter(auth,sdk)};
}
test('sign-in selects session persistence before submitting credentials and excludes tokens',async()=>{
 const {adapter,auth,calls}=fixture();
 const result=await adapter.signIn({email:' owner@example.com ',password:'secret'});
 assert.deepEqual(calls,[['persistence',auth,'session'],['signIn',auth,'owner@example.com','secret']]);
 assert.deepEqual(result,{uid:'account-1',email:'owner@example.com',displayName:'Owner',emailVerified:false});
 assert.ok(Object.isFrozen(result));
});
test('remember me selects local persistence; persistence failure prevents sign-in',async()=>{
 const {adapter,sdk,calls,auth}=fixture();
 await adapter.signIn({email:'owner@example.com',password:'secret',remember:true});
 assert.deepEqual(calls[0],['persistence',auth,'local']);
 calls.length=0;sdk.setPersistence=async()=>{throw Error('unavailable')};
 await assert.rejects(adapter.signIn({email:'owner@example.com',password:'secret'}));
 assert.equal(calls.length,0);
});
test('session observer reports normalized account and sign-out, and supports unsubscribe/error',()=>{
 const {adapter,sdk,user,calls}=fixture(),seen=[],errors=[];
 const stop=adapter.observeSession(account=>seen.push(account),error=>errors.push(error));
 sdk.next(user);sdk.next(null);sdk.error({code:'auth/network-request-failed'});stop();
 assert.equal(seen[0].uid,user.uid);assert.equal('accessToken' in seen[0],false);
 assert.equal(seen[1],null);assert.equal(errors[0].code,'auth/network-request-failed');
 assert.deepEqual(calls,[['unsubscribe']]);
});
test('password reset trims email, hides missing accounts and surfaces network failures',async()=>{
 const {adapter,auth,sdk,calls}=fixture();
 await adapter.resetPassword(' owner@example.com ');
 assert.deepEqual(calls,[['reset',auth,'owner@example.com']]);
 sdk.sendPasswordResetEmail=async()=>{throw {code:'auth/user-not-found'}};
 await adapter.resetPassword('unknown@example.com');
 sdk.sendPasswordResetEmail=async()=>{throw {code:'auth/network-request-failed'}};
 await assert.rejects(adapter.resetPassword('owner@example.com'),{code:'auth/network-request-failed'});
});
test('switching accounts clears private records and never confers workspace membership',()=>{
 const state=emptyWorkspace('dark');
 Object.assign(state,{userId:'old',workspaceId:'old-workspace',verified:true,session:true,clients:[{name:'Private'}],plans:[{id:'p'}],temporarySecret:'private'});
 applyAccountSession(state,{uid:'new',email:'new@example.com',emailVerified:true});
 assert.equal(state.theme,'dark');assert.equal(state.userId,'new');assert.equal(state.profile.email,'new@example.com');
 assert.equal(state.verified,false);assert.equal(state.workspaceId,null);assert.deepEqual(state.clients,[]);
 assert.equal('temporarySecret' in state,false);assert.equal(state.emailVerified,true);
 assert.equal(canWriteWorkspace(state,{auth:true,repository:true}),false);
 applyAccountSession(state,null);assert.equal(state.session,false);assert.equal(state.userId,null);assert.equal(state.profile.email,'');
});
test('connecting auth alone cannot enable repository, generation, billing or files',async()=>{
 const {adapter,calls,auth}=fixture();connectServices({auth:adapter});
 assert.deepEqual({...connectionStatus},{auth:true,repository:false,generation:false,billing:false,files:false});
 await services.auth.signOut();assert.deepEqual(calls,[['signOut',auth]]);
 await assert.rejects(services.repository.loadWorkspace(),{code:'service-unavailable'});
 assert.equal(canWriteWorkspace({userId:'account-1',workspaceId:null,verified:false}),false);
 connectServices({});
});
