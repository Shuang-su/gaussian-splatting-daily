import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'..');
const evidence=path.resolve(root,'../.codex-work/references');
const pages=JSON.parse(fs.readFileSync(path.join(root,'public/data/pages.json')));
const widths=[375,390,430,768,1024,1440],matrix=[];
for(const page of pages)for(const width of widths){
  const key=`${page.id}-${width}`;
  const sourceFile=path.join(evidence,'source',key+'.json');
  const source=JSON.parse(fs.readFileSync(sourceFile));
  const actualFile=path.join(evidence,'qa',key+'.json');
  const actual=JSON.parse(fs.readFileSync(actualFile));
  // Some DOM adapters expose location.href but omit location.origin. Compare actual URLs here.
  actual.external=actual.external.filter(u=>new URL(u).origin!==new URL(actual.url).origin);
  fs.writeFileSync(actualFile,JSON.stringify(actual,null,2));
  const screenshots={};
  for(const kind of ['source','qa']){
    const file=path.join(evidence,kind,key+'.jpg'),bytes=fs.readFileSync(file),meta=await sharp(bytes).metadata();
    screenshots[kind]={file:`${kind}/${key}.jpg`,width:meta.width,height:meta.height,sha256:createHash('sha256').update(bytes).digest('hex')};
    if(meta.width!==width)throw Error('Screenshot width mismatch: '+file);
    if([390,1440].includes(width)&&meta.height!==(kind==='source'?source.layout.scrollHeight:actual.height))throw Error('Full-page height mismatch: '+file);
  }
  matrix.push({page:page.id,sourceUrl:page.sourceUrl,width,sourceHeight:source.layout.scrollHeight,localHeight:actual.height,heightDifference:actual.height-source.layout.scrollHeight,overflow:actual.scrollWidth>width,brokenImages:actual.images.filter(i=>i.complete&&!i.w).length,pendingImages:actual.images.filter(i=>!i.complete).length,externalResources:actual.external,sourceCapturedAt:source.capturedAt||fs.statSync(sourceFile).mtime.toISOString(),localCapturedAt:actual.capturedAt||fs.statSync(actualFile).mtime.toISOString(),fullPage:[390,1440].includes(width),screenshots});
}
const report={generatedAt:new Date().toISOString(),baseline:'d0b4ebba2e792150b72f5ef9b9a66b648c783a5b',browser:'Codex in-app browser on macOS',matrix,physicalDeviceTests:false,pinchSimulation:'Unsupported by the browser CDP adapter; not verified'};
fs.writeFileSync(path.join(evidence,'qa/layout-matrix.json'),JSON.stringify(report,null,2));
fs.writeFileSync(path.join(root,'docs/layout-results.json'),JSON.stringify(report,null,2));
const files=fs.readdirSync(path.join(evidence,'source')).filter(f=>f.endsWith('.json')).flatMap(file=>{const value=JSON.parse(fs.readFileSync(path.join(evidence,'source',file)));if(!value.url||!value.html)return[];return[{file:'source/'+file,url:value.url,capturedAt:value.capturedAt||fs.statSync(path.join(evidence,'source',file)).mtime.toISOString(),htmlLength:value.html.length,htmlTruncated:/\[truncated\]/i.test(value.html),screenshot:fs.existsSync(path.join(evidence,'source',file.replace('.json','.jpg')))?'source/'+file.replace('.json','.jpg'):null}];});
fs.writeFileSync(path.join(evidence,'index.json'),JSON.stringify({generatedAt:new Date().toISOString(),files},null,2));
const failures=matrix.filter(m=>m.overflow||m.brokenImages||m.externalResources.length);
console.log(JSON.stringify({cases:matrix.length,fullPagePairs:matrix.filter(m=>m.fullPage).length,failures:failures.length,pendingImages:matrix.reduce((n,m)=>n+m.pendingImages,0),heightDifferences:matrix.filter(m=>m.heightDifference).map(m=>({page:m.page,width:m.width,difference:m.heightDifference}))},null,2));
if(failures.length)process.exitCode=1;
