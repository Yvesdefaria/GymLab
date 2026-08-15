// Constructor del maniquí anatómico: músculos esculpidos (sombreado suave) + textura procedimental
// de fibras (bump map) que marca la dirección real de cada grupo. Sin assets externos ni licencias.
// Cada grupo muscular del dominio es una o más mallas que comparten material, así la escena puede
// colorearlas por fatiga y el raycaster sabe qué grupo se tocó.
import * as THREE from 'three'
import type { MuscleGroup } from '@/domain/types'
import { MUSCLE_BASE_COLOR, MUSCLE_NO_DATA_COLOR } from '@/domain/muscleColors'

export type MuscleRegion = {
  id: MuscleGroup
  meshes: THREE.Mesh[]
}

export type Mannequin = {
  group: THREE.Group
  regions: MuscleRegion[]
  // Material compartido por grupo, para actualizar el color en caliente sin recrear mallas.
  materialByGroup: Map<MuscleGroup, THREE.MeshStandardMaterial>
  // Todas las mallas de músculo (las únicas que el raycaster considera seleccionables).
  muscleMeshes: THREE.Mesh[]
}

// Tipo de textura de fibras por grupo: alargados usan estrías longitudinales, el abdomen
// muestra las intersecciones tendinosas del 6-pack y los redondos un grano muy sutil.
type BumpKind = 'fiber' | 'abs' | 'subtle'

const BUMP_KINDS: Record<MuscleGroup, BumpKind> = {
  trapecios: 'fiber',
  hombro: 'fiber',
  pecho: 'subtle',
  biceps: 'fiber',
  triceps: 'fiber',
  antebrazo: 'fiber',
  abdomen: 'abs',
  espalda: 'fiber',
  gluteo: 'subtle',
  pierna: 'fiber',
}

