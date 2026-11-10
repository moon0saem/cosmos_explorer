export { SCHOOL_LOCATION, SPACE_ANCHORS, ZOOM_STAGES, BREADCRUMBS, MAX_ZOOM } from './sceneConfig.js'

import { SOLAR_SYSTEM_DATA } from './solarSystemObjects.js'
import { STAR_DATA } from './stars.js'
import { CLUSTER_DATA } from './clusters.js'
import { NEBULA_DATA } from './nebulae.js'
import { GALAXY_DATA } from './galaxies.js'
import { LARGE_SCALE_STRUCTURE_DATA } from './largeScaleStructures.js'
import { RENDER_CONFIG } from './renderConfig.js'
import { compressedRenderPosition, normalizeAstronomicalRecord } from './astronomy.js'
import { logCatalogValidation } from './validation.js'

const MILKY_WAY_RENDER_ORIGIN = { x: 20, y: -1, z: 0 }
const LOCAL_GROUP_RENDER_ORIGIN = { x: 0, y: 0, z: 0 }

function createSceneObject(actualRecord) {
  const actual = normalizeAstronomicalRecord(actualRecord)
  const render = RENDER_CONFIG[actual.id] ?? {}
  const renderPosition = render.renderPosition ?? compressedRenderPosition(
    { ...actual, scaleGroup: render.scaleGroup },
    render.scaleGroup === 'localGroup' ? LOCAL_GROUP_RENDER_ORIGIN : MILKY_WAY_RENDER_ORIGIN,
  )
  return { ...actual, ...render, renderPosition }
}

export const SOLAR_SYSTEM_OBJECTS = SOLAR_SYSTEM_DATA.map(createSceneObject)
export const STARS = STAR_DATA.map(createSceneObject)
export const CLUSTERS = CLUSTER_DATA.map(createSceneObject)
export const NEBULAE = NEBULA_DATA.map(createSceneObject)
export const GALAXIES = GALAXY_DATA.map(createSceneObject)
export const LARGE_SCALE_STRUCTURES = LARGE_SCALE_STRUCTURE_DATA.map(createSceneObject)
export const ALL_OBJECTS = [...SOLAR_SYSTEM_OBJECTS, ...STARS, ...CLUSTERS, ...NEBULAE, ...GALAXIES, ...LARGE_SCALE_STRUCTURES]
export const SUN_POSITION = [20, -1, 0]

// 개발 서버에서 ?validateData=1을 붙이면 실제 좌표와 렌더 좌표를 나란히 검증할 수 있다.
if (import.meta.env?.DEV && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('validateData')) {
  logCatalogValidation(ALL_OBJECTS)
}
