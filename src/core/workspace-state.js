import {automationDefaults} from './workflows.js';

export function emptyWorkspace(theme='light') {
  return {
    schemaVersion: 1,
    session: false,
    userId: null,
    workspaceId: null,
    verified: false,
    emailVerified: false,
    onboarded: false,
    profile: {name:'', title:'', email:'', phone:'', company:'', country:'India', timezone:'Asia/Kolkata'},
    setupStep: 0,
    setup: {},
    tourDone: false,
    tier: null,
    credits: 0,
    theme: theme==='dark'?'dark':'light',
    clients: [], plans: [], progress: [], jobs: [], invoices: [], creditHistory: [],
    notifications: [], activity: [], trash: [], intakeDrafts: {},
    automations: structuredClone(automationDefaults)
  };
}
