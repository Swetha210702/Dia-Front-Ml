// Public progress events supplied by the generation service, never inferred from a timer.
export const generationPhases=[
  {title:'Request accepted',detail:'Your assessment has been accepted for generation.'},
  {title:'Checking client details',detail:'Reviewing the supplied questionnaire, routine, preferences and restrictions.'},
  {title:'Preparing dietary requirements',detail:'Preparing the selected targets and dietary requirements.'},
  {title:'Generating meal structure',detail:'Creating meals and portions for practitioner review.'},
  {title:'Formatting the plan',detail:'Preparing the editable report.'},
  {title:'Ready for practitioner review',detail:'The draft is saved. Review all meals and requirements before publishing.'}
];
export const stages=generationPhases.map(phase=>phase.title);
const statuses=new Set(['Running','Completed','Failed','Cancelled']);
export function applyGenerationEvent(job,event){
  if(event.jobId!==job.id||!Number.isInteger(event.sequence)||event.sequence<0)return false;
  if(event.sequence<=(job.sequence??-1))return false;
  if(job.status!=='Running')return false;
  if(!statuses.has(event.status)||!Number.isInteger(event.phase)||event.phase<0||event.phase>=stages.length)return false;
  if(event.phase<job.stage||!Number.isFinite(event.at)||event.at<job.started)return false;
  if(event.status==='Completed'&&(!event.planId||event.phase!==5))return false;
  job.events ||= [];
  job.events.push({phase:event.phase,at:event.at,title:generationPhases[event.phase].title,detail:String(event.detail||generationPhases[event.phase].detail).slice(0,1000)});
  Object.assign(job,{sequence:event.sequence,stage:event.phase,status:event.status,updated:event.at});
  if(event.status==='Completed')job.planId=event.planId;
  if(event.status==='Failed')job.error='Generation could not be completed. Please try again.';
  // Billing service owns credits and settlement; events do not alter the balance.
  return true;
}
export const activityFor=job=>job.events||[];
export function generationProgress(job){
  if(job.status==='Completed'&&job.planId)return 100;
  const phase=Number.isFinite(job.stage)?job.stage:0;
  return Math.max(0,Math.min(95,Math.round(phase/(stages.length-1)*100)));
}
