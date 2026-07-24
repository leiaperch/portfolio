// Hero « galaxie » — rendu volumétrique émissif d'une galaxie spirale en WebGL
// brut. Interactif : clic-glissé fait pivoter le disque (yaw/pitch avec inertie),
// la souris ajoute une légère parallaxe, le disque tourne lentement tout seul.
// Autonome, calé sur la taille du canvas hôte (pas plein écran).

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision highp float;
uniform vec2 uRes; uniform float uSpin; uniform vec2 uRot; uniform vec2 uPar;
#define ARMS 2.0
#define WIND 4.3

float hash21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }

// densité + couleur émissive de la galaxie à la position monde pos
void galaxy(vec3 pos, out float dens, out vec3 emit){
  float r = length(pos.xz);
  float ang = atan(pos.z, pos.x);
  float a = ang*ARMS - WIND*log(r+0.05) + uSpin;
  float arm = 0.5+0.5*cos(a);
  arm = pow(arm, 3.6);
  float streak = 0.6 + 0.4*(0.5+0.5*cos(a*2.0 + 1.3));   // sur-structure fine
  arm *= streak;
  float armField = arm * smoothstep(0.05,0.28,r) * smoothstep(1.5,0.34,r);
  float halo = smoothstep(1.75,0.1,r) * exp(-r*1.8);      // voile diffus léger
  float bulge = exp(-r*r*13.0);
  // scintillement le long des bras (amas d'étoiles jeunes)
  float spk = hash21(floor(vec2(ang*30.0, r*68.0) + floor(uSpin*4.0)));
  float glint = smoothstep(0.9,1.0,spk) * armField * 5.0;
  dens = bulge*2.7 + halo*0.14 + armField*1.75 + glint;
  // épaisseur : bulbe épais, disque fin
  float thick = mix(0.12, 0.4, bulge);
  dens *= exp(-(pos.y*pos.y)/(thick*thick));
  // couleur : bras alternant bleu/rose, voile bleuté, coeur chaud
  vec3 armCol = mix(vec3(0.45,0.62,1.15), vec3(1.2,0.55,0.82), 0.5+0.5*sin(a*1.7));
  vec3 c = mix(vec3(0.4,0.55,1.0), armCol, clamp(arm*1.4,0.0,1.0));
  c = mix(c, vec3(1.25,1.02,0.78), smoothstep(0.0,0.85,bulge));  // coeur doré chaud
  emit = c;
}

