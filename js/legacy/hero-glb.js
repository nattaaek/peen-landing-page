import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Same folder as `index.html` → works with any local server root. `file://` cannot fetch this in most browsers. */
const GLB_URL = new URL('3d/MaleChibi_Moutian_Climber_ClimbAnimation_v006.glb', document.baseURI).href;

/** Default Y used when `?modelYawDeg=` is not set (keep in sync with log suggestions). */
const DEFAULT_MODEL_YAW_DEG = 28.5;

/**
 * Live camera / orbit numbers. Tweak with `?debugOrbit=1` sliders or drag on the canvas; use “Log values” to copy.
 * @type {{
 *   yawOffsetDeg: number,
 *   sideAmtMobile: number, sideAmtDesktop: number,
 *   orbitRightMobile: number, orbitRightDesktop: number,
 *   backTowardWall: number,
 *   downMobile: number, downDesktop: number,
 *   pivotLerp: number,
 *   lookCharLerp: number,
 *   lookUpMobile: number, lookUpDesktop: number,
 * }}
 */
const heroTuning = {
  yawOffsetDeg: 0,
  sideAmtMobile: 0.24,
  sideAmtDesktop: 0.1,
  orbitRightMobile: 0.11,
  orbitRightDesktop: 0.35,
  backTowardWall: 0.06,
  downMobile: 0.16,
  downDesktop: 0.05,
  pivotLerp: 0,
  lookCharLerp: 0.38,
  lookUpMobile: 0.12,
  lookUpDesktop: 0.16,
};

/**
 * World Y rotation for the whole GLB. If the wall looks like a thin pillar and the climber is hidden,
 * the camera is seeing the wall edge-on — increase |yaw| (~±90° steps) or use ?modelYawDeg=…
 */
function readModelYawRad() {
  const u = new URL(location.href);
  const deg = u.searchParams.get('modelYawDeg');
  if (deg !== null && deg !== '' && !Number.isNaN(parseFloat(deg))) {
    return THREE.MathUtils.degToRad(parseFloat(deg));
  }
  return THREE.MathUtils.degToRad(DEFAULT_MODEL_YAW_DEG);
}

