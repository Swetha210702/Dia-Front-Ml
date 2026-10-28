import {defineConfig} from 'vite';
export default defineConfig({
  base:'./',
  publicDir:false,
  server:{host:'127.0.0.1',port:5173,strictPort:true,watch:{usePolling:true,interval:300},fs:{deny:['.env','.env.*','**/.git/**','**/database/**','**/docs/**','**/*service-account*.json']}},
  build:{outDir:'dist',emptyOutDir:true,sourcemap:false}
});
