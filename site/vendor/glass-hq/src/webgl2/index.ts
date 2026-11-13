import {reserveGlassMemory,releaseGlassMemory} from '../dom/resource-budget';
import { outlineSegments } from '../core/concentric';
import { shapeSegments } from '../core/shape';
import { mapScale, maxAtlasRows, type MapGeometry } from '../gpu/geometry';
type MapPixels = { width: number; height: number; pixels: Uint8Array; duration: number };
import fragment from './maps-fragment';

export type MaterialBackend = {readonly warmed:Promise<void>;render(g:MapGeometry):Promise<MapPixels>;dispose():void};
type Request = {g:MapGeometry;columns:number;rows:number;dpr:number;segments:number[][];started:number;resolve:(p:MapPixels)=>void;reject:(e:Error)=>void};
type Slot = {texture:WebGLTexture;fbo:WebGLFramebuffer;pbo:WebGLBuffer;busy:boolean;width:number;height:number;sync:WebGLSync|null};
const vertex=`#version 300 es
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0,1);}`;

/** Only material fields are read back. The live cup is never captured. */
export class WebGL2MaterialRenderer implements MaterialBackend {
  readonly warmed:Promise<void>;
  readonly canvas=document.createElement('canvas');
  private gl:WebGL2RenderingContext;
  private program:WebGLProgram;
  private outline:WebGLTexture;
  private slots:Slot[]=[];
  private queue:Request[]=[];
  private pending=new Set<Request>();
  private dead=false;
  private limit:number;
  private lost=(event:Event)=>{event.preventDefault();this.dispose();this.onLost?.();};
  constructor(private onLost?:()=>void){
    const gl=this.canvas.getContext('webgl2',{alpha:true,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:false,depth:false,stencil:false});
    if(!gl)throw new Error('WebGL2 material renderer unavailable');
    this.gl=gl;
    this.limit=Math.min(maxAtlasRows,gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
    const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error('Glass shader: '+error);}return shader;};
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram()!;
    gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Glass program: '+gl.getProgramInfoLog(program));
    this.program=program;gl.useProgram(program);gl.disable(gl.DITHER);gl.disable(gl.BLEND);gl.disable(gl.DEPTH_TEST);
    reserveGlassMemory('map-renderer',64*64*16);
    this.outline=gl.createTexture()!;gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.outline);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA32F,64,64,0,gl.RGBA,gl.FLOAT,null);
    gl.uniform1i(gl.getUniformLocation(program,'outlines'),0);
    this.canvas.addEventListener('webglcontextlost',this.lost);
    this.warmed=this.render({width:4,height:4,radius:2,dpr:1}).then(()=>undefined);
    void this.warmed.catch(() => {});
  }
  render(g:MapGeometry):Promise<MapPixels>{
    return new Promise((resolve,reject)=>{
      if(this.dead){reject(new Error('Glass renderer disposed'));return;}
      try {
        if(![g.width,g.height,g.dpr??1].every(Number.isFinite)||g.width<=0||g.height<=0)throw new RangeError('Glass geometry must have positive, finite dimensions.');
        const dpr=mapScale(g),columns=Math.ceil((g.width+4)*dpr),rows=Math.ceil((g.height+4)*dpr);
        const {segments}=g.outline?outlineSegments(g.outline):shapeSegments(g.width,g.height,g.radius);
        if(columns>Math.min(4096,this.limit)||rows*2>this.limit||segments.length>4096)throw new RangeError('Glass map exceeds WebGL2 atlas limits');
        const request={g,columns,rows,dpr,segments,started:performance.now(),resolve,reject};
        this.pending.add(request);this.queue.push(request);
        if(this.queue.length===1)queueMicrotask(()=>this.flush());
      }catch(e){reject(e);}
    });
  }
  private flush(){
    const requests=this.queue;this.queue=[];
    let batch:Request[]=[],segments=0,rows=0;
    for(const request of requests){
      if(batch.length&&(batch.length===32||segments+request.segments.length>4096||rows+request.rows*2>this.limit)){void this.draw(batch);batch=[];segments=rows=0;}
      batch.push(request);segments+=request.segments.length;rows+=request.rows*2;
    }
    if(batch.length)void this.draw(batch);
  }
  private slot(width:number,height:number){
    const gl=this.gl;let slot=this.slots.find(s=>!s.busy);
    if(!slot){slot={texture:gl.createTexture()!,fbo:gl.createFramebuffer()!,pbo:gl.createBuffer()!,busy:false,width:0,height:0,sync:null};this.slots.push(slot);}
    const scratch=this.slots.reduce((n,s)=>n+(s===slot?width*height:s.width*s.height)*8,0);reserveGlassMemory('map-renderer',64*64*16+scratch,0,scratch);
    slot.busy=true;
    gl.bindFramebuffer(gl.FRAMEBUFFER,slot.fbo);
    if(slot.width!==width||slot.height!==height){
      gl.bindTexture(gl.TEXTURE_2D,slot.texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,slot.texture,0);slot.width=width;slot.height=height;
    }
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Glass framebuffer incomplete');
    return slot;
  }
  private async draw(requests:Request[]){
    let slot:Slot|undefined;
    try {
      if(this.dead)throw new Error('Glass renderer disposed');
      const gl=this.gl,width=Math.max(...requests.map(s=>s.columns)),height=requests.reduce((n,s)=>n+s.rows*2,0);
      const entries=new Float32Array(96*4),segments=new Float32Array(4096*4);let row=0,start=0;
      const bands=requests.map((s,i)=>{const band=row;entries.set([s.g.width,s.g.height,row,s.rows,s.columns,s.dpr,s.g.appearance==='dark'?1:0,s.g.outline?0:1,start,s.segments.length,0,0],i*12);for(const segment of s.segments)segments.set(segment,start++*4);row+=s.rows*2;return band;});
      slot=this.slot(width,height);
      gl.useProgram(this.program);gl.viewport(0,0,width,height);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.outline);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,64,64,gl.RGBA,gl.FLOAT,segments);
      gl.uniform4fv(gl.getUniformLocation(this.program,'shapes[0]'),entries);gl.uniform1i(gl.getUniformLocation(this.program,'shapeCount'),requests.length);gl.uniform1f(gl.getUniformLocation(this.program,'atlasHeight'),height);
      gl.drawArrays(gl.TRIANGLES,0,3);
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER,slot.pbo);gl.bufferData(gl.PIXEL_PACK_BUFFER,width*height*4,gl.STREAM_READ);
      gl.readPixels(0,0,width,height,gl.RGBA,gl.UNSIGNED_BYTE,0);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
      slot.sync=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);if(!slot.sync)throw new Error('Glass readback fence unavailable');gl.flush();
      const deadline=performance.now()+15000;
      while(true){
        if(this.dead||gl.isContextLost())throw new Error('Glass context lost');
        const status=gl.clientWaitSync(slot.sync,0,0);
        if(status===gl.WAIT_FAILED)throw new Error('Glass readback failed');
        if(status!==gl.TIMEOUT_EXPIRED)break;
        if(performance.now()>deadline)throw new Error('Glass readback timed out');
        await new Promise(r=>setTimeout(r,4));
      }
      const atlas=new Uint8Array(width*height*4);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,slot.pbo);gl.getBufferSubData(gl.PIXEL_PACK_BUFFER,0,atlas);gl.bindBuffer(gl.PIXEL_PACK_BUFFER,null);
      requests.forEach((s,i)=>{const pixels=new Uint8Array(s.columns*s.rows*2*4);for(let y=0;y<s.rows*2;y++){const from=(height-1-bands[i]-y)*width*4;pixels.set(atlas.subarray(from,from+s.columns*4),y*s.columns*4);}s.resolve({width:s.columns,height:s.rows,pixels,duration:performance.now()-s.started});});
    }catch(e){requests.forEach(s=>s.reject(e instanceof Error?e:new Error(String(e))));}
    finally{requests.forEach(s=>this.pending.delete(s));if(slot){if(slot.sync)this.gl.deleteSync(slot.sync);slot.sync=null;slot.busy=false;this.gl.deleteTexture(slot.texture);this.gl.deleteFramebuffer(slot.fbo);this.gl.deleteBuffer(slot.pbo);this.slots=this.slots.filter(s=>s!==slot);if(!this.dead){const scratch=this.slots.reduce((n,s)=>n+s.width*s.height*8,0);reserveGlassMemory('map-renderer',64*64*16+scratch,0,scratch);}}}
  }
  dispose(){
    if(this.dead)return;this.dead=true;this.queue=[];
    for(const request of this.pending)request.reject(new Error('Glass renderer disposed or context lost'));this.pending.clear();
    const gl=this.gl;for(const s of this.slots){gl.deleteTexture(s.texture);gl.deleteFramebuffer(s.fbo);gl.deleteBuffer(s.pbo);if(s.sync)gl.deleteSync(s.sync);s.sync=null;}
    this.slots=[];releaseGlassMemory('map-renderer');gl.deleteTexture(this.outline);gl.deleteProgram(this.program);this.canvas.removeEventListener('webglcontextlost',this.lost);
  }
}
let renderer:Promise<WebGL2MaterialRenderer>|undefined;
export function getMaterialRenderer(){return renderer??=Promise.resolve().then(()=>new WebGL2MaterialRenderer(()=>{renderer=undefined;})).catch(e=>{renderer=undefined;throw e;});}
export async function disposeMaterialRenderer(){const current=renderer;renderer=undefined;if(current)(await current).dispose();}
