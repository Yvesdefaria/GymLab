// Constructor del maniquí low-poly: genera el muñeco con primitivas de Three.js.
// Cada grupo muscular del dominio es una o más mallas que comparten material, así
// la escena puede colorearlas por fatiga y el raycaster sabe qué grupo se tocó.
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

// Material low-poly: sin interpolación de normales para que se noten las facetas.
const muscleMaterial = (color: string): THREE.MeshStandardMaterial =>
  new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.9, metalness: 0 })

// Proporciones aproximadas de un maniquí de 1.85 m con los pies en y = 0.
export const buildMannequin = (): Mannequin => {
  const group = new THREE.Group()
  const baseMaterial = muscleMaterial(MUSCLE_BASE_COLOR)
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
      materialByGroup.set(id, muscleMaterial(MUSCLE_NO_DATA_COLOR))
    }
    const mesh = new THREE.Mesh(geo, materialByGroup.get(id)!)
    mesh.position.set(x, y, z)
    mesh.scale.set(sx, sy, sz)
    mesh.userData.muscleGroup = id
    group.add(mesh)
    region.meshes.push(mesh)
    muscleMeshes.push(mesh)
  }

  // Base: cabeza, cuello, torso, pelvis, brazos, manos, piernas y pies.
  addBase(new THREE.SphereGeometry(0.15, 6, 5), 0, 1.68, 0)
  addBase(new THREE.CylinderGeometry(0.045, 0.06, 0.12, 6), 0, 1.53, 0)
  addBase(new THREE.BoxGeometry(0.5, 0.62, 0.3), 0, 1.13, 0)
  addBase(new THREE.BoxGeometry(0.44, 0.28, 0.28), 0, 0.68, 0)
  addBase(new THREE.SphereGeometry(0.05, 5, 4), 0.36, 0.66, 0)
  addBase(new THREE.SphereGeometry(0.05, 5, 4), -0.36, 0.66, 0)
  addBase(new THREE.BoxGeometry(0.09, 0.07, 0.2), 0.15, 0.045, 0.06)
  addBase(new THREE.BoxGeometry(0.09, 0.07, 0.2), -0.15, 0.045, 0.06)

  // Trapecios: cuña sobre cuello-hombros.
  addMuscle('trapecios', new THREE.SphereGeometry(0.14, 6, 5), 0, 1.36, 0.01, 1.1, 0.55, 0.7)

  // Hombro (deltoides izquierdo y derecho).
  addMuscle('hombro', new THREE.SphereGeometry(0.115, 6, 5), 0.33, 1.3, 0, 1, 1.15, 1.05)
  addMuscle('hombro', new THREE.SphereGeometry(0.115, 6, 5), -0.33, 1.3, 0, 1, 1.15, 1.05)

  // Pecho: dos pectorales sobre el torso.
  addMuscle('pecho', new THREE.SphereGeometry(0.145, 6, 5), 0.14, 1.16, 0.1, 0.85, 0.85, 0.5)
  addMuscle('pecho', new THREE.SphereGeometry(0.145, 6, 5), -0.14, 1.16, 0.1, 0.85, 0.85, 0.5)

  // Bíceps y tríceps en el brazo superior.
  addMuscle('biceps', new THREE.CapsuleGeometry(0.075, 0.2, 3, 5), 0.36, 1.14, 0.02)
  addMuscle('biceps', new THREE.CapsuleGeometry(0.075, 0.2, 3, 5), -0.36, 1.14, 0.02)
  addMuscle('triceps', new THREE.CapsuleGeometry(0.07, 0.18, 3, 5), 0.36, 1.12, -0.045)
  addMuscle('triceps', new THREE.CapsuleGeometry(0.07, 0.18, 3, 5), -0.36, 1.12, -0.045)

  // Antebrazo.
  addMuscle('antebrazo', new THREE.CapsuleGeometry(0.055, 0.19, 3, 5), 0.36, 0.815, 0)
  addMuscle('antebrazo', new THREE.CapsuleGeometry(0.055, 0.19, 3, 5), -0.36, 0.815, 0)

  // Abdomen: bloque del core sobresaliendo al frente.
  addMuscle('abdomen', new THREE.SphereGeometry(0.2, 6, 5), 0, 0.93, 0.12, 1.05, 0.85, 0.55)

  // Espalda (dorsales) en la parte trasera del torso.
  addMuscle('espalda', new THREE.SphereGeometry(0.17, 6, 5), 0.14, 1.06, -0.14, 0.8, 0.9, 0.45)
  addMuscle('espalda', new THREE.SphereGeometry(0.17, 6, 5), -0.14, 1.06, -0.14, 0.8, 0.9, 0.45)

  // Glúteo detrás de la cadera.
  addMuscle('gluteo', new THREE.SphereGeometry(0.15, 6, 5), 0.14, 0.66, -0.15, 0.9, 0.85, 0.55)
  addMuscle('gluteo', new THREE.SphereGeometry(0.15, 6, 5), -0.14, 0.66, -0.15, 0.9, 0.85, 0.55)

  // Pierna: cuádriceps (muslos) y gemelos (pantorrillas) comparten el material de «pierna».
  addMuscle('pierna', new THREE.CapsuleGeometry(0.095, 0.24, 4, 6), 0.15, 0.48, 0)
  addMuscle('pierna', new THREE.CapsuleGeometry(0.095, 0.24, 4, 6), -0.15, 0.48, 0)
  addMuscle('pierna', new THREE.CapsuleGeometry(0.07, 0.15, 4, 6), 0.15, 0.19, -0.01)
  addMuscle('pierna', new THREE.CapsuleGeometry(0.07, 0.15, 4, 6), -0.15, 0.19, -0.01)

  return {
    group,
    regions: [...regionsById.values()],
    materialByGroup,
    muscleMeshes,
  }
}
