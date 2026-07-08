// Hero « liquid chrome » — raymarching de metaballs irisées en WebGL brut.
// Interactif : le curseur attire une langue de matière, le clic-glissé lance
// la rotation avec inertie, le clic déclenche un pulse élastique.
// (Rendu léger et autonome — pas besoin de Three.js pour cette surface.)

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uRot;
uniform vec2 uCursor; uniform float uGrab; uniform float uPulse;
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}
float map(vec3 p){
  vec3 q=p; q.xy*=rot(uRot.x); q.yz*=rot(uRot.y);
  float t=uTime*.6; float infl=uPulse*.30; float d=1e5;
  for(int i=0;i<6;i++){float fi=float(i);
    vec3 o=vec3(sin(t+fi*1.7)*.85, cos(t*.9+fi*2.1)*.8, sin(t*1.1+fi*.8)*.7);
    d=smin(d,length(q-o)-(.52+infl),.55);}
  vec3 cw=vec3(uCursor.x*1.7, uCursor.y*1.0, .45);
  float dc=length(p-cw)-(.30+.16*uGrab+infl*.5);
  d=smin(d,dc,.5+.35*uGrab);
  return d;
}
vec3 nrm(vec3 p){vec2 e=vec2(.0012,0.);
  return normalize(vec3(map(p+e.xyy)-map(p-e.xyy),map(p+e.yxy)-map(p-e.yxy),map(p+e.yyx)-map(p-e.yyx)));}
vec3 pal(float t){return .5+.5*cos(6.2831*(vec3(.0,.33,.67)+t));}
void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  vec3 ro=vec3(0.,0.,3.3), rd=normalize(vec3(uv,-1.45));
  float t=0.; vec3 p; bool hit=false;
  for(int i=0;i<96;i++){p=ro+rd*t;float d=map(p);
    if(d<.001){hit=true;break;} if(t>9.)break; t+=d;}
  vec3 col=vec3(.02,.023,.038);
  col+=pal(uv.y*.4+uTime*.02)*.015;
  if(hit){
    vec3 n=nrm(p), v=-rd;
    float fres=pow(1.-max(dot(n,v),0.),2.6);
    float diff=max(dot(n,normalize(vec3(.7,.9,.5))),0.);
    vec3 base=pal(dot(reflect(-v,n),vec3(0.,1.,0.))*.35 + uTime*.04 + p.y*.12 + uPulse*.4);
    col=base*(.28+.72*diff)+fres*pal(uTime*.08+.55)*1.25;
    col+=pow(diff,20.)*.7;
    col+=uPulse*pal(uTime*.1+.2)*.5;
  }
  col*=1.-.28*length(uv);
  col=pow(max(col,0.),vec3(.86));
  gl_FragColor=vec4(col,1.);
}`;

export function initLiquid(canvas, { reducedMotion = false, onGrabStart, onGrabEnd } = {}) {
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    canvas.style.background = 'radial-gradient(60% 60% at 60% 40%,#1a2340,#05060a)';
    return;
  }

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uTime = U('uTime'), uRot = U('uRot'),
        uCursor = U('uCursor'), uGrab = U('uGrab'), uPulse = U('uPulse');

  const DPR = Math.min(window.devicePixelRatio || 1, 1.6);
  const resize = () => {
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  window.addEventListener('resize', resize);

  // état d'interaction
  let rotx = 0, roty = 0.2, velx = 0, vely = 0;
  let down = false, moved = 0, lx = 0, ly = 0;
  let tcx = 0, tcy = 0, ccx = 0, ccy = 0, grab = 0, clickT = -10;

  const hero = document.getElementById('top');

  window.addEventListener('mousemove', (e) => {
    tcx = (e.clientX / window.innerWidth - 0.5) * 2;
    tcy = -(e.clientY / window.innerHeight - 0.5) * 2;
    if (down) {
      const dx = e.clientX - lx, dy = e.clientY - ly;
      velx += dx * 0.004; vely += dy * 0.004;
      moved += Math.abs(dx) + Math.abs(dy);
      lx = e.clientX; ly = e.clientY;
    }
  });

  const press = (cx, cy) => { down = true; moved = 0; lx = cx; ly = cy; onGrabStart?.(); };
  const release = () => {
    if (!down) return;
    down = false;
    if (moved < 7) clickT = performance.now() / 1000;
    onGrabEnd?.();
  };
  hero?.addEventListener('mousedown', (e) => press(e.clientX, e.clientY));
  window.addEventListener('mouseup', release);
  hero?.addEventListener('touchstart', (e) => press(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  window.addEventListener('touchend', release);
  hero?.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    tcx = (t.clientX / window.innerWidth - 0.5) * 2;
    tcy = -(t.clientY / window.innerHeight - 0.5) * 2;
    if (down) { const dx = t.clientX - lx, dy = t.clientY - ly; velx += dx * 0.004; vely += dy * 0.004; lx = t.clientX; ly = t.clientY; }
  }, { passive: true });

  const t0 = performance.now();
  const frame = (now) => {
    const time = (now - t0) / 1000;
    rotx += velx; roty += vely; velx *= 0.94; vely *= 0.94;
    if (!reducedMotion) rotx += 0.0016;
    grab += ((down ? 1 : 0) - grab) * 0.12;
    ccx += (tcx - ccx) * 0.12; ccy += (tcy - ccy) * 0.12;
    const dt = time - clickT;
    const pulse = dt < 1.4 ? Math.exp(-4.5 * dt) * Math.cos(dt * 9.0) : 0;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reducedMotion ? 2.0 : time);
    gl.uniform2f(uRot, rotx, roty);
    gl.uniform2f(uCursor, ccx, ccy);
    gl.uniform1f(uGrab, grab);
    gl.uniform1f(uPulse, Math.max(0, pulse));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
