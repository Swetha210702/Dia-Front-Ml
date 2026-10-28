// Workspace ID comes from authenticated membership, never a query parameter.
export const collections=Object.freeze({
  members:{authority:'server',retention:'membership'},
  clients:{authority:'practitioner',retention:'soft-delete'},
  assessments:{authority:'practitioner',retention:'versioned'},
  plans:{authority:'practitioner',retention:'versioned'},
  generations:{authority:'server',retention:'append-events'},
  checkins:{authority:'practitioner',retention:'soft-delete'},
  subscriptions:{authority:'server',retention:'billing-policy'},
  creditLedger:{authority:'server',retention:'append-only'},
  invoices:{authority:'server',retention:'billing-policy'},
  activity:{authority:'server',retention:'append-only'},
  notifications:{authority:'server',retention:'read-status'},
  automations:{authority:'practitioner',retention:'configuration'},
  files:{authority:'server',retention:'storage-reference'}
});
const validId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(id);
export function documentPath(workspaceId,collection,id){
  if(!validId(workspaceId)||!Object.hasOwn(collections,collection)||!validId(id))throw new TypeError('Invalid workspace record path.');
  return `workspaces/${workspaceId}/${collection}/${id}`;
}
export function storagePath(workspaceId,kind,id){
  if(!validId(workspaceId)||!validId(id)||!['logos','certifications','reports'].includes(kind))throw new TypeError('Invalid file path.');
  return `workspaces/${workspaceId}/${kind}/${id}`;
}
