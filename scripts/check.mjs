import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
function check(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())check(path);else if(path.endsWith('.js')){const result=spawnSync(process.execPath,['--check',path],{stdio:'inherit'});if(result.status)process.exit(result.status)}}}check('src');console.log('All frontend JavaScript syntax checks passed.');