function wantsReducedMotion() {
  const u = new URL(location.href);
  if (u.searchParams.get('anim') === 'on') return false;
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function showImageFallback() {
  document.querySelector('.hero-glb-layer')?.setAttribute('hidden', '');
  const fb = document.querySelector('.hero-glb-fallback');
  if (fb) {
    fb.removeAttribute('hidden');
    fb.style.display = 'block';
    fb.removeAttribute('aria-hidden');
  }
}

function showHeroAlert(message) {
  const wrap = document.querySelector('.hero-overlay');
  if (!wrap || wrap.querySelector('[data-hero-glb-alert]')) return;
  const p = document.createElement('p');
  p.dataset.heroGlbAlert = '';
  p.className = 'hero-glb-alert';
  p.setAttribute('role', 'alert');
  p.textContent = message;
  wrap.insertBefore(p, wrap.firstChild);
}

/**
 * Side profile + slight low angle (like the hero video): wall mass to the right of frame, climber lower-left.
 * Do not use mesh names that match the actual climbing rock (e.g. "wall").
 */
const BACKDROP_NAME_RE =
  /sky|backdrop|background|environment|hdri|dome|studio|ground|floor|terrain|cloud|fog/i;

const _tmpF = new THREE.Vector3();
const _tmpR = new THREE.Vector3();
const _tmpU = new THREE.Vector3(0, 1, 0);

/**
 * @param {THREE.Vector3} lookAtOut world point the camera looks at (for parallax)
 */
function frameCameraHero(
  camera,
  sceneCenter,
  charCenter,
  maxDim,
  zoom,
  isMobile,
  camFlip,
  lookAtOut
) {
  const vFov = (camera.fov * Math.PI) / 180;
  let dist = (maxDim / 2 / Math.tan(vFov / 2)) * zoom;
  dist = Math.max(dist, maxDim * 0.36);

  let towardWall = new THREE.Vector3().subVectors(sceneCenter, charCenter);
  towardWall.y = 0;
  if (towardWall.lengthSq() < 1e-8) towardWall.set(1, 0, 0);
  else towardWall.normalize();

  let side = new THREE.Vector3().crossVectors(_tmpU, towardWall);
  if (side.lengthSq() < 1e-8) side.set(0, 0, 1);
  else side.normalize();

  const t = heroTuning;
  const sideAmt = maxDim * (isMobile ? t.sideAmtMobile : t.sideAmtDesktop);
  const backAmt = dist * (isMobile ? 0.9 : 1.02);
  const downAmt = maxDim * (isMobile ? t.downMobile : t.downDesktop);
  const orbitRight = maxDim * (isMobile ? t.orbitRightMobile : t.orbitRightDesktop);

  const place = (sign) => {
    const pivot = new THREE.Vector3().lerpVectors(charCenter, sceneCenter, t.pivotLerp);
    const cam = new THREE.Vector3()
      .copy(pivot)
      // camFlip is NOT applied here: the sign flip below would cancel it (place(-1)+camFlip=-1 === place(1)+camFlip=1).
      .addScaledVector(side, sign * sideAmt + orbitRight)
      .addScaledVector(towardWall, -backAmt * t.backTowardWall)
      .addScaledVector(_tmpU, -downAmt);
    const look = new THREE.Vector3().lerpVectors(sceneCenter, charCenter, t.lookCharLerp);
    look.y += maxDim * (isMobile ? t.lookUpMobile : t.lookUpDesktop);
    return { cam, look };
  };

  let { cam, look } = place(1);
  camera.position.copy(cam);
  camera.lookAt(look);
  camera.updateMatrixWorld(true);
  camera.getWorldDirection(_tmpF);
  _tmpR.crossVectors(_tmpU, _tmpF).normalize();
  if (towardWall.dot(_tmpR) < 0) {
    ({ cam, look } = place(-1));
    camera.position.copy(cam);
    camera.lookAt(look);
    camera.updateMatrixWorld(true);
  }

  // True horizontal mirror: reflect camera across the vertical plane through `look` with normal `side`
  // (screen-left ↔ screen-right). Applied after the wall-side heuristic; checkbox / camFlipLive drive this.
  if (camFlip < 0) {
    const v = new THREE.Vector3().subVectors(camera.position, look);
    const alongSide = v.dot(side);
    camera.position.copy(look).add(v).addScaledVector(side, -2 * alongSide);
    camera.lookAt(look);
    camera.updateMatrixWorld(true);
  }

  lookAtOut.copy(look);
  const d = camera.position.distanceTo(look);
  camera.near = Math.max(0.01, d / 500);
  camera.far = Math.max(d * 150, 3500);
  camera.updateProjectionMatrix();
}

function meshWorldMaxDim(mesh) {
  const g = mesh.geometry;
  if (!g) return 0;
  if (!g.boundingBox) g.computeBoundingBox();
  const b = g.boundingBox.clone().applyMatrix4(mesh.matrixWorld);
  const s = b.getSize(new THREE.Vector3());
  return Math.max(s.x, s.y, s.z);
}

function hideOversizedStaticMeshes(root) {
  root.updateMatrixWorld(true);
  const dims = [];
  root.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh) return;
    dims.push(meshWorldMaxDim(o));
  });
  if (dims.length < 2) return;
  dims.sort((a, b) => a - b);
  const ref =
    dims.length <= 3 ? dims[0] : dims[Math.floor(dims.length * 0.35)];
  if (ref < 1e-6) return;
  root.traverse((o) => {
    if (!o.isMesh || o.isSkinnedMesh) return;
    if (meshWorldMaxDim(o) > ref * 8) o.visible = false;
  });
}

/**
 * @param {THREE.Object3D} root
 * @returns {THREE.Box3}
 */
function unionBoxSkinnedMeshes(root) {
  const box = new THREE.Box3();
  let any = false;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    const g = o.geometry;
    if (!g?.getAttribute('position')) return;
    if (!g.boundingBox) g.computeBoundingBox();
    const ob = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
    if (!any) {
      box.copy(ob);
      any = true;
    } else box.union(ob);
  });
  return any ? box : null;
}

