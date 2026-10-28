import test,{before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import * as sdk from 'firebase/firestore';
import {createFirestoreWorkspace} from '../src/services/firestore-workspace.js';
import {saveCheckin,moveToTrash,restoreFromTrash} from '../src/core/workspace-actions.js';
import {emptyWorkspace} from '../src/core/workspace-state.js';
sdk.setLogLevel('silent');
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-dia-workspace',firestore:{host:'127.0.0.1',port:8080,rules:await readFile(new URL('../database/firestore.rules',import.meta.url),'utf8')}})});
after(async()=>{await env?.cleanup()});
beforeEach(async()=>{await env.clearFirestore()});
const owner='owner-1';
const account={uid:owner,email:'owner@example.com'};
const client={id:'DIA-1001',name:'Workflow Test',email:'test@example.invalid',age:30,height:170,weight:70,target:68,status:'Active',diet:'Vegetarian'};
function repo(uid=owner){const db=env.authenticatedContext(uid).firestore();return {db,adapter:createFirestoreWorkspace(db,sdk,()=>({uid}))}}
async function started(){const value=repo();return {...value,state:await value.adapter.loadWorkspace(account)}}
const record=(payload,revision=1)=>({workspaceId:owner,id:payload.id,schemaVersion:1,createdBy:owner,createdAt:sdk.serverTimestamp(),updatedAt:sdk.serverTimestamp(),revision,active:true,payload});
test('account receives its own empty workspace, profile saves and survives reload',async()=>{
 const {adapter,state}=await started();assert.equal(state.workspaceId,owner);assert.equal(state.verified,true);
 state.setup={name:'Owner',title:'Dietitian'};state.setupStep=1;await adapter.saveWorkspace(state);
 const loaded=await repo().adapter.loadWorkspace(account);assert.equal(loaded.setup.name,'Owner');assert.equal(loaded.setupStep,1);assert.equal(loaded.clients.length,0);
});
test('client create, update, soft deletion and restore are durable',async()=>{
 const {adapter,state}=await started();state.clients.push({...client});await adapter.saveWorkspace(state);
 state.clients[0].weight=69;await adapter.saveWorkspace(state);
 let loaded=await repo().adapter.loadWorkspace(account);assert.equal(loaded.clients[0].weight,69);
 state.clients=[];await adapter.saveWorkspace(state);loaded=await repo().adapter.loadWorkspace(account);assert.equal(loaded.clients.length,0);
 state.clients=[{...client,weight:69}];await adapter.saveWorkspace(state);loaded=await repo().adapter.loadWorkspace(account);assert.equal(loaded.clients[0].id,client.id);
});
test('stale edits conflict rather than overwriting a newer tab',async()=>{
 const {adapter,state}=await started();state.clients.push({...client});await adapter.saveWorkspace(state);
 const second=repo(),other=await second.adapter.loadWorkspace(account);
 state.clients[0].name='First tab';await adapter.saveWorkspace(state);
 other.clients[0].name='Second tab';await assert.rejects(second.adapter.saveWorkspace(other),{code:'workspace-conflict'});
 assert.equal((await repo().adapter.loadWorkspace(account)).clients[0].name,'First tab');
});
test('another account and anonymous callers cannot read or write the workspace',async()=>{
 await started();const foreign=env.authenticatedContext('other').firestore(),anon=env.unauthenticatedContext().firestore();
 for(const db of [foreign,anon]){
  await assertFails(sdk.getDoc(sdk.doc(db,'workspaces',owner)));
  await assertFails(sdk.getDocs(sdk.collection(db,'workspaces',owner,'clients')));
  await assertFails(sdk.setDoc(sdk.doc(db,'workspaces',owner,'clients',client.id),record(client)));
 }
});
test('no user can list tenants or change the owner or delete the workspace',async()=>{
 const {db}=await started();await assertFails(sdk.getDocs(sdk.collection(db,'workspaces')));
 await assertFails(sdk.updateDoc(sdk.doc(db,'workspaces',owner),{ownerId:'other'}));
 await assertFails(sdk.deleteDoc(sdk.doc(db,'workspaces',owner)));
});
test('client payload validation and metadata reject malformed or forged records',async()=>{
 const {db}=await started(),ref=sdk.doc(db,'workspaces',owner,'clients',client.id);
 await assertFails(sdk.setDoc(ref,record({...client,weight:-10})));
 await assertFails(sdk.setDoc(ref,{...record(client),createdBy:'other'}));
 await assertFails(sdk.setDoc(ref,{...record(client),workspaceId:'other'}));
 await assertSucceeds(sdk.setDoc(ref,record(client)));
 await assertFails(sdk.updateDoc(ref,{'payload.weight':65,updatedAt:sdk.serverTimestamp(),revision:1}));
 await assertFails(sdk.deleteDoc(ref));
});
test('credits, tiers, generation completion and invoices remain server-only',async()=>{
 const {db}=await started();
 for(const collection of ['entitlements','generations','invoices','creditLedger','files'])await assertFails(sdk.setDoc(sdk.doc(db,'workspaces',owner,collection,'current'),record({id:'current',tier:'Plus',credits:9999,status:'Completed'})));
 await assertFails(sdk.setDoc(sdk.doc(db,'workspaces',owner,'settings','profile'),record({id:'profile',profile:{},setup:{},setupStep:0,onboarded:false,tourDone:false,lastIntakeClientId:null,credits:9999})));
});
test('clients cannot create original model plans or alter published plan content',async()=>{
 const {db}=await started(),plan={id:'PLAN-1',clientId:client.id,name:'Plan',status:'Published',model:'Pro',cost:5,version:1,meals:[]};
 await assertFails(sdk.setDoc(sdk.doc(db,'workspaces',owner,'plans',plan.id),record(plan)));
 await env.withSecurityRulesDisabled(async context=>{await sdk.setDoc(sdk.doc(context.firestore(),'workspaces',owner,'plans',plan.id),record(plan))});
 await assertFails(sdk.updateDoc(sdk.doc(db,'workspaces',owner,'plans',plan.id),{payload:{...plan,name:'Changed'},revision:2,updatedAt:sdk.serverTimestamp()}));
});
test('failed permissions never fabricate a connected workspace',async()=>{
 const db=env.unauthenticatedContext().firestore(),adapter=createFirestoreWorkspace(db,sdk,()=>account);
 await assert.rejects(adapter.loadWorkspace(account),{code:'permission-denied'});
 await assert.rejects(adapter.saveWorkspace(emptyWorkspace()),{code:'account-changed'});
});

test('check-ins, linked client trash and restore round-trip together',async()=>{
 const {adapter,state}=await started();state.clients.push({...client});await adapter.saveWorkspace(state);
 saveCheckin(state,{clientId:client.id,date:'2026-10-27',weight:69,adherence:90,energy:4,notes:'Workflow check'});
 await adapter.saveWorkspace(state);
 let fresh=await repo().adapter.loadWorkspace(account);assert.equal(fresh.progress.length,1);assert.equal(fresh.clients[0].weight,69);
 moveToTrash(state,'client',client.id);await adapter.saveWorkspace(state);
 fresh=await repo().adapter.loadWorkspace(account);assert.equal(fresh.clients.length,0);assert.equal(fresh.progress.length,0);assert.equal(fresh.trash.length,1);
 restoreFromTrash(state,state.trash[0].id);await adapter.saveWorkspace(state);
 fresh=await repo().adapter.loadWorkspace(account);assert.equal(fresh.clients.length,1);assert.equal(fresh.progress.length,1);assert.equal(fresh.trash.length,0);
});
test('saving a reloaded workspace does not rewrite unchanged documents',async()=>{
 const {adapter,state}=await started();state.clients.push({...client});await adapter.saveWorkspace(state);
 const second=repo(),fresh=await second.adapter.loadWorkspace(account);await second.adapter.saveWorkspace(fresh);
 const value=await sdk.getDoc(sdk.doc(second.db,'workspaces',owner,'clients',client.id));assert.equal(value.data().revision,1);
});

test('onboarding can finish with certification pending upload and persists after reload',async()=>{
 const {adapter,state}=await started();
 state.setup={name:'Workflow Owner',title:'Dietitian',yearsExperience:'4',experience:'Nutrition practice',certificationStatus:'pending-upload'};
 state.setupStep=3;await adapter.saveWorkspace(state);
 let fresh=await repo().adapter.loadWorkspace(account);assert.equal(fresh.setup.certificationStatus,'pending-upload');assert.equal(fresh.onboarded,false);
 state.profile={...state.profile,...state.setup};state.setup={};state.onboarded=true;await adapter.saveWorkspace(state);
 fresh=await repo().adapter.loadWorkspace(account);assert.equal(fresh.onboarded,true);assert.equal(fresh.profile.certificationStatus,'pending-upload');assert.equal(fresh.profile.certification,undefined);
});
