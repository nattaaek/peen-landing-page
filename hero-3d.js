/**
 * Decorative 3D hero: loads hero.glb when hero is in viewport.
 * Respects prefers-reduced-motion, no-WebGL fallback, lazy init, capped DPR, pause when offscreen.
 * For faster load, replace with a compressed hero-optimized.glb and point loader.load to it.
 */
(function () {
  const FORCE_ANIM = new URL(location.href).searchParams.get('anim') === 'on';
  const reduceMotion = () => !FORCE_ANIM && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const container = document.getElementById('heroGlbContainer');
  const canvas = document.getElementById('heroGlbCanvas');
  const fallback = container?.querySelector('.hero-glb-fallback');
  if (!container || !canvas) return;
  if (reduceMotion()) return;

  let webglOK = false;
  try {
    const ctx = canvas.getContext('webgl2') || canvas.getContext('webgl');
    webglOK = !!ctx;
  } catch (_) {}
  if (!webglOK) return;

  let visible = true;
  const visibilityObserver = new IntersectionObserver(
    (entries) => { visible = entries[0].isIntersecting; },
    { rootMargin: '0px', threshold: 0 }
  );
  visibilityObserver.observe(container);

  const initObserver = new IntersectionObserver(
    (entries) => {
      if (!entries[0].isIntersecting) return;
      initObserver.disconnect();
      loadAndAnimate();
    },
    { rootMargin: '100px', threshold: 0 }
  );
  initObserver.observe(container);

  async function loadAndAnimate() {
    const threeMod = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js').catch(() => null);
    const loaderMod = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js').catch(() => null);
    const T = threeMod?.default ?? threeMod;
    const GLTFLoader = loaderMod?.GLTFLoader;
    if (!T || !GLTFLoader) return;

    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(28, 1, 0.1, 2000);
    camera.position.set(0, 0, 12);
    const renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    if (renderer.outputColorSpace !== undefined) renderer.outputColorSpace = T.SRGBColorSpace;

    const ambient = new T.AmbientLight(0xa0a0a0, 0.8);
    const dir = new T.DirectionalLight(0xffffff, 0.6);
    dir.position.set(2, 4, 6);
    scene.add(ambient);
    scene.add(dir);

    const loader = new GLTFLoader();
    const loadTimeout = setTimeout(() => {
      if (!container.classList.contains('canvas-ready')) container?.classList.remove('canvas-ready');
    }, 45000);

    loader.load(
      'hero.glb',
      (gltf) => {
        clearTimeout(loadTimeout);
        const model = gltf.scene;
        model.traverse((child) => {
          if (child.isMesh) child.castShadow = child.receiveShadow = false;
        });
        const box = new T.Box3().setFromObject(model);
        const center = box.getCenter(new T.Vector3());
        const size = box.getSize(new T.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        model.position.sub(center);
        camera.position.z = Math.max(8, maxDim * 1.8);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        scene.add(model);

        function resize() {
          const parent = canvas.parentElement;
          if (!parent) return;
          const w = parent.clientWidth;
          const h = parent.clientHeight;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          canvas.style.width = w + 'px';
          canvas.style.height = h + 'px';
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
          renderer.setPixelRatio(dpr);
        }
        resize();
        window.addEventListener('resize', resize);

        container.classList.add('canvas-ready');
        fallback?.style.setProperty('transition', 'opacity .4s ease');

        let lastTick = 0;
        function tick(t) {
          if (!visible) {
            requestAnimationFrame(tick);
            return;
          }
          const dt = (t - lastTick) / 1000;
          lastTick = t;
          model.rotation.y += 0.15 * Math.min(dt, 0.1);
          renderer.render(scene, camera);
          requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      undefined,
      () => {
        clearTimeout(loadTimeout);
      }
    );
  }
})();