/**
 * @param {THREE.Object3D} root
 * @param {THREE.Box3} target
 */
function unionBoxVisibleMeshes(root, target) {
  target.makeEmpty();
  let any = false;
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.visible || (!o.isMesh && !o.isSkinnedMesh)) return;
    const g = o.geometry;
    if (!g?.getAttribute('position')) return;
    if (!g.boundingBox) g.computeBoundingBox();
    const ob = g.boundingBox.clone().applyMatrix4(o.matrixWorld);
    if (!any) {
      target.copy(ob);
      any = true;
    } else target.union(ob);
  });
  return any;
}

function hideBackdropMeshes(root, charRefMaxDim) {
  root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!(o.isMesh || o.isSkinnedMesh)) return;
    const name = (o.name || '').toLowerCase();
    if (BACKDROP_NAME_RE.test(name)) {
      o.visible = false;
      return;
    }
    if (o.isSkinnedMesh || !charRefMaxDim) return;
    const md = meshWorldMaxDim(o);
    if (charRefMaxDim > 0.01 && md > charRefMaxDim * 2.2) o.visible = false;
  });
}

/**
 * @param {THREE.Object3D} root
 * @returns {{ box: THREE.Box3, maxDim: number, center: THREE.Vector3 }}
 */
function framingFromHeroModel(root) {
  const skinBox = unionBoxSkinnedMeshes(root);
  let charMax = 0;
  if (skinBox && !skinBox.isEmpty()) {
    charMax = Math.max(
      skinBox.max.x - skinBox.min.x,
      skinBox.max.y - skinBox.min.y,
      skinBox.max.z - skinBox.min.z,
      0.01
    );
  }

  hideBackdropMeshes(root, charMax);

  if (charMax < 0.01) {
    hideOversizedStaticMeshes(root);
  }

  const box = new THREE.Box3();
  const ok = unionBoxVisibleMeshes(root, box);
  if (!ok || box.isEmpty()) {
    box.setFromObject(root);
  }

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z, 0.01);
  const charCenter =
    skinBox && !skinBox.isEmpty()
      ? skinBox.getCenter(new THREE.Vector3())
      : center.clone();

  return { box, maxDim, center, charCenter };
}

/**
 * Dev-only: `?debugOrbit=1` — sliders + log; Shift+drag on canvas adjusts yaw.
 * Log output is JSON you can paste back into `DEFAULT_MODEL_YAW_DEG` / `heroTuning`.
 */
