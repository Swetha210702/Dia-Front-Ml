import {build} from 'vite';
import {writeFile,copyFile} from 'node:fs/promises';
await build();
await writeFile(new URL('../dist/.nojekyll',import.meta.url),'');
for(const name of ['manrope-OFL.txt','dmmono-OFL.txt'])await copyFile(new URL('../public/assets/fonts/'+name,import.meta.url),new URL('../dist/assets/'+name,import.meta.url));
