// Escena Three.js del maniquí: renderer, cámara, luces, rotación libre y picking por raycaster.
// Vive tras un dynamic import (chunk lazy) para no engordar el bundle inicial.
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { FatigueLevel, MuscleGroup } from '@/domain/types'
import { MUSCLE_HIGHLIGHT_COLOR, fatigueToColor } from '@/domain/muscleColors'
import { buildMannequin, type Mannequin } from './mannequin'

export type MuscleSceneState = {
  fatigue: Partial<Record<MuscleGroup, FatigueLevel>>
  selected: MuscleGroup | null
  highlight: MuscleGroup | null
}

export type MuscleSceneHandle = {
  update: (state: MuscleSceneState) => void
  resetView: () => void
  dispose: () => void
}

export type MountMuscleSceneOptions = {
  onSelect?: (mg: MuscleGroup | null) => void
  reducedMotion: boolean
}

// Punto de origen de la cámara (frente) y radio de giro alrededor del torso.
const TARGET = new THREE.Vector3(0, 0.9, 0)
const HOME_POS = new THREE.Vector3(0, 1.1, 3.3)
const DRAG_THRESHOLD_PX = 8
const INTRO_MS = 1400
const RESET_MS = 400

const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

// Monta la escena del maniquí en `container` y devuelve el manejador de estado/disposición.
export const mountMuscleScene = (
  container: HTMLDivElement,
  options: MountMuscleSceneOptions
): MuscleSceneHandle => {
  const { onSelect, reducedMotion } = options

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  // Tone mapping cinematográfico para que los relieves de fibras se lean con más riqueza.
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  container.appendChild(renderer.domElement)

  const scene = new THREE.Scene()

  // Luz de estudio: ambiental + clave cálida + relleno frío + rim trasero para el silueteado.
  scene.add(new THREE.AmbientLight(0xffffff, 0.45))
  const key = new THREE.DirectionalLight(0xfff2e0, 1.6)
  key.position.set(1.8, 2.8, 2.6)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0x8fa3c4, 0.45)
  fill.position.set(-2.2, 1, -1.8)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xfde8c8, 0.6)
  rim.position.set(0, 2.2, -3)
  scene.add(rim)

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20)

  const mannequin: Mannequin = buildMannequin()
  scene.add(mannequin.group)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableZoom = false
  controls.enablePan = false
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minPolarAngle = 0.35
  controls.maxPolarAngle = 2.55
  controls.target.copy(TARGET)

  // Sincroniza el lienzo con el tamaño del contenedor (aspecto + resolución).
  const resize = (): void => {
    const w = container.clientWidth || 1
    const h = container.clientHeight || 1
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  resize()
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  // Picking: el raycaster solo considera las mallas de músculo; tocar el vacío deselecciona.
  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()
  const ndcOf = (e: PointerEvent): THREE.Vector2 => {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    return pointer
  }

  // Distingue tap de arrastre: solo selecciona si el puntero apenas se movió.
  let downPos: { x: number; y: number } | null = null
  const onPointerDown = (e: PointerEvent): void => {
    downPos = { x: e.clientX, y: e.clientY }
  }
  const onPointerUp = (e: PointerEvent): void => {
    if (!downPos) return
    const moved = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y)
    downPos = null
    if (moved > DRAG_THRESHOLD_PX) return // fue un arrastre para rotar, no una selección
    raycaster.setFromCamera(ndcOf(e), camera)
    const hits = raycaster.intersectObjects(mannequin.muscleMeshes, false)
    const mg = hits[0]?.object.userData.muscleGroup as MuscleGroup | undefined
    onSelect?.(mg ?? null)
  }
  // Cursor «mano» al pasar sobre un músculo (solo relevante con ratón).
  const onPointerMove = (e: PointerEvent): void => {
    raycaster.setFromCamera(ndcOf(e), camera)
    const overMuscle = raycaster.intersectObjects(mannequin.muscleMeshes, false).length > 0
    renderer.domElement.style.cursor = overMuscle ? 'pointer' : 'grab'
  }
  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointermove', onPointerMove)

  // Pinta los materiales por grupo según fatiga, selección o resaltado de la ficha.
  const applyState = (state: MuscleSceneState): void => {
    for (const region of mannequin.regions) {
      const material = mannequin.materialByGroup.get(region.id)!
      const isActive = state.selected === region.id || state.highlight === region.id
      material.color.set(isActive ? MUSCLE_HIGHLIGHT_COLOR : fatigueToColor(state.fatigue[region.id]))
      const dimmed = state.selected !== null && state.selected !== region.id
      material.opacity = dimmed ? 0.4 : 1
      material.transparent = dimmed
    }
  }

  // Animación suave: intro lateral→frente y vuelta del botón reset (ambas respetan reduced-motion).
  let introStart = 0
  let introRunning = !reducedMotion
  let resetAnim: { start: number; from: THREE.Vector3 } | null = null
  const resetView = (): void => {
    resetAnim = { start: performance.now(), from: camera.position.clone() }
  }
  const stepAnimations = (now: number): void => {
    if (introRunning) {
      if (introStart === 0) introStart = now
      const t = Math.min((now - introStart) / INTRO_MS, 1)
      const angle = -0.7 * (1 - easeOutCubic(t))
      camera.position.set(
        TARGET.x + Math.sin(angle) * HOME_POS.distanceTo(TARGET),
        HOME_POS.y,
        TARGET.z + Math.cos(angle) * HOME_POS.distanceTo(TARGET)
      )
      if (t >= 1) introRunning = false
    } else if (resetAnim) {
      const t = Math.min((now - resetAnim.start) / RESET_MS, 1)
      camera.position.lerpVectors(resetAnim.from, HOME_POS, easeOutCubic(t))
      if (t >= 1) resetAnim = null
    }
  }

  const handle: MuscleSceneHandle = {
    update: applyState,
    resetView,
    dispose: () => {
      renderer.setAnimationLoop(null)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      controls.dispose()
      // Libera geometrías y materiales compartidos por malla (dispose es idempotente).
      const materials = new Set<THREE.Material>()
      mannequin.group.traverse((obj) => {
        const mesh = obj as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const mat = mesh.material
        if (Array.isArray(mat)) mat.forEach((m) => materials.add(m))
        else if (mat) materials.add(mat)
      })
      materials.forEach((m) => m.dispose())
      renderer.dispose()
      container.removeChild(renderer.domElement)
    },
  }

  camera.position.copy(HOME_POS)
  controls.update()
  renderer.setAnimationLoop(() => {
    stepAnimations(performance.now())
    controls.update()
    renderer.render(scene, camera)
  })

  return handle
}