function installHeroOrbitDebugUI(renderer, deps) {
  const { recalcHeroFrame, getCamFlip, setCamFlip, baseYawRad } = deps;
  const canvas = renderer.domElement;
  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'none';

  const logSnapshot = (reason) => {
    const bakedYawDeg =
      Math.round((THREE.MathUtils.radToDeg(baseYawRad) + heroTuning.yawOffsetDeg) * 1000) / 1000;
    const payload = {
      _reason: reason,
      instructions:
        'In js/hero-glb.js: set DEFAULT_MODEL_YAW_DEG = bakedYawDeg; set heroTuning.yawOffsetDeg = 0; paste other heroTuning fields. If camFlipUseQueryCamFlip1 is true, default camFlipLive should be -1; use ?camFlip=0 only when you want no mirror.',
      bakedYawDeg,
      liveBeforeBake: { ...heroTuning },
      heroTuning: { ...heroTuning, yawOffsetDeg: 0 },
      camFlipUseQueryCamFlip1: getCamFlip() < 0,
    };
    const text = JSON.stringify(payload, null, 2);
    console.log(`[hero-glb] orbit tool — ${reason}\n`, text);
    const pre = document.getElementById('hero-orbit-debug-log');
    if (pre) pre.textContent = text;
  };

  const panel = document.createElement('div');
  panel.id = 'hero-orbit-debug-ui';
  panel.innerHTML = `
    <div class="hero-orbit-debug-inner">
      <strong>Hero orbit tool</strong> <span style="opacity:.75">(?debugOrbit=1)</span>
      <p class="hero-orbit-hint">Shift + drag horizontally on the 3D canvas to nudge yaw. Shift + click (no drag) logs values. Use sliders for fine control.</p>
      <label>Yaw offset ° <input type="range" min="-90" max="90" step="0.5" data-k="yawOffsetDeg" /> <span data-v="yawOffsetDeg"></span></label>
      <label>Side desktop ×maxDim <input type="range" min="0.05" max="0.55" step="0.01" data-k="sideAmtDesktop" /> <span data-v="sideAmtDesktop"></span></label>
      <label>Orbit right desktop ×maxDim <input type="range" min="0" max="0.35" step="0.01" data-k="orbitRightDesktop" /> <span data-v="orbitRightDesktop"></span></label>
      <label>Down desktop ×maxDim <input type="range" min="0.05" max="0.45" step="0.01" data-k="downDesktop" /> <span data-v="downDesktop"></span></label>
      <label>Pivot lerp <input type="range" min="0" max="0.6" step="0.01" data-k="pivotLerp" /> <span data-v="pivotLerp"></span></label>
      <label>Look → char lerp <input type="range" min="0" max="1" step="0.01" data-k="lookCharLerp" /> <span data-v="lookCharLerp"></span></label>
      <label><input type="checkbox" data-camflip /> Mirror orbit (default on; ?camFlip=0 disables)</label>
      <button type="button" data-log>Log values (console + below)</button>
      <pre id="hero-orbit-debug-log" aria-label="Last logged orbit values"></pre>
    </div>`;

  const style = document.createElement('style');
  style.textContent = `
    #hero-orbit-debug-ui{position:fixed;right:12px;bottom:12px;z-index:9999;max-width:min(420px,calc(100vw - 24px));
      font:12px/1.35 system-ui,sans-serif;color:#eaeaea;background:rgba(12,12,14,.92);border:1px solid rgba(255,255,255,.15);
      border-radius:10px;padding:10px 12px;box-shadow:0 8px 32px rgba(0,0,0,.5);pointer-events:auto}
    #hero-orbit-debug-ui label{display:block;margin:6px 0}
    #hero-orbit-debug-ui input[type=range]{width:min(220px,55vw);vertical-align:middle}
    #hero-orbit-debug-ui .hero-orbit-hint{margin:6px 0 8px;opacity:.8;font-size:11px}
    #hero-orbit-debug-ui pre{margin:10px 0 0;max-height:200px;overflow:auto;font-size:10px;background:#0a0a0c;padding:8px;border-radius:6px;white-space:pre-wrap;word-break:break-all}
    #hero-orbit-debug-ui button{margin-top:8px;padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:#2a2a2e;color:#fff;cursor:pointer;font-weight:600}
    #hero-orbit-debug-ui button:hover{background:#3a3a42}`;
  document.head.appendChild(style);
  document.body.appendChild(panel);

  const syncInputs = () => {
    panel.querySelectorAll('input[type=range][data-k]').forEach((inp) => {
      const k = inp.dataset.k;
      inp.value = String(heroTuning[k]);
      const sp = panel.querySelector(`[data-v="${k}"]`);
      if (sp) sp.textContent = String(heroTuning[k]);
    });
    const cb = panel.querySelector('[data-camflip]');
    if (cb) cb.checked = getCamFlip() < 0;
  };

  const onChange = () => {
    panel.querySelectorAll('input[type=range][data-k]').forEach((inp) => {
      const k = inp.dataset.k;
      const num = parseFloat(inp.value);
      if (!Number.isNaN(num)) heroTuning[k] = num;
    });
    recalcHeroFrame();
    syncInputs();
  };

  panel.querySelectorAll('input[type=range][data-k]').forEach((inp) => {
    inp.addEventListener('input', onChange);
  });
  panel.querySelector('[data-camflip]')?.addEventListener('change', (e) => {
    setCamFlip(e.target.checked ? -1 : 1);
    recalcHeroFrame();
  });
  panel.querySelector('[data-log]')?.addEventListener('click', () => logSnapshot('button'));

  let drag = false;
  let lastX = 0;
  let dragMovedPx = 0;
  canvas.addEventListener('pointerdown', (e) => {
    if (!e.shiftKey) return;
    drag = true;
    dragMovedPx = 0;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    dragMovedPx += Math.abs(dx);
    heroTuning.yawOffsetDeg += dx * 0.12;
    recalcHeroFrame();
    syncInputs();
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!drag) return;
    drag = false;
    canvas.releasePointerCapture(e.pointerId);
    canvas.style.cursor = 'grab';
    if (dragMovedPx < 4) logSnapshot('shift-click');
    else logSnapshot('shift-drag-end');
  });
  canvas.addEventListener('pointercancel', () => {
    drag = false;
    canvas.style.cursor = 'grab';
  });

  syncInputs();
  logSnapshot('init');
}

