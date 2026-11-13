/** Downstream accounting across the map-renderer and final compositor contexts. */
const parts=new Map<string,{gpu:number;cpu:number;scratch:number}>();
let admit:(gpu:number,scratch:number)=>boolean=()=>true;
export function configureGlassBudget(check:typeof admit){admit=check;}
export function glassMemory(){return {gpuBytes:[...parts.values()].reduce((n,p)=>n+p.gpu,0),scratchBytes:[...parts.values()].reduce((n,p)=>n+p.scratch,0),cpuBytes:[...parts.values()].reduce((n,p)=>n+p.cpu,0),parts:Object.fromEntries(parts)};}
export function reserveGlassMemory(key:string,gpu:number,cpu=0,scratch=0){const current=glassMemory(),total=current.gpuBytes-(parts.get(key)?.gpu??0)+gpu,temporary=current.scratchBytes-(parts.get(key)?.scratch??0)+scratch;if(!admit(total,temporary))throw Error(`Glass resource budget exceeded: ${key}; total=${total}; scratch=${temporary}`);parts.set(key,{gpu,cpu,scratch});}
export function releaseGlassMemory(key:string){parts.delete(key);const m=glassMemory();admit(m.gpuBytes,m.scratchBytes);}
