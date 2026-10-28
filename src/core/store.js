import {emptyWorkspace} from './workspace-state.js';

// Only appearance preferences are browser-persistent. Workspace records must be
// loaded through an authenticated repository; legacy browser records are not imported.
let theme='light';
try { theme=localStorage.getItem('dietograms-theme')||'light'; } catch {}
export const state=emptyWorkspace(theme);
export function save() {
  try { localStorage.setItem('dietograms-theme',state.theme); return true; }
  catch { return false; }
}
export const now=()=>new Intl.DateTimeFormat('en-CA',{
  timeZone:state.profile.timezone||'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'
}).format(new Date());
export const uid=prefix=>`${prefix}-${crypto.randomUUID()}`;
export const getClient=id=>state.clients.find(client=>client.id===id);
export const getPlan=id=>state.plans.find(plan=>plan.id===id);
export {models} from './generation-tier.js';
export {stages} from './generation.js';
