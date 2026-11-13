import fs from 'node:fs';
import path from 'node:path';
const pages=JSON.parse(fs.readFileSync('public/data/pages.json'));
for(const [mode,site] of [['sspai','sspai'],['radiance','radiance']]) {
  const root=path.resolve('dist',mode),index=fs.readFileSync(path.join(root,'index.html'));
  for(const page of pages.filter(p=>p.site===site&&p.route!=='/')){const destination=path.join(root,page.route);fs.mkdirSync(destination,{recursive:true});fs.writeFileSync(path.join(destination,'index.html'),index);}
}