// Textura de relieve (bump map) generada en un canvas: 50% gris = plano, luces = relieve.
const makeBumpTexture = (kind: BumpKind): THREE.CanvasTexture => {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#7d7d7d'
  ctx.fillRect(0, 0, 128, 256)

  if (kind === 'fiber') {
    // Estrías verticales con leve ondulación: fibras a lo largo del vientre muscular.
    for (let i = 0; i < 26; i++) {
      const x = 2.5 + i * 5
      const grad = ctx.createLinearGradient(x - 1.5, 0, x + 1.5, 0)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.5, i % 2 ? 'rgba(255,255,255,0.6)' : 'rgba(70,70,70,1)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.bezierCurveTo(x - 1.5, 64, x + 1.5, 128, x, 192)
      ctx.bezierCurveTo(x - 0.5, 224, x + 0.5, 240, x, 256)
      ctx.stroke()
    }
  } else if (kind === 'abs') {
    // Intersecciones tendinosas horizontales + línea alba central → paquete de 6.
    for (let i = 0; i < 5; i++) {
      const y = 24 + i * 48
      const grad = ctx.createLinearGradient(0, y - 2, 0, y + 2)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(0.5, 'rgba(255,255,255,0.55)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(128, y)
      ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(64, 0)
    ctx.lineTo(64, 256)
    ctx.stroke()
  } else {
    // Grano casi imperceptible para músculos redondos (pectorales, glúteo).
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
      ctx.fillRect((i * 37) % 128, (i * 53) % 256, 14, 2)
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(1, 1)
  // Los bump maps se consumen en espacio lineal; no aplicar corrección sRGB.
  tex.colorSpace = THREE.NoColorSpace
  return tex
}

// Material de músculo: sombreado suave (sin flatShading), relieve según el tipo de fibras.
const muscleMaterial = (id: MuscleGroup): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({
    color: MUSCLE_NO_DATA_COLOR,
    roughness: 0.85,
    metalness: 0,
    bumpMap: makeBumpTexture(BUMP_KINDS[id]),
    bumpScale: 0.4,
  })

// Proporciones aproximadas de un maniquí de ~1.85 m con los pies en y = 0.
export const buildMannequin = (): Mannequin => {
  const group = new THREE.Group()
  const baseMaterial = new THREE.MeshStandardMaterial({
    color: MUSCLE_BASE_COLOR,
    roughness: 0.75,
    metalness: 0,
  })
  const materialByGroup = new Map<MuscleGroup, THREE.MeshStandardMaterial>()
  const regionsById = new Map<MuscleGroup, MuscleRegion>()
  const muscleMeshes: THREE.Mesh[] = []

  // Añade una pieza «base» (cabeza, torso, extremidades): no es seleccionable.
  const addBase = (
    geo: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1
  ): void => {
    const mesh = new THREE.Mesh(geo, baseMaterial)
    mesh.position.set(x, y, z)
    mesh.scale.set(sx, sy, sz)
    group.add(mesh)
  }

  // Añade un volumen muscular (1+ mallas por grupo) etiquetado para el picking.
  const addMuscle = (
    id: MuscleGroup,
    geo: THREE.BufferGeometry,
    x: number,
    y: number,
    z: number,
    sx = 1,
    sy = 1,
    sz = 1
  ): void => {
    let region = regionsById.get(id)
    if (!region) {
      region = { id, meshes: [] }
      regionsById.set(id, region)
      materialByGroup.set(id, muscleMaterial(id))
    }
    const mesh = new THREE.Mesh(geo, materialByGroup.get(id)!)
    mesh.position.set(x, y, z)
    mesh.scale.set(sx, sy, sz)
    mesh.userData.muscleGroup = id
    group.add(mesh)
    region.meshes.push(mesh)
    muscleMeshes.push(mesh)
  }

  // Base: cabeza, cuello, torso (cónico), pelvis, brazos, manos, piernas y pies.
  addBase(new THREE.SphereGeometry(0.15, 32, 24), 0, 1.66, 0)
  addBase(new THREE.CylinderGeometry(0.05, 0.065, 0.14, 24), 0, 1.5, 0)
  addBase(new THREE.CylinderGeometry(0.25, 0.19, 0.7, 32, 16), 0, 1.12, 0, 1, 1, 0.7)
  addBase(new THREE.CylinderGeometry(0.21, 0.2, 0.3, 32, 8), 0, 0.66, 0, 1, 1, 0.75)
  addBase(new THREE.CapsuleGeometry(0.05, 0.22, 8, 12), 0.34, 1.1, 0)
  addBase(new THREE.CapsuleGeometry(0.05, 0.22, 8, 12), -0.34, 1.1, 0)
  addBase(new THREE.CapsuleGeometry(0.04, 0.18, 8, 12), 0.34, 0.8, 0)
  addBase(new THREE.CapsuleGeometry(0.04, 0.18, 8, 12), -0.34, 0.8, 0)
  addBase(new THREE.SphereGeometry(0.05, 16, 12), 0.34, 0.66, 0, 0.9, 1.1, 1)
  addBase(new THREE.SphereGeometry(0.05, 16, 12), -0.34, 0.66, 0, 0.9, 1.1, 1)
  addBase(new THREE.CapsuleGeometry(0.08, 0.22, 8, 12), 0.15, 0.46, 0)
  addBase(new THREE.CapsuleGeometry(0.08, 0.22, 8, 12), -0.15, 0.46, 0)
  addBase(new THREE.CapsuleGeometry(0.055, 0.16, 8, 12), 0.15, 0.19, 0)
  addBase(new THREE.CapsuleGeometry(0.055, 0.16, 8, 12), -0.15, 0.19, 0)
  addBase(new THREE.BoxGeometry(0.09, 0.07, 0.2, 2, 2, 2), 0.15, 0.05, 0.06)
  addBase(new THREE.BoxGeometry(0.09, 0.07, 0.2, 2, 2, 2), -0.15, 0.05, 0.06)

  // Trapecios: lámina baja sobre cuello-hombros (frente y parte trasera).
  addMuscle('trapecios', new THREE.SphereGeometry(0.15, 24, 16), 0, 1.35, 0.01, 1.6, 0.45, 0.8)
  addMuscle('trapecios', new THREE.SphereGeometry(0.15, 24, 16), 0, 1.32, -0.02, 1.3, 0.4, 0.6)

  // Hombro (deltoides izquierdo y derecho): casquete redondeado sobre la articulación.
  addMuscle('hombro', new THREE.SphereGeometry(0.12, 24, 18), 0.33, 1.3, 0, 1, 1.2, 1.15)
  addMuscle('hombro', new THREE.SphereGeometry(0.12, 24, 18), -0.33, 1.3, 0, 1, 1.2, 1.15)

  // Pecho: pectorales con vientre hacia el esternón (dos volúmenes por lado).
  addMuscle('pecho', new THREE.SphereGeometry(0.15, 24, 18), 0.14, 1.18, 0.13, 0.9, 0.85, 0.5)
  addMuscle('pecho', new THREE.SphereGeometry(0.15, 24, 18), -0.14, 1.18, 0.13, 0.9, 0.85, 0.5)
  addMuscle('pecho', new THREE.SphereGeometry(0.08, 16, 12), 0.05, 1.16, 0.15, 0.8, 0.7, 0.5)
  addMuscle('pecho', new THREE.SphereGeometry(0.08, 16, 12), -0.05, 1.16, 0.15, 0.8, 0.7, 0.5)

  // Bíceps: vientre largo + cabeza interna para el «pico» característico.
  addMuscle('biceps', new THREE.CapsuleGeometry(0.075, 0.22, 8, 14), 0.36, 1.12, 0.03)
  addMuscle('biceps', new THREE.CapsuleGeometry(0.075, 0.22, 8, 14), -0.36, 1.12, 0.03)
  addMuscle('biceps', new THREE.SphereGeometry(0.045, 12, 10), 0.305, 1.11, 0.06)
  addMuscle('biceps', new THREE.SphereGeometry(0.045, 12, 10), -0.305, 1.11, 0.06)

  // Tríceps: vientre en la cara posterior del brazo.
  addMuscle('triceps', new THREE.CapsuleGeometry(0.065, 0.2, 8, 12), 0.36, 1.1, -0.05)
  addMuscle('triceps', new THREE.CapsuleGeometry(0.065, 0.2, 8, 12), -0.36, 1.1, -0.05)

  // Antebrazo.
  addMuscle('antebrazo', new THREE.CapsuleGeometry(0.055, 0.2, 8, 12), 0.36, 0.8, 0)
  addMuscle('antebrazo', new THREE.CapsuleGeometry(0.055, 0.2, 8, 12), -0.36, 0.8, 0)

  // Abdomen: bloque del core con relieve de 6-packs en la cara anterior.
  addMuscle('abdomen', new THREE.SphereGeometry(0.2, 24, 16), 0, 0.94, 0.13, 1.1, 0.9, 0.55)

  // Espalda (dorsales): dos láminas desde la axila hacia la zona lumbar.
  addMuscle('espalda', new THREE.SphereGeometry(0.19, 24, 16), 0.16, 1.08, -0.16, 0.75, 1, 0.5)
  addMuscle('espalda', new THREE.SphereGeometry(0.19, 24, 16), -0.16, 1.08, -0.16, 0.75, 1, 0.5)

  // Glúteo: masas redondeadas detrás de la cadera.
  addMuscle('gluteo', new THREE.SphereGeometry(0.16, 24, 18), 0.15, 0.7, -0.17, 1, 0.9, 0.65)
  addMuscle('gluteo', new THREE.SphereGeometry(0.16, 24, 18), -0.15, 0.7, -0.17, 1, 0.9, 0.65)

  // Pierna: cuádriceps (muslo) + cabeza del cuadriceps + gemelos con sus dos vientres.
  addMuscle('pierna', new THREE.CapsuleGeometry(0.1, 0.24, 10, 16), 0.16, 0.46, 0, 1, 1, 0.95)
  addMuscle('pierna', new THREE.CapsuleGeometry(0.1, 0.24, 10, 16), -0.16, 0.46, 0, 1, 1, 0.95)
  addMuscle('pierna', new THREE.SphereGeometry(0.05, 12, 10), 0.16, 0.53, 0.05)
  addMuscle('pierna', new THREE.SphereGeometry(0.05, 12, 10), -0.16, 0.53, 0.05)
  addMuscle('pierna', new THREE.CapsuleGeometry(0.075, 0.16, 10, 14), 0.16, 0.2, -0.02, 0.9, 1, 0.9)
  addMuscle('pierna', new THREE.CapsuleGeometry(0.075, 0.16, 10, 14), -0.16, 0.2, -0.02, 0.9, 1, 0.9)
  addMuscle('pierna', new THREE.SphereGeometry(0.035, 10, 8), 0.195, 0.27, -0.07)
  addMuscle('pierna', new THREE.SphereGeometry(0.035, 10, 8), 0.125, 0.27, -0.07)
  addMuscle('pierna', new THREE.SphereGeometry(0.035, 10, 8), -0.195, 0.27, -0.07)
  addMuscle('pierna', new THREE.SphereGeometry(0.035, 10, 8), -0.125, 0.27, -0.07)

  return {
    group,
    regions: [...regionsById.values()],
    materialByGroup,
    muscleMeshes,
  }
}
