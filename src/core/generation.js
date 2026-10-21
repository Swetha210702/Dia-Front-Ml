// Public operational updates only. Replace the demo timer with backend events when connected.
export const generationPhases = [
  { title: 'Request accepted', detail: 'Your assessment is queued for this demo generation.' },
  { title: 'Checking client details', detail: 'Preparing the questionnaire, routine, preferences and restrictions.' },
  { title: 'Preparing dietary requirements', detail: 'Organising your selected calorie target and meal preferences for the sample plan.' },
  { title: 'Generating meal structure', detail: 'Building a sample daily meal schedule from the demo meal library.' },
  { title: 'Formatting the plan', detail: 'Assembling meal portions, notes and an editable report draft.' },
  { title: 'Ready for practitioner review', detail: 'The sample draft is saved. Review all meals and clinical requirements before publishing.' }
];
export const stages = generationPhases.map(phase => phase.title);
export const DEMO_PHASE_MS = 2500;
export function recordPhases(job, through, time = Date.now()) {
  job.events ||= [];
  for (let phase = 0; phase <= Math.min(through, stages.length - 1); phase++) {
    if (!job.events.some(event => event.phase === phase)) {
      job.events.push({ phase, at: Math.min(time, job.started + phase * DEMO_PHASE_MS), ...generationPhases[phase] });
    }
  }
  job.stage = through;
  job.updated = time;
}
export function activityFor(job) {
  if (job.events?.length) return job.events;
  // Older saved demo jobs have phase indexes but no activity records.
  return generationPhases.slice(0, Math.min(job.stage + 1, stages.length)).map((phase, index) => ({
    phase: index, at: job.started + index * DEMO_PHASE_MS, ...phase
  }));
}
export function generationProgress(job) {
  if (job.status === 'Completed') return 100;
  return Math.max(0, Math.min(95, Math.round(job.stage / (stages.length - 1) * 100)));
}
