// Constructor del maniquí anatómico a partir del atlas real Z-Anatomy (CC BY-SA 4.0,
// basado en BodyParts3D). El modelo es un GLB reducido a los 10 grupos musculares de la
// app con compresión Draco (public/models/muscles.glb). Cada malla del GLB se etiqueta
// con su grupo y comparte material, así la escena puede colorearlas por fatiga y el
// raycaster sabe qué grupo se tocó.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import type { MuscleGroup } from '@/domain/types'
import { MUSCLE_GROUPS } from '@/domain/catalog'
import { MUSCLE_NO_DATA_COLOR } from '@/domain/muscleColors'

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
  // Se resuelve cuando el GLB termina de cargarse; la escena reaplica el estado al cargar.
  ready: Promise<void>
}

// Recursos servidos desde public/models/: GLB del atlas + decodificador Draco.
const MODEL_URL = '/models/muscles.glb'
const DRACO_DECODER_PATH = '/models/draco/'

// Altura objetivo del maniquí en unidades de escena, con los pies en y = 0.
const TARGET_HEIGHT = 1.85

// Material de músculo: sombreado suave; el color lo reasigna la escena según fatiga.
const muscleMaterial = (id: MuscleGroup): THREE.MeshStandardMaterial => {
  void id
  return new THREE.MeshStandardMaterial({
    color: MUSCLE_NO_DATA_COLOR,
    roughness: 0.85,
    metalness: 0,
  })
}

// Carga el atlas reducido (GLB + Draco), lo normaliza (altura objetivo, pies en y=0 y
// centrado en X/Z) y etiqueta cada malla con su grupo muscular.
export const buildMannequin = (): Mannequin => {
  const group = new THREE.Group()
  const materialByGroup = new Map<MuscleGroup, THREE.MeshStandardMaterial>()
  const regions: MuscleRegion[] = []
  const muscleMeshes: THREE.Mesh[] = []

  let resolveReady: () => void = () => {}
  const ready = new Promise<void>((resolve) => {
    resolveReady = resolve
  })

  const draco = new DRACOLoader()
  draco.setDecoderPath(DRACO_DECODER_PATH)
  const loader = new GLTFLoader()
  loader.setDRACOLoader(draco)

  loader.load(
    MODEL_URL,
    (gltf) => {
      const model = gltf.scene

      // Normalización: escala a la altura objetivo y desplaza los pies a y=0, centrado.
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      const scale = TARGET_HEIGHT / size.y
      model.scale.setScalar(scale)
      model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)

      // Etiqueta cada malla con su grupo (el nombre de nodo del GLB es el id del grupo).
      model.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const id = obj.name as MuscleGroup
          if (!MUSCLE_GROUPS.includes(id)) return
          let region = regions.find((r) => r.id === id)
          if (!region) {
            region = { id, meshes: [] }
            regions.push(region)
            materialByGroup.set(id, muscleMaterial(id))
          }
          const mat = materialByGroup.get(id)!
          // Reemplaza el material del atlas por el material compartido de la app.
          const previous = obj.material
          if (Array.isArray(previous)) previous.forEach((m) => m.dispose())
          else if (previous) previous.dispose()
          obj.material = mat
          obj.userData.muscleGroup = id
          region.meshes.push(obj)
          muscleMeshes.push(obj)
        }
      })

      group.add(model)
      draco.dispose()
      resolveReady()
    },
    undefined,
    () => resolveReady() // si la carga falla, no bloquear la escena (queda vacía)
  )

  return { group, regions, materialByGroup, muscleMeshes, ready }
}
