// Firestore stores independent records; no clinical data is written to localStorage.
const safeId=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value);
export function cleanRecord(value){
 if(value===undefined)return null;
 if(typeof value==='number'&&!Number.isFinite(value))throw Object.assign(Error('Invalid number.'),{code:'invalid-record'});
 if(Array.isArray(value))return value.map(cleanRecord);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).filter(([,v])=>v!==undefined).map(([k,v])=>[k,cleanRecord(v)]));
 return value;
}
export function workspaceRecords(state){
 const records=new Map();
 const put=(collection,id,payload)=>{
  if(!safeId(id))throw Object.assign(Error('Invalid record ID.'),{code:'invalid-record'});
  const cleaned=cleanRecord(payload);
  if(new TextEncoder().encode(JSON.stringify(cleaned)).length>700000)throw Object.assign(Error('Record too large.'),{code:'record-too-large'});
  records.set(`${collection}/${id}`,cleaned);
 };
 const profile={...state.profile};delete profile.certification;
 // Files are uploaded separately. Never smuggle binary files into database records.
 const setup={...state.setup};delete setup.certification;
 put('settings','profile',{profile,setup,setupStep:state.setupStep,onboarded:state.onboarded,tourDone:state.tourDone,lastIntakeClientId:state.lastIntakeClientId||null});
 put('settings','automation',{...state.automations,runs:{}});
 for(const [field,collection] of [['clients','clients'],['plans','plans'],['progress','checkins'],['trash','trash'],['activity','activity']])for(const record of state[field]||[])put(collection,record.id,record);
 for(const [id,draft] of Object.entries(state.intakeDrafts||{}))put('assessments',id,{...draft,id});
 for(const record of state.notifications||[])put('notificationReads',record.id,{id:record.id,read:record.read===true});
 return records;
}
export function recordChanges(previous,next){
 const changes=[];
 for(const [path,payload] of next)if(!previous.get(path)?.active||JSON.stringify(cleanRecord(payload))!==JSON.stringify(cleanRecord(previous.get(path)?.payload)))changes.push({path,payload,active:true});
 for(const [path,record] of previous)if(record.active&&!next.has(path))changes.push({path,payload:record.payload,active:false});
 return changes;
}
