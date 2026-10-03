import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { PassportPage } from '../../lib/passport'
export interface PassportRenderer { setPage: (page: PassportPage) => void; dispose: () => void }
const TIMES = { cover: 0, front: 55 / 30, back: 115 / 30 }
export async function createPassportRenderer(host: HTMLElement, onPocket: (index: number) => void, onOpen: () => void): Promise<PassportRenderer> {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.setClearColor(0, 0)
  const scene = new THREE.Scene()
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb7a98d, 1.6))
  const light = new THREE.DirectionalLight(0xfff8ec, 1.8); light.position.set(-1, 2, 3); scene.add(light)
  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 10)
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const review = import.meta.env.DEV ? new URLSearchParams(window.location.search) : null
  const reducedMotion = () => motion.matches || review?.get('reviewMotion') === 'reduce'
  host.dataset.motion = reducedMotion() ? 'reduced' : 'animated'
  let gltf
  try { gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}passport/${review?.get('reviewAsset') === 'fail' ? 'missing-review.glb' : 'passport-v5.glb'}`) }
  catch (error) { renderer.dispose(); throw error }
  const book = gltf.scene
  scene.add(book)
  const mixer = new THREE.AnimationMixer(book)
  for (const clip of gltf.animations) mixer.clipAction(clip).play()
  let page: PassportPage = 'cover', time = 0, target = 0, frame = 0, disposed = false
  const materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>()
  book.traverse(obj => {
    if (!(obj instanceof THREE.Mesh)) return
    const list = Array.isArray(obj.material) ? obj.material : [obj.material]
    for (const mat of list) {
      materials.add(mat)
      if (mat instanceof THREE.MeshStandardMaterial) { if (mat.map) textures.add(mat.map); if (mat.normalMap) textures.add(mat.normalMap) }
    }
  })
  host.appendChild(renderer.domElement)
  const resize = () => {
    const { width, height } = host.getBoundingClientRect()
    renderer.setSize(width, height, false); camera.aspect = width / Math.max(height, 1)
    const span = page === 'cover' ? .24 : .48
    const distance = Math.max(.35 / (2 * Math.tan(THREE.MathUtils.degToRad(17))), span / (2 * Math.tan(THREE.MathUtils.degToRad(17)) * camera.aspect)) * 1.15
    const centerX = page === 'cover' ? 0 : -.105
    camera.position.set(centerX + .06, .035, distance); camera.lookAt(centerX, 0, 0); camera.updateProjectionMatrix()
  }
  const pick = (event: PointerEvent) => {
    if (page === 'cover') { onOpen(); return }
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.set((event.clientX-rect.left)/rect.width*2-1, -(event.clientY-rect.top)/rect.height*2+1)
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObject(book, true)[0]
    for (let obj: THREE.Object3D | undefined = hit?.object; obj; obj = obj.parent ?? undefined) {
      const match = /^grade([0-5])(?:_|$)/.exec(obj.name)
      if (match) { onPocket(Number(match[1])); break }
    }
  }
  const contextLost = (event: Event) => { event.preventDefault(); host.dispatchEvent(new Event('passport-context-lost')) }
  renderer.domElement.addEventListener('pointerup', pick)
  renderer.domElement.addEventListener('webglcontextlost', contextLost)
  let previous = performance.now()
  const draw = (now: number) => {
    if (disposed) return
    const delta = Math.min((now - previous) / 1000, .1); previous = now
    if (reducedMotion() || Math.abs(time-target) < .005) time = target
    else time += Math.sign(target-time)*Math.min(Math.abs(target-time),delta*2.6)
    mixer.setTime(time)
    renderer.render(scene, camera)
    if (time !== target) frame = requestAnimationFrame(draw)
    else { frame = 0; host.dataset.settled = page }
  }
  const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(draw) }
  const responsive = new ResizeObserver(() => { resize(); schedule() }); responsive.observe(host)
  const motionChange = () => { host.dataset.motion = reducedMotion() ? 'reduced' : 'animated'; schedule() }
  motion.addEventListener('change', motionChange)
  resize(); frame = requestAnimationFrame(draw)
  return {
    setPage: next => { delete host.dataset.settled; page = next; host.dataset.page = next; target = TIMES[next]; resize(); previous = performance.now(); schedule() },
    dispose: () => {
      disposed = true; cancelAnimationFrame(frame); responsive.disconnect(); motion.removeEventListener('change', motionChange)
      renderer.domElement.removeEventListener('pointerup', pick); renderer.domElement.removeEventListener('webglcontextlost', contextLost)
      mixer.stopAllAction(); mixer.uncacheRoot(book)
      book.traverse(obj => { if (obj instanceof THREE.Mesh) obj.geometry.dispose() })
      materials.forEach(mat => mat.dispose()); textures.forEach(texture => texture.dispose())
      renderer.dispose(); renderer.domElement.remove()
    },
  }
}