let scrollP = 0;
function updateHeroScrollProgress() {
  const track = document.getElementById('heroScroll');
  if (!track) return;
  const y = window.scrollY || window.pageYOffset;
  const rect = track.getBoundingClientRect();
  const start = y + rect.top;
  const span = Math.max(track.offsetHeight - window.innerHeight, 1);
  scrollP = Math.max(0, Math.min(1, (y - start) / span));
}

async function main() {
  const container = document.getElementById('heroGlbRoot');
  if (!container) {
    showImageFallback();
    return;
  }

  if (wantsReducedMotion()) {
    showHeroAlert(
      '3D is off while “Reduce motion” is enabled (system accessibility). Add ?anim=on to this page’s URL to see the animated climber, or use a still image below.'
    );
    showImageFallback();
    return;
  }

  if (location.protocol === 'file:') {
    console.warn(
      '[hero-glb] file:// cannot fetch the .glb. Use a local server: npm start or python3 -m http.server 8080, then http://127.0.0.1:8080/'
    );
    showHeroAlert(
      'This page was opened as a file (file://). The 3D model only loads over http://. In this project folder run npm start, or ./scripts/serve-local.sh, then open http://127.0.0.1:8080/'
    );
    showImageFallback();
    return;
  }

  console.info('[hero-glb] Fetching model:', GLB_URL);

  // Baked default: mirror on (?camFlip=1 in old terms). Use ?camFlip=0 to disable.
  const camFlipParam = new URL(location.href).searchParams.get('camFlip');
  let camFlipLive = camFlipParam === '0' ? 1 : -1;

  const layer = document.querySelector('.hero-glb-layer');
  const sizeEl = layer || container.parentElement || container;
  const w = () => Math.max(sizeEl.clientWidth, 2);
  const h = () => Math.max(sizeEl.clientHeight, 2);
  const mobile = () => innerWidth < 720;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, w() / h(), 0.01, 4500);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    console.error('[hero-glb] WebGL unavailable', e);
    showImageFallback();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w(), h(), false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x000000, 0);
  container.textContent = '';
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.58));
  const key = new THREE.DirectionalLight(0xffffff, 1.22);
  key.position.set(6, 14, 10);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd4c8f9, 0.48);
  fill.position.set(-5, 4, -7);
  scene.add(fill);
  scene.add(new THREE.HemisphereLight(0x9ecfff, 0x1a1a1a, 0.52));

  const loading = document.createElement('p');
  loading.className = 'hero-glb-loading';
  loading.textContent = 'Loading 3D…';
  loading.setAttribute('aria-live', 'polite');
  container.appendChild(loading);

  let mixer = null;
  const heroSceneCenter = new THREE.Vector3();
  const heroCharCenter = new THREE.Vector3();
  let heroFrameReady = false;
  const lookTarget = new THREE.Vector3();
  let modelMaxDim = 1;
  /** @type {THREE.Vector3 | null} */
  let baseCamPos = null;

  /** Base yaw from URL/default only (orbit tool adds heroTuning.yawOffsetDeg on top). */
  let baseYawRad = 0;
  /** @type {THREE.Object3D | null} */
  let gltfSceneRef = null;

  function applyFrame() {
    if (!heroFrameReady) return;
    frameCameraHero(
      camera,
      heroSceneCenter,
      heroCharCenter,
      modelMaxDim,
      mobile() ? 0.5 : 0.52,
      mobile(),
      camFlipLive,
      lookTarget
    );
    baseCamPos = camera.position.clone();
  }

  function recalcHeroFrame() {
    if (!gltfSceneRef || !heroFrameReady) return;
    gltfSceneRef.rotation.y = baseYawRad + THREE.MathUtils.degToRad(heroTuning.yawOffsetDeg);
    gltfSceneRef.updateMatrixWorld(true);
    const framed = framingFromHeroModel(gltfSceneRef);
    heroSceneCenter.copy(framed.center);
    heroCharCenter.copy(framed.charCenter);
    modelMaxDim = framed.maxDim;
    applyFrame();
  }

  try {
    const loadingManager = new THREE.LoadingManager();
    loadingManager.onProgress = (_url, loaded, total) => {
      if (total > 0) {
        loading.textContent = `Loading 3D… ${Math.min(100, Math.round((100 * loaded) / total))}%`;
      }
    };
    loadingManager.onError = (url) => console.error('[hero-glb] LoadingManager error:', url);

    const loader = new GLTFLoader(loadingManager);
    const gltf = await new Promise((resolve, reject) => {
      loader.load(GLB_URL, resolve, undefined, reject);
    });
    loading.remove();

    scene.add(gltf.scene);
    gltfSceneRef = gltf.scene;
    baseYawRad = readModelYawRad();
    gltf.scene.rotation.y = baseYawRad + THREE.MathUtils.degToRad(heroTuning.yawOffsetDeg);
    gltf.scene.updateMatrixWorld(true);

    const framed = framingFromHeroModel(gltf.scene);
    heroSceneCenter.copy(framed.center);
    heroCharCenter.copy(framed.charCenter);
    modelMaxDim = framed.maxDim;
    heroFrameReady = true;
    applyFrame();

    if (new URL(location.href).searchParams.get('debugOrbit') === '1') {
      layer?.style.setProperty('pointer-events', 'auto');
      installHeroOrbitDebugUI(renderer, {
        baseYawRad,
        recalcHeroFrame,
        getCamFlip: () => camFlipLive,
        setCamFlip: (v) => {
          camFlipLive = v;
        },
      });
    }

    if (gltf.animations?.length) {
      mixer = new THREE.AnimationMixer(gltf.scene);
      for (const clip of gltf.animations) {
        const act = mixer.clipAction(clip);
        act.loop = THREE.LoopRepeat;
        act.play();
      }
    }
  } catch (err) {
    console.error('[hero-glb] GLB load failed', GLB_URL, err);
    loading.remove();
    showHeroAlert(
      'Could not load the 3D file (~100MB). Keep 3d/MaleChibi_Moutian_Climber_ClimbAnimation_v006.glb next to index.html and serve the site over http:// (not file://). Check the console for details.'
    );
    showImageFallback();
    return;
  }

  updateHeroScrollProgress();
  window.addEventListener('scroll', updateHeroScrollProgress, { passive: true });
  window.addEventListener('resize', updateHeroScrollProgress, { passive: true });

  function applyParallax() {
    if (!baseCamPos) return;
    const m = mobile() ? 0.25 : 0.55;
    const t = scrollP - 0.5;
    camera.position.copy(baseCamPos);
    camera.position.x += t * modelMaxDim * 0.08 * m;
    camera.position.y += t * modelMaxDim * 0.1 * m;
    camera.position.z += Math.sin(scrollP * Math.PI) * modelMaxDim * 0.035 * m;
    camera.lookAt(lookTarget);
  }

  const clock = new THREE.Clock();
  function tick() {
    requestAnimationFrame(tick);
    const dt = clock.getDelta();
    if (mixer) mixer.update(dt);
    applyParallax();
    renderer.render(scene, camera);
  }
  tick();

  const ro = new ResizeObserver(() => {
    const cw = w();
    const ch = h();
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
    renderer.setSize(cw, ch, false);
    applyFrame();
  });
  ro.observe(sizeEl);
}

main().catch((e) => {
  console.error('[hero-glb] init failed', e);
  showHeroAlert(
    '3D did not start (check the browser console). Confirm js/hero-glb.bundle.js is present. The .glb still requires http:// (not file://).'
  );
  showImageFallback();
});
