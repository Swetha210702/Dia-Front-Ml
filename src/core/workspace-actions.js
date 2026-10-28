
// Pure domain transformations. Persistence and authorization belong to the repository.
export function recordChange(workspace,action,entity,label,detail='',at=Date.now()){
 const event={id:`EVENT-${at}-${Math.random().toString(36).slice(2,8)}`,at,action,entity,label,detail};
 (workspace.activity ||= []).push(event);
 return event;
}
export function syncClientDraft(workspace,client,changes){
 const answers=workspace.intakeDrafts?.[client.id]?.answers;
 if(!answers||workspace.intakeDrafts[client.id].step===5)return;
 const map={name:'clientName',age:'age',gender:'gender',height:'height',weight:'weight',goal:'goal',allergies:'allergies',conditions:'medicalHistory'};
 for(const [key,target] of Object.entries(map))if(Object.hasOwn(changes,key))answers[target]=client[key];
 if(Object.hasOwn(changes,'diet'))answers.dietPreference=({Vegetarian:'Veg','Non-vegetarian':'Non veg',Eggitarian:'Egg (eggitarian)'})[client.diet]||'';
 if(Object.hasOwn(changes,'activity'))answers.lifestyle=({Sedentary:'Sedentary','Lightly active':'Moderate','Moderately active':'Moderate',Active:'Active','Very active':'Very active'})[client.activity]||'';
}
export function refreshClientWeight(workspace,clientId){
 const client=workspace.clients.find(c=>c.id===clientId);if(!client)return;
 const latest=workspace.progress.filter(r=>r.clientId===clientId).sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id))).at(-1);
 if(latest)client.weight=latest.weight;
 else if(client.checkinBaselineWeight!==undefined)client.weight=client.checkinBaselineWeight;
}
export function saveCheckin(workspace,record,id){
 const client=workspace.clients.find(c=>c.id===record.clientId);
 if(!client)throw new Error('Choose an existing client.');
 if(record.planId&&!workspace.plans.some(p=>p.id===record.planId&&p.clientId===record.clientId))throw new Error('Choose a plan belonging to this client.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(record.date)||!Number.isFinite(Date.parse(record.date))||new Date(record.date).toISOString().slice(0,10)!==record.date)throw new Error('Enter a valid check-in date.');
 for(const [key,min,max] of [['weight',1,400],['adherence',0,100],['energy',1,5]])if(!Number.isFinite(Number(record[key]))||Number(record[key])<min||Number(record[key])>max)throw new Error('Check the check-in measurements.');
 const previous=workspace.progress.find(r=>r.id===id);
 if(id&&!previous)throw new Error('This check-in is no longer available.');
 if(client.checkinBaselineWeight===undefined)client.checkinBaselineWeight=client.weight;
 const oldClient=previous?.clientId;
 const next={...record,id:id||`CHECK-${Date.now()}-${Math.random().toString(36).slice(2,8)}`};
 for(const key of ['weight','adherence','energy'])next[key]=Number(next[key]);
 if(previous)Object.assign(previous,next);else workspace.progress.push(next);
 if(oldClient)refreshClientWeight(workspace,oldClient);
 refreshClientWeight(workspace,client.id);
 recordChange(workspace,previous?'Updated':'Created','Check-in',client.name,`${next.date} · ${next.weight} kg`);
 return next;
}
export function moveToTrash(workspace,type,id,at=Date.now()){
 const collection={client:'clients',plan:'plans',checkin:'progress'}[type];
 const record=workspace[collection]?.find(r=>r.id===id);
 if(!record)throw new Error('This record is no longer available.');
 if(type==='client'&&workspace.jobs.some(j=>j.clientId===id&&j.status==='Running'))throw new Error('Finish or cancel this client’s running generation first.');
 const entry={id:`TRASH-${at}-${Math.random().toString(36).slice(2,8)}`,type,at,label:record.name||`${record.date} check-in`,record:structuredClone(record)};
 if(type==='client'){
  entry.plans=workspace.plans.filter(p=>p.clientId===id);entry.progress=workspace.progress.filter(p=>p.clientId===id);entry.jobs=workspace.jobs.filter(p=>p.clientId===id);entry.notifications=workspace.notifications.filter(n=>n.clientId===id);entry.intake=workspace.intakeDrafts[id];
  for(const key of ['plans','progress','jobs','notifications'])workspace[key]=workspace[key].filter(r=>r.clientId!==id);
  delete workspace.intakeDrafts[id];
 }else if(type==='plan'){
  // Keep immutable job history and plan links; restore reconnects them by ID.
  entry.label=record.name;
 }
 workspace[collection]=workspace[collection].filter(r=>r.id!==id);
 (workspace.trash ||= []).push(entry);
 if(type==='checkin')refreshClientWeight(workspace,record.clientId);
 recordChange(workspace,'Moved to trash',type,entry.label,'Recoverable from Settings',at);
 return entry;
}
export function restoreFromTrash(workspace,id){
 const entry=workspace.trash?.find(r=>r.id===id);if(!entry)throw new Error('This item is no longer in trash.');
 const collection={client:'clients',plan:'plans',checkin:'progress'}[entry.type];
 if(workspace[collection].some(r=>r.id===entry.record.id))throw new Error('A record with this ID already exists.');
 if(entry.type!=='client'&&!workspace.clients.some(c=>c.id===entry.record.clientId))throw new Error('Restore this client first, then restore this item.');
 workspace[collection].push(entry.record);
 if(entry.type==='client'){
  for(const key of ['plans','progress','jobs','notifications'])for(const record of entry[key]||[])if(!workspace[key].some(r=>r.id===record.id))workspace[key].push(record);
  if(entry.intake)workspace.intakeDrafts[entry.record.id]=entry.intake;
 }
 if(entry.type==='checkin')refreshClientWeight(workspace,entry.record.clientId);
 workspace.trash=workspace.trash.filter(r=>r.id!==id);
 recordChange(workspace,'Restored',entry.type,entry.label);
 return entry;
}
export function nextClientId(workspace){
 const used=new Set([...workspace.clients.map(c=>c.id),...(workspace.trash||[]).filter(t=>t.type==='client').map(t=>t.record.id)]);
 let number=1001;while(used.has(`DIA-${number}`))number++;
 return `DIA-${number}`;
}
