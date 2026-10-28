// Serialize cloud writes and retain failed work for an explicit retry. A later
// snapshot always includes earlier edits; the UI never labels a failed write saved.
export function createWorkspaceSync(write,onStatus=()=>{}){
 let pending=null,running=null,dirty=false,stopped=false;
 async function drain(){
  onStatus('saving');
  try{
   while(pending&&!stopped){const current=pending;pending=null;await write(current)}
   if(!stopped){dirty=false;onStatus('saved')}
  }catch(error){dirty=true;if(!stopped)onStatus('error',error);throw error}
  finally{running=null}
 }
 return {
  save(snapshot){if(stopped)return Promise.reject(Object.assign(Error('Account changed.'),{code:'account-changed'}));pending=structuredClone(snapshot);dirty=true;return running||(running=drain())},
  flush(){return running||Promise.resolve()},
  get dirty(){return dirty},
  stop(){stopped=true;pending=null}
 };
}
