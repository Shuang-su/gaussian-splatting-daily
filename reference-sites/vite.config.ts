import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig(({ mode }) => ({
  plugins: [{name:'local-reference-review',configureServer(server){
    server.middlewares.use('/__reference-review',(req,res,next)=>{
      const url=(req.url||'/').split('?')[0];
      const match=url.match(/^\/(source|qa)\/([a-z0-9-]+\.(?:jpg|json))$/);
      const file=url==='/'||url==='/index.html'?path.resolve('review/index.html'):match?path.resolve('../.codex-work/references',match[1],match[2]):null;
      if(!file)return next();if(!fs.existsSync(file)){res.statusCode=404;res.end('Not found');return;}
      res.setHeader('Content-Type',file.endsWith('.jpg')?'image/jpeg':file.endsWith('.json')?'application/json':'text/html; charset=utf-8');fs.createReadStream(file).pipe(res);
    });
  }}],
  define: { __REFERENCE_SITE__: JSON.stringify(mode === 'radiance' ? 'radiance' : 'sspai') },
  build: { outDir: `dist/${mode}`, emptyOutDir: true },
  server: { host: '127.0.0.1' },
}));
