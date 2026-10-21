import test from 'node:test';
import assert from 'node:assert/strict';
import {recordPhases,activityFor,generationProgress,generationPhases,DEMO_PHASE_MS} from '../src/core/generation.js';
const job=()=>({stage:0,status:'Running',started:1000});
test('resuming a background job retains every phase in order without duplicates',()=>{
 const j=job();recordPhases(j,0,1000);recordPhases(j,4,11000);recordPhases(j,4,11500);
 assert.deepEqual(j.events.map(e=>e.phase),[0,1,2,3,4]);
 assert.deepEqual(j.events.map(e=>e.at),[1000,3500,6000,8500,11000]);
 assert.equal(j.events.at(-1).title,generationPhases[4].title);
});
test('progress reaches 100 only once the report is successfully saved',()=>{
 const j=job();recordPhases(j,5,1000+5*DEMO_PHASE_MS);
 assert.equal(generationProgress(j),95);j.status='Failed';assert.equal(generationProgress(j),95);
 j.status='Completed';assert.equal(generationProgress(j),100);
});
test('existing saved jobs still expose their completed phase history',()=>{
 const j={...job(),stage:3};assert.equal(activityFor(j).length,4);
 assert.equal(activityFor(j)[3].title,generationPhases[3].title);
 assert.equal(j.events,undefined);
});
test('cancellation preserves all prior updates and stops short of completion',()=>{
 const j=job();recordPhases(j,2,6000);j.status='Cancelled';
 assert.equal(generationProgress(j),40);assert.equal(activityFor(j).length,3);
});