// fond étoilé selon la direction du rayon
vec3 stars(vec3 rd){
  vec3 col = vec3(0.008,0.01,0.018);
  vec2 uv = vec2(atan(rd.z,rd.x), asin(clamp(rd.y,-1.0,1.0)));
  for(int k=0;k<2;k++){
    float sc = 60.0 + float(k)*130.0;
    vec2 g = uv*sc; vec2 id = floor(g);
    float h = hash21(id + float(k)*17.0);
    float s = smoothstep(0.992,1.0,h);
    if(s>0.0){
      vec2 f = fract(g)-0.5;
      float d = exp(-dot(f,f)*80.0);
      col += s*d*mix(vec3(0.7,0.8,1.0),vec3(1.0,0.9,0.75),hash21(id*1.7))*1.4;
    }
  }
  return col;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes)/uRes.y;
  float yaw = uRot.x + uPar.x*0.18;
  float pitch = clamp(uRot.y + uPar.y*0.12, -1.5, 1.5);
  float dist = 3.35;
  vec3 ro = dist*vec3(sin(yaw)*cos(pitch), sin(pitch), cos(yaw)*cos(pitch));
  vec3 fw = normalize(-ro);
  vec3 rt = normalize(cross(vec3(0.0,1.0,0.0), fw));
  vec3 up = cross(fw, rt);
  vec3 rd = normalize(uv.x*rt + uv.y*up + fw*1.7);

  vec3 col = stars(rd);
  // marche volumétrique émissive autour de l'origine
  float tn = dist-2.4, tf = dist+2.4;
  const float N = 48.0;
  float jit = hash21(gl_FragCoord.xy);
  float step = (tf-tn)/N;
  vec3 acc = vec3(0.0);
  for(int i=0;i<48;i++){
    float tt = tn + (float(i)+jit)*step;
    vec3 pos = ro + rd*tt;
    if(length(pos)>2.6) continue;
    float dens; vec3 emit;
    galaxy(pos, dens, emit);
    acc += emit*dens*step;
  }
  col += acc*1.35;

  col *= 1.0 - 0.32*dot(uv,uv);              // vignette
  col = vec3(1.0) - exp(-col*1.45);          // tone map
  col = pow(max(col,0.0), vec3(0.88));
  gl_FragColor = vec4(col,1.0);
}`;

export function createGalaxyScene(canvas, { reducedMotion = false } = {}) {
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    canvas.style.background = 'radial-gradient(60% 60% at 50% 45%,#2a2036,#05060a)';
    return { dispose() {}, pause() {}, resume() {} };
  }

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = (n) => gl.getUniformLocation(prog, n);
  const uRes = U('uRes'), uSpin = U('uSpin'), uRot = U('uRot'), uPar = U('uPar');

  const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  const resize = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 800;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 600;
    canvas.width = Math.max(2, Math.round(w * DPR));
    canvas.height = Math.max(2, Math.round(h * DPR));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // état d'interaction : yaw/pitch avec inertie, parallaxe souris
  let yaw = 0.5, pitch = -0.52, vyaw = 0, vpitch = 0;
  let down = false, lx = 0, ly = 0;
  let parx = 0, pary = 0, tparx = 0, tpary = 0;

  const press = (x, y) => { down = true; lx = x; ly = y; canvas.classList.add('grabbing'); };
  const release = () => { down = false; canvas.classList.remove('grabbing'); };
  const move = (x, y, inside) => {
    if (down) {
      vyaw += (x - lx) * 0.006; vpitch += (y - ly) * 0.006;
      lx = x; ly = y;
    }
    if (inside) {
      const rct = canvas.getBoundingClientRect();
      tparx = ((x - rct.left) / rct.width - 0.5) * 2;
      tpary = -((y - rct.top) / rct.height - 0.5) * 2;
    }
  };

  const onDown = (e) => { press(e.clientX, e.clientY); };
  const onMove = (e) => { move(e.clientX, e.clientY, true); };
  const onUp = () => release();
  const onTStart = (e) => press(e.touches[0].clientX, e.touches[0].clientY);
  const onTMove = (e) => { const t = e.touches[0]; move(t.clientX, t.clientY, true); };
  canvas.addEventListener('mousedown', onDown);
  canvas.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onTStart, { passive: true });
  canvas.addEventListener('touchmove', onTMove, { passive: true });
  window.addEventListener('touchend', onUp);

  const t0 = performance.now();
  let raf = 0, wantRun = true;
  const active = () => wantRun && !document.hidden;
  const frame = (now) => {
    if (!active()) { raf = 0; return; }
    const time = (now - t0) / 1000;
    yaw += vyaw; pitch += vpitch; vyaw *= 0.93; vpitch *= 0.93;
    if (!down && !reducedMotion) yaw += 0.0012;      // dérive lente
    pitch = Math.max(-1.5, Math.min(1.5, pitch));
    parx += (tparx - parx) * 0.06; pary += (tpary - pary) * 0.06;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uSpin, reducedMotion ? 1.2 : time * 0.06);
    gl.uniform2f(uRot, yaw, pitch);
    gl.uniform2f(uPar, parx, pary);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf && active()) raf = requestAnimationFrame(frame); };
  document.addEventListener('visibilitychange', kick);
  kick();

  return {
    pause() { wantRun = false; },
    resume() { wantRun = true; kick(); },
    dispose() {
      wantRun = false;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchstart', onTStart);
      canvas.removeEventListener('touchmove', onTMove);
      window.removeEventListener('touchend', onUp);
      document.removeEventListener('visibilitychange', kick);
      const ext = gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
    },
  };
}
