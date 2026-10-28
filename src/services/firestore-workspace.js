import {emptyWorkspace} from '../core/workspace-state.js';
import {workspaceRecords,recordChanges} from './workspace-records.js';
const writable=['settings','clients','assessments','plans','checkins','trash','activity','notificationReads'];
const readOnly={generations:'jobs',invoices:'invoices',creditLedger:'creditHistory',notifications:'notifications'};
export function createFirestoreWorkspace(db,sdk,getAccount){
 let identity=null,baseline=new Map(),loaded=false;
 const access=()=>{
  const account=getAccount();
  if(!identity||account?.uid!==identity)throw Object.assign(Error('Account changed.'),{code:'account-changed'});
  return identity;
 };
 return {
  async loadWorkspace(account){
   identity=account.uid;loaded=false;baseline=new Map();
   const owner=access(),root=sdk.doc(db,'workspaces',owner);
   await sdk.runTransaction(db,async tx=>{
    access();const existing=await tx.get(root);
    if(!existing.exists())tx.set(root,{ownerId:owner,schemaVersion:1,createdAt:sdk.serverTimestamp()});
    else if(existing.data().ownerId!==owner)throw Object.assign(Error('Permission denied.'),{code:'permission-denied'});
   });
   access();
   const state=emptyWorkspace();
   const groups=await Promise.all([...writable,...Object.keys(readOnly)].map(async name=>[name,await sdk.getDocs(sdk.collection(db,'workspaces',owner,name))]));
   const nextBaseline=new Map();
   for(const [name,snapshot] of groups){
    if(readOnly[name]){state[readOnly[name]]=snapshot.docs.map(d=>({...d.data().payload,id:d.id}));continue}
    for(const doc of snapshot.docs){const value=doc.data();nextBaseline.set(`${name}/${doc.id}`,value);if(!value.active)continue;
     const payload=structuredClone(value.payload);
     if(name==='settings'&&doc.id==='profile')Object.assign(state,payload);
     else if(name==='settings'&&doc.id==='automation')state.automations=payload;
     else if(name==='assessments')state.intakeDrafts[doc.id]=payload;
     else if(name==='notificationReads')continue;
     else if(name!=='settings')state[({clients:'clients',plans:'plans',checkins:'progress',trash:'trash',activity:'activity'})[name]].push(payload);
    }
   }
   for(const notification of state.notifications)notification.read=nextBaseline.get(`notificationReads/${notification.id}`)?.payload.read===true;
   const entitlement=await sdk.getDoc(sdk.doc(db,'workspaces',owner,'entitlements','current'));
   if(entitlement.exists()){const e=entitlement.data();state.tier=['Standard','Pro','Plus'].includes(e.tier)?e.tier:null;state.credits=Number.isSafeInteger(e.credits)&&e.credits>=0?e.credits:0}
   access();baseline=nextBaseline;loaded=true;
   state.workspaceId=owner;state.verified=true;
   return state;
  },
  async saveWorkspace(state){
   const owner=access();if(!loaded)throw Object.assign(Error('Load first.'),{code:'account-changed'});
   const next=workspaceRecords(state),changes=recordChanges(baseline,next);
   if(!changes.length)return;
   if(changes.length>150)throw Object.assign(Error('Too many changes.'),{code:'record-too-large'});
   const committed=await sdk.runTransaction(db,async tx=>{
    access();
    const refs=changes.map(change=>sdk.doc(db,'workspaces',owner,...change.path.split('/')));
    const snapshots=await Promise.all(refs.map(ref=>tx.get(ref)));
    access();
    for(let i=0;i<changes.length;i++){
     const expected=baseline.get(changes[i].path)?.revision||0;
     if((snapshots[i].data()?.revision||0)!==expected)throw Object.assign(Error('Newer changes exist.'),{code:'workspace-conflict'});
    }
    return changes.map((change,i)=>{
     const existing=snapshots[i].data();
     const record={workspaceId:owner,id:change.path.split('/')[1],schemaVersion:1,createdBy:existing?.createdBy||owner,createdAt:existing?.createdAt||sdk.serverTimestamp(),updatedAt:sdk.serverTimestamp(),revision:(existing?.revision||0)+1,active:change.active,payload:change.payload};
     tx.set(refs[i],record);return [change.path,record];
    });
   });
   access();for(const [path,record] of committed)baseline.set(path,record);
  }
 };
}
export async function initializeFirestoreWorkspace(){
 const [{getApp},{getAuth},sdk]=await Promise.all([import('firebase/app'),import('firebase/auth'),import('firebase/firestore')]);
 const app=getApp();
 // In-memory cache: clinical records are not persisted to this browser's disk.
 const db=sdk.initializeFirestore(app,{localCache:sdk.memoryLocalCache()});
 return createFirestoreWorkspace(db,sdk,()=>getAuth(app).currentUser);
}
