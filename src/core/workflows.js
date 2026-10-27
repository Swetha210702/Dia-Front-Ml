import {validateIntake,normalizeGoal} from './intake.js';
export const automationDefaults={enabled:false,mode:'remind',clientIds:[],time:'09:00',followups:true,followupDays:14,runs:{}};
export function searchClients(clients,query=''){
 const q=query.trim().toLowerCase();
 const score=c=>c.id.toLowerCase()===q?0:c.id.toLowerCase().startsWith(q)?1:c.name.toLowerCase().startsWith(q)?2:3;
 return clients.filter(c=>`${c.id} ${c.name}`.toLowerCase().includes(q)).sort((a,b)=>score(a)-score(b)||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
}
export function revisionInfo(plans,sourceId){
 const source=plans.find(p=>p.id===sourceId);if(!source)return {version:1};
 let root=source;const seen=new Set();
 while(root.parentId&&!seen.has(root.id)){seen.add(root.id);const parent=plans.find(p=>p.id===root.parentId);if(!parent)break;root=parent}
 const rootId=source.rootPlanId||root.id;
 const family=plans.filter(p=>p.id===rootId||p.rootPlanId===rootId||p.id===source.id||p.parentId===rootId);
 return {parentId:source.id,rootPlanId:rootId,version:Math.max(...family.map(p=>Number(p.version)||1))+1};
}
export function createRevision(plans,source,id,date){
 const copy=structuredClone(source);Object.assign(copy,revisionInfo(plans,source.id),{id,status:'Draft',created:date});delete copy.published;
 return copy;
}
export function localClock(date=new Date(),timezone='Asia/Kolkata'){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));
 return {date:`${parts.year}-${parts.month}-${parts.day}`,month:`${parts.year}-${parts.month}`,time:`${parts.hour}:${parts.minute}`,monthEnd:Number(parts.day)===new Date(Date.UTC(Number(parts.year),Number(parts.month),0)).getUTCDate()};
}
export function nextMonthEnd(config,date=new Date(),timezone='Asia/Kolkata'){
 const clock=localClock(date,timezone);let [year,month]=clock.month.split('-').map(Number);
 if(clock.monthEnd&&clock.time>=config.time){month++;if(month>12){year++;month=1}}
 const day=new Date(Date.UTC(year,month,0)).getUTCDate();return `${year}-${String(month).padStart(2,'0')}-${day} at ${config.time}`;
}
export function dueTriggers(workspace,date=new Date(),force=false){
 const config={...automationDefaults,...workspace.automations};if(!config.enabled)return [];
 const clock=localClock(date,workspace.profile.timezone);const actions=[];
 const selected=workspace.clients.filter(c=>config.clientIds.includes(c.id)&&c.status==='Active');
 for(const client of selected){
  const latest=workspace.progress.filter(p=>p.clientId===client.id&&p.date<=clock.date).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);
  const since=latest?.date||client.joined||clock.date;
  const overdue=Math.floor((Date.parse(clock.date+'T00:00:00Z')-Date.parse(since+'T00:00:00Z'))/86400000);
  const followupKey=`followup:${client.id}:${since}`;
  if(config.followups&&overdue>=config.followupDays&&!config.runs[followupKey])actions.push({type:'followup',key:followupKey,client,overdue});
  const key=`monthly:${client.id}:${clock.month}`;
  if((force||(clock.monthEnd&&clock.time>=config.time))&&!config.runs[key])actions.push({type:config.mode==='generate'?'generate':'reminder',key,client});
 }
 return actions;
}
export function automationInput(workspace,client){
 const previous=workspace.plans.filter(p=>p.clientId===client.id).at(-1);
 // Only the saved client assessment counts as consent for an unattended draft.
 const intake=client.intake;
 if(!intake)return {error:'Complete and save the client questionnaire first.'};
 const errors=validateIntake(intake);if(Object.keys(errors).length)return {error:'The saved questionnaire is incomplete or client agreement is missing.'};
 if(workspace.jobs.some(j=>j.clientId===client.id&&j.status==='Running'))return {error:'A generation is already running for this client.'};
 return {input:{...(previous?.context||{}),...intake,intake:structuredClone(intake),review:true,updateClient:false,name:`${client.name.split(' ')[0]} · monthly review`,days:previous?.days||7,calories:previous?.calories||1800,model:workspace.tier,start:localClock(new Date(),workspace.profile.timezone).date,revisionOf:previous?.id,revisionReason:'Scheduled monthly review',automation:true}};
}
export function practiceAnalysis(workspace,period='all',today=new Date()){
 const cutoff=period==='all'?'0000-01-01':new Date(today.getTime()-Number(period)*86400000).toISOString().slice(0,10);
 const plans=workspace.plans.filter(p=>p.created>=cutoff),checkins=workspace.progress.filter(p=>p.date>=cutoff);
 const countBy=(items,key)=>Object.entries(items.reduce((acc,item)=>{const value=key(item)||'Not specified';acc[value]=(acc[value]||0)+1;return acc},{})).sort((a,b)=>b[1]-a[1]);
 return {plans,checkins,goals:countBy(workspace.clients,c=>normalizeGoal(c.goal)),diets:countBy(workspace.clients,c=>c.diet),statuses:countBy(workspace.clients,c=>c.status),newClients:workspace.clients.filter(c=>c.joined>=cutoff).length,active:workspace.clients.filter(c=>c.status==='Active').length,published:plans.filter(p=>p.status==='Published').length,revisions:plans.filter(p=>p.parentId).length,adherence:checkins.length?Math.round(checkins.reduce((sum,c)=>sum+Number(c.adherence),0)/checkins.length):null,creditsUsed:-workspace.creditHistory.filter(x=>x.date>=cutoff&&(x.amount<0||/refund/i.test(x.description||''))).reduce((sum,x)=>sum+x.amount,0),subscriptionSpend:workspace.invoices.filter(i=>i.status==='Paid'&&i.date>=cutoff).reduce((sum,i)=>sum+i.amount,0)};
}
