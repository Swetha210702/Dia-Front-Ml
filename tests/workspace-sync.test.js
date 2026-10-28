import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkspaceSync} from '../src/core/workspace-sync.js';
import {workspaceRecords,recordChanges} from '../src/services/workspace-records.js';
import {emptyWorkspace} from '../src/core/workspace-state.js';
test('cloud saves are serialized and later edits are not lost during an earlier write',async()=>{
 let release;const seen=[],status=[];
 const sync=createWorkspaceSync(async value=>{seen.push(value);if(seen.length===1)await new Promise(resolve=>release=resolve)},value=>status.push(value));
 const first=sync.save({name:'one'}),next=sync.save({name:'two'});assert.equal(sync.dirty,true);
 release();await Promise.all([first,next]);assert.deepEqual(seen,[{name:'one'},{name:'two'}]);assert.equal(sync.dirty,false);assert.deepEqual(status,['saving','saved']);
});
test('failed writes remain dirty and retry can succeed without showing a false saved status',async()=>{
 let fail=true;const statuses=[];
 const sync=createWorkspaceSync(async()=>{if(fail)throw Error('offline')},(status)=>statuses.push(status));
 await assert.rejects(sync.save({value:'private'}));assert.equal(sync.dirty,true);assert.deepEqual(statuses,['saving','error']);
 fail=false;await sync.save({value:'private'});assert.equal(sync.dirty,false);assert.equal(statuses.at(-1),'saved');
});
test('stopping a session cannot report saved for the next account',async()=>{
 let release;const statuses=[];
 const sync=createWorkspaceSync(()=>new Promise(resolve=>release=resolve),status=>statuses.push(status));
 const task=sync.save({name:'old'});sync.stop();release();await task;
 assert.deepEqual(statuses,['saving']);await assert.rejects(sync.save({name:'new'}),{code:'account-changed'});
});
test('record serialization excludes account identity, entitlements, server jobs and binary credentials',()=>{
 const state=emptyWorkspace();state.userId='private';state.tier='Plus';state.credits=9999;state.jobs=[{id:'job'}];state.profile.certification={data:'binary'};
 const map=workspaceRecords(state),text=JSON.stringify([...map]);assert.ok(!text.includes('binary'));assert.ok(!text.includes('9999'));assert.ok(!text.includes('"job"'));assert.ok(!text.includes('"userId"'));
});
test('unchanged records do not write; removal produces a recoverable tombstone',()=>{
 const previous=new Map([['clients/c1',{active:true,revision:2,payload:{id:'c1',name:'A'}}]]);
 assert.deepEqual(recordChanges(previous,new Map([['clients/c1',{id:'c1',name:'A'}]])),[]);
 assert.deepEqual(recordChanges(previous,new Map()),[{path:'clients/c1',payload:{id:'c1',name:'A'},active:false}]);
});
