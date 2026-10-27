import test from 'node:test';
import assert from 'node:assert/strict';
import {logoFileError,LOGO_MAX_BYTES} from '../src/core/logo-upload.js';
test('logo uploads allow PNG and JPEG images up to the displayed size limit',()=>{for(const type of ['image/png','image/jpeg'])assert.equal(logoFileError({type,size:LOGO_MAX_BYTES}),'')});
test('oversized logos explain the limit instead of silently failing',()=>{assert.match(logoFileError({type:'image/png',size:LOGO_MAX_BYTES+1}),/1 MB/)});
test('unsupported files and empty images are rejected before replacing a logo',()=>{assert.match(logoFileError({type:'image/svg+xml',size:100}),/PNG or JPG/);assert.match(logoFileError({type:'image/png',size:0}),/empty/)});
test('cancelling a file selection does not produce an upload error',()=>{assert.equal(logoFileError(null),'')});
