// 3D Hero Scene — Three.js rotating low-poly mountain with parallax + lighting
// Loaded as global Hero3D component

function Hero3D({ height = 520, intensity = 1 }) {
  const mountRef = React.useRef(null);
  const stateRef = React.useRef({});

  React.useEffect(() => {
    const THREE = window.THREE;
    if (!THREE || !mountRef.current) return;
    const mount = mountRef.current;

    const w = mount.clientWidth;
    const h = mount.clientHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xfcfbfe, 8, 22);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 1.4, 7);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // ---- lighting ----
    const ambient = new THREE.AmbientLight(0xfff1e5, 0.55);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffd4b0, 1.6);
    key.position.set(5, 6, 4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -6; key.shadow.camera.right = 6;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x2860a3, 0.45);
    rim.position.set(-4, 3, -3);
    scene.add(rim);
    const fill = new THREE.PointLight(0xD55A1F, 0.6, 14);
    fill.position.set(-2, 2, 4);
    scene.add(fill);

    // ---- materials ----
    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x9b938a, roughness: 0.92, metalness: 0.05, flatShading: true,
    });
    const peakMat = new THREE.MeshStandardMaterial({
      color: 0xfaf7f4, roughness: 0.6, metalness: 0.1, flatShading: true,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xD55A1F, roughness: 0.6, metalness: 0.2, emissive: 0xD55A1F, emissiveIntensity: 0.15,
    });

    // ---- main mountain (icosahedron, low-poly) ----
    const mountainGroup = new THREE.Group();
    scene.add(mountainGroup);

    // Big rock peak
    const bigGeo = new THREE.IcosahedronGeometry(1.5, 1);
    // distort vertices for organic look
    const bigPos = bigGeo.attributes.position;
    for (let i = 0; i < bigPos.count; i++) {
      const x = bigPos.getX(i), y = bigPos.getY(i), z = bigPos.getZ(i);
      const n = Math.sin(x * 3 + y * 2) * 0.08 + Math.cos(z * 2) * 0.06;
      bigPos.setXYZ(i, x * (1 + n), y * (1 + n * 0.7) + (y > 0 ? 0.25 : 0), z * (1 + n));
    }
    bigGeo.computeVertexNormals();
    const bigRock = new THREE.Mesh(bigGeo, rockMat);
    bigRock.castShadow = true;
    bigRock.receiveShadow = true;
    bigRock.position.set(0, 0.4, 0);
    mountainGroup.add(bigRock);

    // Snow cap on top
    const capGeo = new THREE.ConeGeometry(0.65, 0.7, 6, 1);
    const cap = new THREE.Mesh(capGeo, peakMat);
    cap.position.set(0.05, 1.65, 0);
    cap.rotation.set(0.1, 0.4, -0.05);
    cap.castShadow = true;
    mountainGroup.add(cap);
    const cap2 = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.5, 6, 1), peakMat);
    cap2.position.set(-0.55, 1.35, 0.2);
    cap2.rotation.set(0.0, 0.7, 0.15);
    cap2.castShadow = true;
    mountainGroup.add(cap2);

    // Side rocks
    function makeRock(r, distort, color) {
      const g = new THREE.IcosahedronGeometry(r, 0);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const n = (Math.sin(x * 5) * 0.5 + Math.cos(y * 4) * 0.5) * distort;
        p.setXYZ(i, x * (1 + n), y * (1 + n), z * (1 + n));
      }
      g.computeVertexNormals();
      const m = new THREE.Mesh(g, color === 'accent' ? accentMat : rockMat.clone());
      if (color !== 'accent') m.material.color.setHex(color || 0x7b746d);
      m.castShadow = true;
      m.receiveShadow = true;
      return m;
    }
    const sideRocks = [
      { pos: [-2.6, -0.4, 0.4], r: 0.85, d: 0.18, c: 0x6e6760 },
      { pos: [2.5, -0.6, 0.6],  r: 0.95, d: 0.22, c: 0x5e5751 },
      { pos: [-1.6, -0.9, 1.6], r: 0.55, d: 0.15, c: 0x8a8278 },
      { pos: [1.7, -0.95, 1.4], r: 0.62, d: 0.16, c: 0x807870 },
      { pos: [0.0, -1.05, 1.9], r: 0.42, d: 0.14, c: 0xa39b91 },
    ];
    const sideMeshes = sideRocks.map(r => {
      const m = makeRock(r.r, r.d, r.c);
      m.position.set(...r.pos);
      m.userData.basePos = [...r.pos];
      mountainGroup.add(m);
      return m;
    });

    // Floating accent shape (peen tint)
    const accentShape = makeRock(0.28, 0.2, 'accent');
    accentShape.position.set(2.0, 1.4, 0.5);
    accentShape.userData.float = 0;
    mountainGroup.add(accentShape);

    const accentShape2 = makeRock(0.18, 0.15, 'accent');
    accentShape2.position.set(-2.2, 1.0, 0.3);
    accentShape2.userData.float = 1.5;
    mountainGroup.add(accentShape2);

    // Carabiner-like torus
    const carab = new THREE.Mesh(
      new THREE.TorusGeometry(0.35, 0.08, 12, 32),
      new THREE.MeshStandardMaterial({ color: 0x2860A3, roughness: 0.4, metalness: 0.7 })
    );
    carab.position.set(-2.5, 1.6, 0.8);
    carab.rotation.set(0.6, 0.3, 0);
    carab.castShadow = true;
    mountainGroup.add(carab);

    // Floor (subtle)
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(8, 48),
      new THREE.MeshStandardMaterial({ color: 0xfcfbfe, roughness: 1 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.55;
    floor.receiveShadow = true;
    scene.add(floor);

    // ---- chalk dust particles (Points) ----
    const dustCount = Math.round(80 * intensity);
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    const dustVel = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 10;
      dustPos[i * 3 + 1] = -1.5 + Math.random() * 5;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 4;
      dustVel[i * 3] = (Math.random() - 0.5) * 0.002;
      dustVel[i * 3 + 1] = 0.005 + Math.random() * 0.012;
      dustVel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xD55A1F, size: 0.05, transparent: true, opacity: 0.55,
      sizeAttenuation: true, depthWrite: false,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ---- mouse parallax ----
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      const rect = mount.getBoundingClientRect();
      mouse.tx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.ty = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    const onLeave = () => { mouse.tx = 0; mouse.ty = 0; };
    window.addEventListener('mousemove', onMove);
    mount.addEventListener('mouseleave', onLeave);

    // ---- resize ----
    const onResize = () => {
      const W = mount.clientWidth;
      const H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    // ---- animate ----
    let raf;
    let t = 0;
    const animate = () => {
      t += 0.01 * intensity;
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      // group rotates slowly + parallax
      mountainGroup.rotation.y = t * 0.18 + mouse.x * 0.25;
      mountainGroup.rotation.x = mouse.y * 0.12;
      mountainGroup.position.y = Math.sin(t * 0.7) * 0.05;

      // accent shapes float
      accentShape.position.y = 1.4 + Math.sin(t * 1.1) * 0.18;
      accentShape.rotation.y = t * 0.6;
      accentShape.rotation.x = t * 0.3;
      accentShape2.position.y = 1.0 + Math.sin(t * 0.9 + 1.5) * 0.14;
      accentShape2.rotation.y = -t * 0.5;
      accentShape2.rotation.z = t * 0.3;

      carab.rotation.y = t * 0.4;
      carab.position.y = 1.6 + Math.sin(t * 0.8 + 0.5) * 0.1;

      // dust
      const arr = dustGeo.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        arr[i * 3 + 1] += dustVel[i * 3 + 1];
        arr[i * 3] += dustVel[i * 3];
        if (arr[i * 3 + 1] > 4) {
          arr[i * 3 + 1] = -1.5;
          arr[i * 3] = (Math.random() - 0.5) * 10;
        }
      }
      dustGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    stateRef.current = { renderer, scene };
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      mount.removeEventListener('mouseleave', onLeave);
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
      scene.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
    };
  }, [intensity]);

  return <div ref={mountRef} style={{ width: '100%', height, position: 'relative' }}/>;
}

window.Hero3D = Hero3D;
