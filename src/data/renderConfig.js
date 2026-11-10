import { SPACE_ANCHORS } from './sceneConfig.js'

const asPosition = ([x, y, z]) => ({ x, y, z })
const orbitPoint = (orbitRadius, orbitAngle) => ({
  x: 20 + Math.cos(orbitAngle) * orbitRadius,
  y: -1 + Math.sin(orbitAngle) * orbitRadius * 0.28,
  z: 0,
})

const solarBase = { scaleGroup: 'solarSystem', visibleFromZoom: 12, visibleUntilZoom: 68, labelFromZoom: 18, labelUntilZoom: 64, featuredLabel: false }
const starBase = { scaleGroup: 'milkyWay', visibleFromZoom: 51, visibleUntilZoom: 76, labelFromZoom: 57, labelUntilZoom: 79, visualScale: 0.8, featuredLabel: false }
const clusterBase = { scaleGroup: 'milkyWay', visibleFromZoom: 54, visibleUntilZoom: 76, labelFromZoom: 61, labelUntilZoom: 79, visualScale: 8, color: '#b9d5ff', accent: '#ffffff', featuredLabel: false }
const nebulaBase = { scaleGroup: 'milkyWay', visibleFromZoom: 55, visibleUntilZoom: 76, labelFromZoom: 62, labelUntilZoom: 79, visualScale: 30, color: '#d778ff', accent: '#687fff', featuredLabel: false }
const galaxyBase = { scaleGroup: 'localGroup', visibleFromZoom: 87, visibleUntilZoom: 110, labelFromZoom: 92, labelUntilZoom: 106, visualScale: 500, color: '#a7c7ff', accent: '#ffe0b5', featuredLabel: false }

export const RENDER_CONFIG = {
  sun: { ...solarBase, renderPosition: asPosition(SPACE_ANCHORS.sun), color: '#ffad1f', accent: '#fff0a2', visualScale: 3.4, orbitRadius: 0, orbitAngle: 0, visibleFromZoom: 22, labelFromZoom: 28 },
  mercury: { ...solarBase, renderPosition: orbitPoint(4, 0), color: '#aaa49b', accent: '#d5d0ca', visualScale: 0.38, orbitRadius: 4, orbitAngle: 0 },
  venus: { ...solarBase, renderPosition: orbitPoint(8, 0.65), color: '#e4bd78', accent: '#ffe2a7', visualScale: 0.92, orbitRadius: 8, orbitAngle: 0.65 },
  earth: { ...solarBase, renderPosition: asPosition(SPACE_ANCHORS.earthCenter), color: '#287de8', accent: '#72d7ff', visualScale: 1, orbitRadius: 20, orbitAngle: Math.PI, visibleFromZoom: 0, labelFromZoom: 7 },
  moon: { ...solarBase, renderPosition: { x: 2.3, y: -0.65, z: 0.2 }, color: '#cbd0d6', accent: '#ffffff', visualScale: 0.3, orbitRadius: 2.3, orbitAngle: 0.15, labelFromZoom: 18, labelUntilZoom: 52 },
  mars: { ...solarBase, renderPosition: orbitPoint(29, 0.65), color: '#e5704b', accent: '#ffab87', visualScale: 0.55, orbitRadius: 29, orbitAngle: 0.65 },
  jupiter: { ...solarBase, renderPosition: orbitPoint(42, 3.7), color: '#d5b087', accent: '#ffe1bd', visualScale: 1.9, orbitRadius: 42, orbitAngle: 3.7 },
  saturn: { ...solarBase, renderPosition: orbitPoint(55, 1.8), color: '#e6d19b', accent: '#fff0bd', visualScale: 1.65, orbitRadius: 55, orbitAngle: 1.8, hasRing: true },
  uranus: { ...solarBase, renderPosition: orbitPoint(67, 5.55), color: '#86d8df', accent: '#c7f9ff', visualScale: 0.85, orbitRadius: 67, orbitAngle: 5.55, hasRing: true },
  neptune: { ...solarBase, renderPosition: orbitPoint(79, 2.5), color: '#3d66dc', accent: '#8ca8ff', visualScale: 0.82, orbitRadius: 79, orbitAngle: 2.5 },

  'proxima-centauri': { ...starBase, color: '#ff6848', accent: '#ffb09d' },
  sirius: { ...starBase, color: '#dceaff', accent: '#8fbaff', labelFromZoom: 58 },
  betelgeuse: { ...starBase, color: '#ff7a51', accent: '#ffc0a7', labelFromZoom: 61 },
  rigel: { ...starBase, color: '#b9d7ff', accent: '#e8f4ff', labelFromZoom: 63 },
  polaris: { ...starBase, color: '#fff1bf', accent: '#fff8df', labelFromZoom: 62 },
  deneb: { ...starBase, color: '#d7e8ff', accent: '#ffffff', labelFromZoom: 65 },

  pleiades: { ...clusterBase, visualScale: 9 },
  hyades: { ...clusterBase, visualScale: 11, labelFromZoom: 64 },
  m13: { ...clusterBase, visualScale: 14, color: '#ffe5ae', labelFromZoom: 66 },
  'omega-centauri': { ...clusterBase, visualScale: 16, color: '#ffe0a0', labelFromZoom: 68 },

  'orion-nebula': { ...nebulaBase, visualScale: 34 },
  'eagle-nebula': { ...nebulaBase, visualScale: 38, color: '#d98b69', accent: '#7d5cff', labelFromZoom: 66 },
  'lagoon-nebula': { ...nebulaBase, visualScale: 40, color: '#ff86bd', accent: '#7c6cff', labelFromZoom: 67 },
  'horsehead-nebula': { ...nebulaBase, visualScale: 28, color: '#6d5149', accent: '#e18b72', labelFromZoom: 68 },

  'milky-way': { ...galaxyBase, renderPosition: asPosition(SPACE_ANCHORS.galacticCenter), visualScale: 1180, visibleFromZoom: 67, visibleUntilZoom: 108, labelFromZoom: 76 },
  andromeda: { ...galaxyBase, visualScale: 1550, color: '#d5e5ff', accent: '#fff0cf', labelFromZoom: 91 },
  m32: { ...galaxyBase, visualScale: 145, color: '#e7d5bd', accent: '#fff1dc', labelFromZoom: 94 },
  triangulum: { ...galaxyBase, visualScale: 390, labelFromZoom: 94 },
  lmc: { ...galaxyBase, visualScale: 300, color: '#8fb9e8', labelFromZoom: 93 },
  'local-group': { ...galaxyBase, renderPosition: { x: 0, y: 0, z: 0 }, visualScale: 6200, color: '#52698d', accent: '#7be4ff', visibleFromZoom: 94, visibleUntilZoom: 118, labelFromZoom: 97, labelUntilZoom: 111 },

  'virgo-cluster': { scaleGroup: 'largeScale', renderPosition: { x: -2400, y: 3900, z: 17400 }, visualScale: 1600, color: '#c5d8ff', accent: '#88c9ff', visibleFromZoom: 101, visibleUntilZoom: 124, labelFromZoom: 104, labelUntilZoom: 119, featuredLabel: true },
  laniakea: { scaleGroup: 'largeScale', renderPosition: { x: -4000, y: 3000, z: 7000 }, visualScale: 22000, color: '#c9b9ff', accent: '#8ceaff', visibleFromZoom: 122, visibleUntilZoom: 136, labelFromZoom: 122, labelUntilZoom: 134, featuredLabel: true },
}
