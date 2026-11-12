import { Canvas, useFrame } from '@react-three/fiber'
import { Billboard, Html, Line, Sparkles } from '@react-three/drei'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  ALL_OBJECTS, CLUSTERS, GALAXIES, LARGE_SCALE_STRUCTURES, MAX_ZOOM,
  NEBULAE, SCHOOL_LOCATION, SOLAR_SYSTEM_OBJECTS, SPACE_ANCHORS, STARS, ZOOM_STAGES,
} from './data/catalog.js'
import { formatDistanceFromEarth, positionOf, publicAssetUrl } from './data/astronomy.js'

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const smoothstep = (start, end, value) => {
  const x = clamp((value - start) / (end - start), 0, 1)
  return x * x * (3 - 2 * x)
}
const fadeWindow = (zoom, start, end, feather = 4) => (
  smoothstep(start - feather, start + feather, zoom)
  * (1 - smoothstep(end - feather, end + feather, zoom))
)
const objectFadeOut = (object, zoom) => object.visibleUntilZoom == null
  ? 1
  : 1 - smoothstep(object.visibleUntilZoom - 5, object.visibleUntilZoom + 5, zoom)

const objectOpacity = (object, zoom) => {
  const fadeIn = object.visibleFromZoom <= 0
    ? 1
    : smoothstep(object.visibleFromZoom - 5, object.visibleFromZoom + 5, zoom)
  return fadeIn * objectFadeOut(object, zoom)
}
const FEATURED_LABEL_IDS = new Set([
  'earth', 'moon', 'sun', 'proxima-centauri', 'sirius', 'pleiades',
  'm13', 'orion-nebula', 'milky-way', 'andromeda', 'm32', 'triangulum', 'lmc',
  'local-group', 'virgo-cluster', 'laniakea',
])
const NAMED_CATALOG_LABEL_TYPES = new Set(['별', '성단', '성운'])

const CAMERA_STOPS = [
  [0, 0.045], [8, 0.12], [16, 1.7], [25, 5], [40, 90],
  [58, 560], [72, 1300], [85, 3000], [92, 4800], [100, 10500],
  [108, 18000], [118, 36000], [128, 72000], [140, 150000],
]

const ZOOM_GESTURE_STOPS = [
  [0, 0.62], [12, 0.7], [20, 0.78], [40, 0.65], [60, 0.45], [75, 0.3], [90, 0.16], [100, 0.1],
  [115, 0.07], [130, 0.045], [140, 0.03],
]

export function zoomGestureFactor(zoom) {
  for (let index = 0; index < ZOOM_GESTURE_STOPS.length - 1; index += 1) {
    const [startZoom, startFactor] = ZOOM_GESTURE_STOPS[index]
    const [endZoom, endFactor] = ZOOM_GESTURE_STOPS[index + 1]
    if (zoom >= startZoom && zoom <= endZoom) {
      const t = (zoom - startZoom) / (endZoom - startZoom)
      return THREE.MathUtils.lerp(startFactor, endFactor, t)
    }
  }
  return ZOOM_GESTURE_STOPS.at(-1)[1]
}

export function zoomToDistance(zoom) {
  let start = CAMERA_STOPS[0]
  let end = CAMERA_STOPS.at(-1)
  for (let i = 0; i < CAMERA_STOPS.length - 1; i += 1) {
    if (zoom >= CAMERA_STOPS[i][0] && zoom <= CAMERA_STOPS[i + 1][0]) {
      start = CAMERA_STOPS[i]
      end = CAMERA_STOPS[i + 1]
      break
    }
  }
  const t = smoothstep(0, 1, clamp((zoom - start[0]) / (end[0] - start[0]), 0, 1))
  return Math.exp(Math.log(start[1]) + (Math.log(end[1]) - Math.log(start[1])) * t)
}

function CameraRig({ zoomLevel, orbit, navigation }) {
  useFrame(({ camera }, delta) => {
    const distance = zoomToDistance(zoomLevel)
    const { yaw, pitch } = orbit.current
    navigation.current.focus.lerp(navigation.current.target, 1 - Math.exp(-delta * 4.5))
    const focus = navigation.current.focus
    const desired = new THREE.Vector3(
      focus.x + Math.sin(yaw) * distance,
      focus.y + 0.018 + Math.sin(pitch) * distance,
      focus.z + Math.cos(yaw) * Math.cos(pitch) * distance,
    )
    camera.position.lerp(desired, 1 - Math.exp(-delta * 7))
    camera.near = Math.max(0.00015, distance / 180000)
    camera.far = 400000
    camera.lookAt(focus)
    camera.updateProjectionMatrix()
  })
  return null
}

function ObjectLabel({ object, zoomLevel, offset = 1, selected }) {
  const showCatalogLabel = FEATURED_LABEL_IDS.has(object.id) || NAMED_CATALOG_LABEL_TYPES.has(object.type)
  const normalOpacity = !showCatalogLabel ? 0 : fadeWindow(
    zoomLevel,
    object.labelFromZoom,
    object.labelUntilZoom ?? MAX_ZOOM + 1,
    3,
  )
  const opacity = selected ? 1 : normalOpacity
  if (opacity < 0.015) return null
  const lift = Math.max(offset, zoomToDistance(zoomLevel) * 0.017)
  return (
    <Billboard position={[0, lift, 0]}>
      <Html center style={{ pointerEvents: 'none', opacity }}>
        <div className={`object-label ${selected ? 'selected' : ''}`}>
          <strong>{object.nameKo}</strong><span>{object.nameEn}</span>
        </div>
      </Html>
    </Billboard>
  )
}

function HitArea({ radius, onSelect }) {
  return (
    <mesh scale={radius} onClick={(event) => { event.stopPropagation(); onSelect() }}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function ObservationImage({ object, opacity, scale }) {
  const [texture, setTexture] = useState(null)
  useEffect(() => {
    if (!object.image || opacity <= 0.01) return undefined
    let active = true
    let loadedTexture = null
    new THREE.TextureLoader().load(
      publicAssetUrl(object.image),
      (nextTexture) => {
        if (!active) { nextTexture.dispose(); return }
        loadedTexture = nextTexture
        nextTexture.colorSpace = THREE.SRGBColorSpace
        nextTexture.anisotropy = 4
        setTexture(nextTexture)
      },
      undefined,
      () => { if (active) setTexture(null) },
    )
    return () => {
      active = false
      loadedTexture?.dispose()
      setTexture(null)
    }
  }, [object.image, opacity > 0.01])
  if (opacity <= 0.01 || !texture) return null
  return (
    <Billboard>
      <mesh scale={[scale * 1.45, scale, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} transparent opacity={opacity} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <Html position={[0, -scale * 0.62, 0]} center style={{ pointerEvents: 'none', opacity }}>
        <div className="observation-badge">지구에서 관측한 모습</div>
      </Html>
    </Billboard>
  )
}

function getPhotoOpacity(object, detailed, viewDistance) {
  if (!object.image || !detailed) return 0
  // 자세히 보기를 누르기 전에는 관측 이미지를 로드하지 않습니다. 이후 가까이 접근하면
  // 사진이 서서히 사라지고 기존 교육용 내부 모형이 드러납니다.
  const fadeStart = object.type === '은하' ? object.visualScale * 0.45 : object.visualScale * 1.4
  const fullPhotoDistance = object.type === '은하' ? object.visualScale * 1.55 : object.visualScale * 4
  return smoothstep(fadeStart, fullPhotoDistance, viewDistance)
}

function CelestialBody({ object, zoomLevel, onSelect, selected }) {
  const mesh = useRef()
  const opacity = objectOpacity(object, zoomLevel)
  const markerSize = Math.max(object.visualScale, zoomToDistance(zoomLevel) * 0.004)
  useFrame((_, delta) => { if (mesh.current) mesh.current.rotation.y += delta * 0.09 })
  if (opacity < 0.01) return null
  return (
    <group position={positionOf(object)}>
      <mesh
        ref={mesh}
        scale={markerSize}
        onClick={(event) => { event.stopPropagation(); onSelect(object) }}
      >
        <sphereGeometry args={[1, 36, 36]} />
        <meshStandardMaterial
          color={object.color}
          emissive={object.color}
          emissiveIntensity={object.type === '별' ? 1.35 : 0.12}
          roughness={object.type === '위성' ? 0.95 : 0.68}
          transparent opacity={opacity}
        />
      </mesh>
      <HitArea radius={markerSize * 2.4} onSelect={() => onSelect(object)} />
      {object.id === 'earth' && (
        <group scale={markerSize}>
          <mesh scale={1.045}>
            <sphereGeometry args={[1, 36, 36]} />
            <meshBasicMaterial color="#73d7ff" transparent opacity={opacity * smoothstep(12, 22, zoomLevel) * 0.13} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
          {[
            { position: [-0.28, 0.2, 0.97], scale: [0.27, 0.17, 0.035], rotation: [0.2, -0.2, -0.25] },
            { position: [0.3, -0.14, 0.96], scale: [0.2, 0.28, 0.032], rotation: [-0.15, 0.18, 0.38] },
            { position: [0.08, 0.48, 0.9], scale: [0.18, 0.1, 0.028], rotation: [0.15, 0.1, -0.5] },
          ].map((patch, index) => (
            <mesh key={`land-${index}`} {...patch}>
              <sphereGeometry args={[1, 14, 10]} />
              <meshStandardMaterial color={index === 1 ? '#53ad68' : '#69bf72'} roughness={0.94} transparent opacity={opacity * 0.96} />
            </mesh>
          ))}
          {[
            { position: [-0.02, 0.04, 1.018], scale: [0.22, 0.035, 0.018], rotation: [0, 0, 0.12] },
            { position: [0.42, 0.28, 0.9], scale: [0.16, 0.028, 0.016], rotation: [0.15, 0.25, -0.3] },
          ].map((cloud, index) => (
            <mesh key={`cloud-${index}`} {...cloud}>
              <sphereGeometry args={[1, 14, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.52} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}
      {object.hasRing && (
        <mesh rotation={[Math.PI / 2.5, 0, 0]} scale={markerSize}>
          <ringGeometry args={[1.35, 1.85, 48]} />
          <meshBasicMaterial color={object.accent} transparent opacity={opacity * 0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
      {object.type === '별' && <pointLight color={object.accent} intensity={1.8} distance={markerSize * 9} />}
      {object.id === 'sun' && <mesh scale={markerSize * 1.45}><sphereGeometry args={[1, 28, 28]} /><meshBasicMaterial color="#ffb21c" transparent opacity={opacity * 0.08} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} /></mesh>}
      <ObjectLabel object={object} zoomLevel={zoomLevel} offset={markerSize * 1.4} selected={selected} />
    </group>
  )
}

function SchoolSurface({ zoomLevel }) {
  const detailOpacity = 1 - smoothstep(11, 24, zoomLevel)
  const markerOpacity = smoothstep(10, 21, zoomLevel) * (1 - smoothstep(58, 68, zoomLevel))
  const markerScale = Math.max(0.015, zoomToDistance(zoomLevel) * 0.006)
  return (
    <group position={SPACE_ANCHORS.school}>
      <group visible={detailOpacity > 0.01}>
        <mesh position={[0, 0.0002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.11, 64]} />
          <meshStandardMaterial color="#69a95f" transparent opacity={detailOpacity} roughness={1} />
        </mesh>
        <mesh position={[0, 0.0007, -0.002]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.018, 0.105]} />
          <meshStandardMaterial color="#f2d7ad" transparent opacity={detailOpacity} roughness={1} />
        </mesh>
        <group position={[0, 0.001, -0.048]}>
          <mesh position={[0, 0.014, 0]}>
            <boxGeometry args={[0.074, 0.028, 0.034]} />
            <meshStandardMaterial color="#fff1cf" transparent opacity={detailOpacity} roughness={0.82} />
          </mesh>
          <mesh position={[0, 0.032, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.05, 0.018, 4]} />
            <meshStandardMaterial color="#e98272" transparent opacity={detailOpacity} roughness={0.9} />
          </mesh>
          {[-0.025, 0.025].map((x) => (
            <mesh key={x} position={[x, 0.017, 0.0175]}>
              <boxGeometry args={[0.014, 0.012, 0.002]} />
              <meshStandardMaterial color="#8bd2eb" emissive="#5faac9" emissiveIntensity={0.18} transparent opacity={detailOpacity} />
            </mesh>
          ))}
          <mesh position={[0, 0.012, 0.018]}>
            <boxGeometry args={[0.014, 0.022, 0.003]} />
            <meshStandardMaterial color="#79a47a" transparent opacity={detailOpacity} />
          </mesh>
          <mesh position={[0, 0.028, 0.019]}>
            <boxGeometry args={[0.034, 0.008, 0.002]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={detailOpacity} />
          </mesh>
        </group>
        {[-0.068, 0.068].map((x) => (
          <group key={x} position={[x, 0, -0.035]}>
            <mesh position={[0, 0.012, 0]}><cylinderGeometry args={[0.003, 0.004, 0.024, 8]} /><meshStandardMaterial color="#8a6041" transparent opacity={detailOpacity} /></mesh>
            <mesh position={[0, 0.03, 0]}><sphereGeometry args={[0.017, 14, 10]} /><meshStandardMaterial color="#4f9f62" transparent opacity={detailOpacity} roughness={1} /></mesh>
          </group>
        ))}
        {[[-0.07, 0.035], [0.072, 0.018], [-0.055, -0.002]].map(([x, z], index) => (
          <mesh key={`flower-${index}`} position={[x, 0.002, z]}>
            <sphereGeometry args={[0.0035, 8, 6]} />
            <meshBasicMaterial color={index % 2 ? '#ffd86b' : '#ff91a7'} transparent opacity={detailOpacity} />
          </mesh>
        ))}
        <Html center position={[0, 0.062, -0.045]} style={{ pointerEvents: 'none', opacity: detailOpacity }}>
          <div className="school-label">현재 위치: {SCHOOL_LOCATION.name}</div>
        </Html>
      </group>
      <group scale={markerScale} visible={markerOpacity > 0.01}>
        <mesh position={[0, 0.75, 0]}><sphereGeometry args={[0.18, 16, 16]} /><meshBasicMaterial color="#7be4ff" /></mesh>
        <Line points={[[0, 0.1, 0], [0, 0.68, 0]]} color="#7be4ff" lineWidth={1} transparent opacity={markerOpacity} />
      </group>
    </group>
  )
}

function LocationMarker({ position, label, opacity, scale }) {
  if (opacity < 0.01) return null
  return (
    <group position={position} scale={Math.max(scale, 0.1)}>
      <mesh><ringGeometry args={[0.3, 0.42, 32]} /><meshBasicMaterial color="#7be4ff" transparent opacity={opacity} side={THREE.DoubleSide} /></mesh>
      <Billboard position={[0, 1, 0]}><Html center style={{ pointerEvents: 'none', opacity }}><div className="location-label">{label}</div></Html></Billboard>
    </group>
  )
}

function EarthSystem(props) {
  const earth = SOLAR_SYSTEM_OBJECTS.find((item) => item.id === 'earth')
  const moon = SOLAR_SYSTEM_OBJECTS.find((item) => item.id === 'moon')
  const orbitOpacity = fadeWindow(props.zoomLevel, 14, 55, 6)
  const atmosphereOpacity = smoothstep(12, 22, props.zoomLevel) * 0.08
  const moonOrbit = useMemo(() => Array.from({ length: 65 }, (_, i) => {
    const angle = i / 64 * Math.PI * 2
    return [Math.cos(angle) * 2.3, -1 + Math.sin(angle) * 0.72, 0]
  }), [])
  return (
    <group name="Earth">
      {atmosphereOpacity > 0.001 && <mesh position={SPACE_ANCHORS.earthCenter}><sphereGeometry args={[1.025, 48, 48]} /><meshBasicMaterial color="#68bfff" transparent opacity={atmosphereOpacity} side={THREE.BackSide} depthWrite={false} /></mesh>}
      <CelestialBody object={earth} {...props} selected={props.selectedId === earth.id} />
      <CelestialBody object={moon} {...props} selected={props.selectedId === moon.id} />
      {orbitOpacity > 0.01 && <Line points={moonOrbit} color="#91a5c3" transparent opacity={orbitOpacity * 0.28} lineWidth={0.7} />}
      <SchoolSurface zoomLevel={props.zoomLevel} />
    </group>
  )
}

function SolarSystem(props) {
  const bodies = SOLAR_SYSTEM_OBJECTS.filter((item) => !['earth', 'moon'].includes(item.id))
  const planets = SOLAR_SYSTEM_OBJECTS.filter((item) => item.type === '행성')
  const orbitOpacity = fadeWindow(props.zoomLevel, 24, 71, 8)
  return (
    <group name="SolarSystem">
      {planets.map((planet) => {
        const points = Array.from({ length: 65 }, (_, i) => {
          const angle = i / 64 * Math.PI * 2
          return [20 + Math.cos(angle) * planet.orbitRadius, -1 + Math.sin(angle) * planet.orbitRadius * 0.28, 0]
        })
        return <Line key={`${planet.id}-orbit`} points={points} color="#61738e" transparent opacity={orbitOpacity * 0.22} lineWidth={0.6} />
      })}
      {bodies.map((object) => <CelestialBody key={object.id} object={object} {...props} selected={props.selectedId === object.id} />)}
    </group>
  )
}

function seededValues(key, count) {
  let seed = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0) || 1
  return Array.from({ length: count }, () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  })
}

function createStarTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')
  const glow = context.createRadialGradient(32, 32, 0, 32, 32, 31)
  glow.addColorStop(0, 'rgba(255,255,255,1)')
  glow.addColorStop(0.1, 'rgba(255,255,255,.98)')
  glow.addColorStop(0.28, 'rgba(210,228,255,.72)')
  glow.addColorStop(0.62, 'rgba(130,175,255,.18)')
  glow.addColorStop(1, 'rgba(80,120,220,0)')
  context.fillStyle = glow
  context.fillRect(0, 0, 64, 64)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function Cluster({ object, zoomLevel, onSelect, selected, focused, navigation }) {
  const focusOffset = navigation.current.target.distanceTo(new THREE.Vector3(...positionOf(object)))
  const viewDistance = Math.hypot(zoomToDistance(zoomLevel), focusOffset)
  const detailActive = focused || viewDistance < object.visualScale * 22
  // 성단 가까이에서는 전역 zoomLevel의 하한보다 실제 접근 거리를 우선한다.
  // 단, 은하 규모에서 사라지는 상한 LOD는 계속 적용한다.
  const opacity = detailActive ? objectFadeOut(object, zoomLevel) : objectOpacity(object, zoomLevel)
  const isGlobular = object.subtype === '구상성단'
  const points = useMemo(() => {
    const count = isGlobular ? 180 : 30
    const random = seededValues(object.id, count * 3)
    return Array.from({ length: count }, (_, i) => {
      const radial = isGlobular ? Math.pow(random[i * 3], 2.25) : Math.sqrt(random[i * 3])
      const angle = random[i * 3 + 1] * Math.PI * 2
      const depth = (random[i * 3 + 2] - 0.5) * object.visualScale * (isGlobular ? 0.75 : 0.35)
      return [Math.cos(angle) * radial * object.visualScale, Math.sin(angle) * radial * object.visualScale, depth]
    })
  }, [isGlobular, object])
  const close = detailActive && viewDistance < object.visualScale * 14
  const medium = detailActive && viewDistance < object.visualScale * 20
  const visibleCount = close ? points.length : medium ? (isGlobular ? 90 : 18) : (isGlobular ? 28 : 8)
  const starSize = close
    ? (isGlobular ? 0.22 : 0.42)
    : medium ? (isGlobular ? 0.3 : 0.48) : Math.max(isGlobular ? 0.35 : 0.5, viewDistance * 0.0015)
  const visiblePositions = new Float32Array(points.slice(0, visibleCount).flat())
  const photoOpacity = getPhotoOpacity(object, focused, viewDistance)
  const modelOpacity = detailActive ? 1 - smoothstep(object.visualScale * 3, object.visualScale * 8, viewDistance) : opacity
  const starTexture = useMemo(createStarTexture, [])
  useEffect(() => () => starTexture.dispose(), [starTexture])
  if (opacity < 0.01) return null
  const selectMember = (index) => {
    const member = object.members?.[index]
    if (!member) return onSelect(object)
    onSelect({
      ...object, ...member, type: '별', subtype: `${object.nameKo} 구성 별`, image: null,
      distanceLy: null, distancePc: null, raDeg: null, decDeg: null,
      actualCartesian: { x: null, y: null, z: null },
      description: `${object.nameKo} 안에서 개별적으로 보이는 대표 구성 별입니다.`,
      educationalNote: '이 별의 화면상 위치는 성단의 성긴 분포를 보여 주기 위한 교육용 근사입니다.',
    })
  }
  return (
    <group position={positionOf(object)}>
      <HitArea radius={object.visualScale * 1.8} onSelect={() => onSelect(object)} />
      {object.image && photoOpacity > 0.01 && <ObservationImage object={object} opacity={photoOpacity} scale={object.visualScale * 5} />}
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[visiblePositions, 3]} /></bufferGeometry>
        <pointsMaterial map={starTexture} alphaTest={0.008} color={object.color} size={starSize * (isGlobular ? 4 : 5.5)} sizeAttenuation transparent opacity={opacity * (close ? 0.78 : 0.52)} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      {points.slice(0, visibleCount).map((point, index) => (
        <mesh key={index} position={point} scale={starSize * (isGlobular ? 0.52 : 0.7)} onClick={close && !isGlobular ? (event) => { event.stopPropagation(); selectMember(index) } : undefined}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color={object.color} transparent opacity={(close ? Math.max(modelOpacity, 0.25) : opacity) * (isGlobular ? 0.82 : 1)} />
        </mesh>
      ))}
      {isGlobular && <mesh scale={object.visualScale * 0.5}><sphereGeometry args={[1, 20, 20]} /><meshBasicMaterial color={object.color} transparent opacity={opacity * 0.09} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>}
      <ObjectLabel object={object} zoomLevel={zoomLevel} offset={object.visualScale * 1.3} selected={selected} />
    </group>
  )
}

function Nebula({ object, zoomLevel, onSelect, selected, focused, navigation }) {
  const focusOffset = navigation.current.target.distanceTo(new THREE.Vector3(...positionOf(object)))
  const viewDistance = Math.hypot(zoomToDistance(zoomLevel), focusOffset)
  const opacity = focused ? objectFadeOut(object, zoomLevel) : objectOpacity(object, zoomLevel)
  const photoOpacity = getPhotoOpacity(object, focused, viewDistance)
  if (opacity < 0.01) return null
  return (
    <group position={positionOf(object)}>
      <HitArea radius={object.visualScale * 1.4} onSelect={() => onSelect(object)} />
      {object.image && photoOpacity > 0.01 && <ObservationImage object={object} opacity={photoOpacity} scale={object.visualScale * 2.5} />}
      {[0, 1, 2, 3].map((index) => (
        <mesh key={index} rotation={[index * 0.22, index * 0.15, index * 0.82]} scale={[object.visualScale * (1 - index * 0.09), object.visualScale * (0.38 + index * 0.08), object.visualScale * 0.22]}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial color={index % 2 ? object.accent : object.color} transparent opacity={opacity * 0.08} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
      <ObjectLabel object={object} zoomLevel={zoomLevel} offset={object.visualScale} selected={selected} />
    </group>
  )
}

function Galaxy({ object, zoomLevel, onSelect, selected, focused, navigation }) {
  const isMilkyWay = object.id === 'milky-way'
  const isAndromeda = object.id === 'andromeda'
  const irregular = object.subtype?.includes('불규칙')
  const elliptical = object.subtype?.includes('타원')
  const [screenProminent, setScreenProminent] = useState(false)
  const screenProminentRef = useRef(false)
  const galaxyWorldPosition = useMemo(() => new THREE.Vector3(...positionOf(object)), [object])
  useFrame(({ camera }) => {
    if (isMilkyWay) return
    const projected = galaxyWorldPosition.clone().project(camera)
    const distanceFromCamera = camera.position.distanceTo(galaxyWorldPosition)
    const isInsideCentralView = Math.abs(projected.x) < 0.82 && Math.abs(projected.y) < 0.82 && projected.z > -1 && projected.z < 1
    const nextProminent = isInsideCentralView && distanceFromCamera < object.visualScale * 12
    if (nextProminent !== screenProminentRef.current) {
      screenProminentRef.current = nextProminent
      setScreenProminent(nextProminent)
    }
  })
  const focusOffset = navigation.current.target.distanceTo(new THREE.Vector3(...positionOf(object)))
  const viewDistance = Math.hypot(zoomToDistance(zoomLevel), focusOffset)
  const nearExternalGalaxy = !isMilkyWay && viewDistance < object.visualScale * 5
  const detailActive = selected || focused || screenProminent || nearExternalGalaxy || (zoomLevel >= object.visibleFromZoom && viewDistance < object.visualScale * 5)
  const opacity = detailActive ? objectFadeOut(object, zoomLevel) : objectOpacity(object, zoomLevel)
  const photoOpacity = getPhotoOpacity(object, focused, viewDistance)
  const canSelect = !isMilkyWay || zoomLevel >= 74
  const starTexture = useMemo(createStarTexture, [])
  useEffect(() => () => starTexture.dispose(), [starTexture])
  const particles = useMemo(() => {
    const count = isMilkyWay ? 1900 : irregular ? 780 : elliptical ? 620 : 1100
    const random = seededValues(object.id, count * 3)
    const data = []
    for (let i = 0; i < count; i += 1) {
      if (isMilkyWay && i < 330) {
        const alongBar = (random[i * 3] - 0.5) * object.visualScale * 0.7
        const barTaper = 1 - Math.abs(alongBar) / (object.visualScale * 0.36)
        data.push(
          alongBar,
          (random[i * 3 + 1] - 0.5) * object.visualScale * 0.13 * Math.max(0.24, barTaper),
          (random[i * 3 + 2] - 0.5) * object.visualScale * 0.045,
        )
        continue
      }
      if (elliptical) {
        const radius = Math.pow(random[i * 3], 1.85) * object.visualScale
        const azimuth = random[i * 3 + 1] * Math.PI * 2
        const polar = Math.acos(2 * random[i * 3 + 2] - 1)
        data.push(
          Math.sin(polar) * Math.cos(azimuth) * radius,
          Math.sin(polar) * Math.sin(azimuth) * radius * 0.72,
          Math.cos(polar) * radius * 0.48,
        )
        continue
      }
      const armProgress = Math.pow(random[i * 3], 0.72)
      const innerRadius = isMilkyWay ? object.visualScale * 0.3 : 0
      const radius = innerRadius + armProgress * (object.visualScale - innerRadius)
      const angle = irregular
        ? random[i * 3 + 1] * Math.PI * 2
        : isMilkyWay
          ? (i % 2) * Math.PI + armProgress * 5.15 + (random[i * 3 + 1] - 0.5) * (0.34 + armProgress * 0.28)
          : (i % 4) * Math.PI / 2 + radius / object.visualScale * 7 + (random[i * 3 + 1] - 0.5) * 0.7
      data.push(
        Math.cos(angle) * radius * (irregular ? 0.72 : 1),
        Math.sin(angle) * radius * (irregular ? 0.46 : 0.56),
        (random[i * 3 + 2] - 0.5) * object.visualScale * (irregular ? 0.18 : 0.04),
      )
    }
    return new Float32Array(data)
  }, [elliptical, irregular, isMilkyWay, object])
  const milkyWayBarParticles = useMemo(
    () => isMilkyWay ? particles.slice(0, 330 * 3) : null,
    [isMilkyWay, particles],
  )
  if (opacity < 0.01) return null
  return (
    <group position={positionOf(object)} rotation={[0.16, -0.08, irregular ? 0.2 : -0.12]}>
      {object.image && photoOpacity > 0.01 && <ObservationImage object={object} opacity={photoOpacity} scale={object.visualScale * 1.25} />}
      {isMilkyWay && <>
        <mesh scale={[object.visualScale, object.visualScale * 0.56, object.visualScale * 0.028]}>
          <sphereGeometry args={[1, 48, 18]} />
          <meshBasicMaterial color="#628ed1" transparent opacity={opacity * 0.065} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <points>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[milkyWayBarParticles, 3]} /></bufferGeometry>
          <pointsMaterial map={starTexture} alphaTest={0.01} color="#ffd8a0" size={9} sizeAttenuation transparent opacity={opacity * 0.72} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
      </>}
      {isMilkyWay && <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[particles, 3]} /></bufferGeometry>
        <pointsMaterial map={starTexture} alphaTest={0.005} color="#78a9ff" size={11} sizeAttenuation transparent opacity={opacity * 0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>}
      {!isMilkyWay && detailActive && <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[particles, 3]} /></bufferGeometry>
        <pointsMaterial map={starTexture} alphaTest={0.004} color={object.accent} size={isAndromeda ? 17 : 13} sizeAttenuation transparent opacity={opacity * (isAndromeda ? 0.62 : 0.42)} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>}
      <points onClick={canSelect ? (event) => { event.stopPropagation(); onSelect(object) } : undefined}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[particles, 3]} /></bufferGeometry>
        <pointsMaterial map={starTexture} alphaTest={0.015} color={object.color} size={isMilkyWay ? 5.2 : isAndromeda ? 10.5 : 7.5} sizeAttenuation transparent opacity={opacity * 0.98} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      {/* 실제/압축 렌더 위치는 유지하고, 겹친 천체만 선택 판정 깊이를 분리한다. */}
      {canSelect && (
        <group position={[0, 0, object.interactionDepthOffset ?? 0]}>
          <HitArea radius={object.visualScale * (object.hitAreaScale ?? 0.18)} onSelect={() => onSelect(object)} />
        </group>
      )}
      <ObjectLabel object={object} zoomLevel={zoomLevel} offset={object.visualScale * 0.68} selected={selected} />
    </group>
  )
}

function LocalGroup({ object, zoomLevel, onSelect, selected }) {
  const opacity = objectOpacity(object, zoomLevel)
  if (opacity < 0.01) return null
  return (
    <group>
      <group position={[0, object.visualScale * 0.15, 0]}><HitArea radius={280} onSelect={() => onSelect(object)} /></group>
      <ObjectLabel object={object} zoomLevel={zoomLevel} offset={object.visualScale * 0.15} selected={selected} />
    </group>
  )
}

function createCosmicWebGeometry() {
  // 특정 관측 지도의 복제가 아니라 필라멘트·밀집부·공동을 설명하는 교육용 네트워크다.
  const anchors = [
    [-138000, -42000, -52000], [-105000, 18000, -18000], [-72000, -8000, 26000],
    [-38000, 27000, 12000], [0, 0, 0], [36000, 22000, -18000], [76000, -9000, -44000],
    [118000, 33000, -10000], [-92000, 56000, 51000], [-43000, -54000, -22000],
    [18000, -42000, 36000], [64000, 54000, 52000], [132000, -37000, 35000],
    [-145000, 43000, 10000], [148000, 17000, -63000],
  ].map((point) => new THREE.Vector3(...point))
  const edges = [
    [0, 1], [1, 2], [1, 8], [1, 13], [2, 3], [2, 9], [3, 4], [3, 8], [4, 5],
    [4, 9], [4, 10], [5, 6], [5, 11], [6, 7], [6, 12], [7, 14], [10, 11], [11, 12],
  ]
  const random = seededValues('cosmic-web-education-model', edges.length * 5 + 900)
  const points = []
  const lines = []
  let randomIndex = 0
  edges.forEach(([startIndex, endIndex], edgeIndex) => {
    const start = anchors[startIndex]
    const end = anchors[endIndex]
    const direction = end.clone().sub(start).normalize()
    const side = direction.clone().cross(new THREE.Vector3(0.21, 0.83, 0.51)).normalize()
    const up = direction.clone().cross(side).normalize()
    let previous = null
    for (let step = 0; step <= 48; step += 1) {
      const t = step / 48
      const arc = Math.sin(Math.PI * t)
      const point = start.clone().lerp(end, t)
        .addScaledVector(side, Math.sin(t * Math.PI * 2 + edgeIndex) * 3600 * arc)
        .addScaledVector(up, Math.cos(t * Math.PI * 3 + edgeIndex * 0.7) * 2100 * arc)
      point.x += (random[randomIndex++ % random.length] - 0.5) * 900
      point.y += (random[randomIndex++ % random.length] - 0.5) * 900
      point.z += (random[randomIndex++ % random.length] - 0.5) * 900
      points.push(point.x, point.y, point.z)
      if (previous) lines.push(previous.x, previous.y, previous.z, point.x, point.y, point.z)
      previous = point
    }
  })
  return { points: new Float32Array(points), lines: new Float32Array(lines), anchors }
}

function createGalaxyClusterField(anchors) {
  const random = seededValues('nearby-galaxy-cluster-field', 1200)
  const positions = []
  let cursor = 0
  anchors.forEach((anchor, anchorIndex) => {
    const count = 12 + (anchorIndex % 5) * 4
    for (let index = 0; index < count; index += 1) {
      const radius = Math.pow(random[cursor++], 1.8) * (2400 + anchorIndex * 90)
      const theta = random[cursor++] * Math.PI * 2
      const phi = Math.acos(2 * random[cursor++] - 1)
      positions.push(
        anchor.x + radius * Math.sin(phi) * Math.cos(theta),
        anchor.y + radius * Math.sin(phi) * Math.sin(theta),
        anchor.z + radius * Math.cos(phi),
      )
    }
  })
  return new Float32Array(positions)
}

const NEARBY_GROUP_CENTER_COORDS = [
  [-11000, 2500, 8500], [7500, -5200, 10500], [14500, 6800, 3500],
  [-17500, -7200, -4500], [2500, 12500, -8500], [21500, -10500, -12500],
  [-25500, 9200, 6500], [10500, 15500, 15500], [-6500, -14500, 14000],
]

function createLaniakeaFlowGeometry(visualScale, worldOrigin) {
  // 앞 단계에서 보던 국부은하군·처녀자리 은하단·주변 은하 집단의 화면 좌표를
  // 그대로 흐름의 시작점으로 사용한다. 정확한 경계 지도가 아닌 연속성을 위한 모식화다.
  const connectedWorldAnchors = [
    [0, 0, 0],
    [-2400, 3900, 17400],
    ...NEARBY_GROUP_CENTER_COORDS.slice(0, 5),
  ]
  const anchors = connectedWorldAnchors.map((coords) => new THREE.Vector3(...coords).sub(worldOrigin))
  const random = seededValues('laniakea-connected-flow-education-model', 3200)
  const particles = []
  const lines = []
  const nodes = [0, 0, 0]
  let randomIndex = 0

  anchors.forEach((anchor, branchIndex) => {
    const side = anchor.clone().cross(new THREE.Vector3(0.17, 0.91, 0.37)).normalize()
    const lift = anchor.clone().cross(side).normalize()
    let previous = anchor.clone()
    nodes.push(anchor.x, anchor.y, anchor.z)

    for (let step = 0; step <= 54; step += 1) {
      const progress = step / 54
      const eased = smoothstep(0, 1, progress)
      const arc = Math.sin(Math.PI * progress)
      const center = anchor.clone().lerp(new THREE.Vector3(), eased)
        .addScaledVector(side, Math.sin(progress * Math.PI * 1.35 + branchIndex * 0.7) * visualScale * 0.055 * arc)
        .addScaledVector(lift, Math.cos(progress * Math.PI * 1.7 + branchIndex) * visualScale * 0.035 * arc)

      lines.push(previous.x, previous.y, previous.z, center.x, center.y, center.z)
      previous = center

      const density = step % 8 === 0 ? 5 : 2
      for (let copy = 0; copy < density; copy += 1) {
        const spread = visualScale * (0.012 + (1 - progress) * 0.012)
        particles.push(
          center.x + (random[randomIndex++] - 0.5) * spread,
          center.y + (random[randomIndex++] - 0.5) * spread,
          center.z + (random[randomIndex++] - 0.5) * spread,
        )
      }
      if (step % 12 === 0) nodes.push(center.x, center.y, center.z)
    }
  })

  return {
    particles: new Float32Array(particles),
    lines: new Float32Array(lines),
    nodes: new Float32Array(nodes),
  }
}

function LargeScaleMarker({ object, zoomLevel, onSelect, selected }) {
  const opacity = objectOpacity(object, zoomLevel)
  const isLaniakea = object.id === 'laniakea'
  const starTexture = useMemo(createStarTexture, [])
  useEffect(() => () => starTexture.dispose(), [starTexture])
  const structure = useMemo(() => {
    if (isLaniakea) return createLaniakeaFlowGeometry(object.visualScale, new THREE.Vector3(...positionOf(object)))
    const count = 72
    const random = seededValues(`${object.id}-large-scale`, count * 3)
    const positions = []
    for (let index = 0; index < count; index += 1) {
      const radius = Math.pow(random[index * 3], 1.8) * object.visualScale
      const angle = random[index * 3 + 1] * Math.PI * 2
      positions.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.72,
        (random[index * 3 + 2] - 0.5) * object.visualScale * 0.7,
      )
    }
    return { particles: new Float32Array(positions), lines: null, nodes: null }
  }, [isLaniakea, object])
  if (opacity < 0.01) return null
  return (
    <group position={positionOf(object)}>
      {isLaniakea && <>
        <lineSegments>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[structure.lines, 3]} /></bufferGeometry>
          <lineBasicMaterial color="#77cfff" transparent opacity={opacity * 0.42} blending={THREE.AdditiveBlending} depthWrite={false} />
        </lineSegments>
        <points>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[structure.particles, 3]} /></bufferGeometry>
          <pointsMaterial map={starTexture} alphaTest={0.003} color="#806de2" size={720} sizeAttenuation transparent opacity={opacity * 0.18} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
        <points>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[structure.nodes, 3]} /></bufferGeometry>
          <pointsMaterial map={starTexture} alphaTest={0.004} color="#fff0c7" size={880} sizeAttenuation transparent opacity={opacity * 0.92} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
      </>}
      <points onClick={(event) => { event.stopPropagation(); onSelect(object) }}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[structure.particles, 3]} /></bufferGeometry>
        <pointsMaterial map={starTexture} alphaTest={0.006} color={object.color} size={isLaniakea ? 330 : 115} sizeAttenuation transparent opacity={opacity * 0.76} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <HitArea radius={object.visualScale * (isLaniakea ? 0.35 : 0.7)} onSelect={() => onSelect(object)} />
      <ObjectLabel object={object} zoomLevel={zoomLevel} offset={object.visualScale * (isLaniakea ? 0.42 : 0.7)} selected={selected} />
    </group>
  )
}

function CosmicScaleScene({ zoomLevel, onSelect, selectedId }) {
  const geometry = useMemo(createCosmicWebGeometry, [])
  const nearbyGroupCenters = useMemo(() => NEARBY_GROUP_CENTER_COORDS.map((point) => new THREE.Vector3(...point)), [])
  const clusterField = useMemo(() => createGalaxyClusterField(nearbyGroupCenters), [nearbyGroupCenters])
  const clusterCenters = useMemo(() => new Float32Array(nearbyGroupCenters.flatMap((point) => [point.x, point.y, point.z])), [nearbyGroupCenters])
  const starTexture = useMemo(createStarTexture, [])
  useEffect(() => () => starTexture.dispose(), [starTexture])
  const groupOpacity = fadeWindow(zoomLevel, 99, 134, 5)
  const webOpacity = smoothstep(130, 139, zoomLevel) * (1 - smoothstep(142, 154, zoomLevel) * 0.18)
  if (groupOpacity < 0.01 && webOpacity < 0.01) return null
  return (
    <group name="LargeScaleUniverse">
      {groupOpacity > 0.01 && <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[clusterField, 3]} /></bufferGeometry>
        <pointsMaterial map={starTexture} alphaTest={0.008} color="#d8e8ff" size={285} sizeAttenuation transparent opacity={groupOpacity * 0.86} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>}
      {groupOpacity > 0.01 && <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[clusterCenters, 3]} /></bufferGeometry>
        <pointsMaterial map={starTexture} alphaTest={0.006} color="#fff0c9" size={720} sizeAttenuation transparent opacity={groupOpacity * 0.78} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>}
      {webOpacity > 0.01 && <>
        <lineSegments>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[geometry.lines, 3]} /></bufferGeometry>
          <lineBasicMaterial color="#79a9d4" transparent opacity={webOpacity * 0.42} blending={THREE.AdditiveBlending} depthWrite={false} />
        </lineSegments>
        <points>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[geometry.points, 3]} /></bufferGeometry>
          <pointsMaterial map={starTexture} alphaTest={0.006} color="#a9d5f4" size={340} sizeAttenuation transparent opacity={webOpacity * 0.9} blending={THREE.AdditiveBlending} depthWrite={false} />
        </points>
      </>}
      {LARGE_SCALE_STRUCTURES.map((object) => <LargeScaleMarker key={object.id} object={object} zoomLevel={zoomLevel} onSelect={onSelect} selected={selectedId === object.id} />)}
    </group>
  )
}

function Scene({ zoomLevel, orbit, navigation, onSelect, selectedId, selectedObject, focusedId, onCloseInfo, onExplore }) {
  const common = { zoomLevel, onSelect, selectedId, navigation }
  const milkyWay = GALAXIES.find((object) => object.id === 'milky-way')
  const localGroup = GALAXIES.find((object) => object.id === 'local-group')
  const externalGalaxies = GALAXIES.filter((object) => !['milky-way', 'local-group'].includes(object.id))
  const groundToSpace = smoothstep(3, 15, zoomLevel)
  const backgroundColor = new THREE.Color('#72b9e6').lerp(new THREE.Color('#02040a'), groundToSpace)
  return (
    <>
      <color attach="background" args={[backgroundColor]} />
      {zoomLevel < 8 && <fog attach="fog" args={[backgroundColor, 0.04, 0.32]} />}
      <ambientLight intensity={0.8} /><directionalLight position={[4, 8, 6]} intensity={2.2} color="#d9eaff" />
      <Sparkles count={420} scale={[14000, 9000, 5000]} size={2} speed={0.03} opacity={smoothstep(12, 42, zoomLevel) * (1 - smoothstep(104, 118, zoomLevel)) * 0.35} color="#aecbff" />
      <group name="Universe">
        <CosmicScaleScene zoomLevel={zoomLevel} onSelect={onSelect} selectedId={selectedId} />
        <group name="LocalGroup">
          <LocalGroup object={localGroup} {...common} selected={selectedId === localGroup.id} />
          <Galaxy object={milkyWay} {...common} selected={selectedId === milkyWay.id} focused={focusedId === milkyWay.id} />
          {externalGalaxies.map((object) => <Galaxy key={object.id} object={object} {...common} selected={selectedId === object.id} focused={focusedId === object.id} />)}
          <group name="MilkyWaySpace">
            <LocationMarker position={SPACE_ANCHORS.sun} label="태양계 위치" opacity={smoothstep(72, 82, zoomLevel) * (1 - smoothstep(102, 112, zoomLevel))} scale={zoomToDistance(zoomLevel) * 0.012} />
            <group name="SolarNeighborhood">
              {STARS.map((object) => <CelestialBody key={object.id} object={object} {...common} selected={selectedId === object.id} />)}
              {CLUSTERS.map((object) => <Cluster key={object.id} object={object} {...common} selected={selectedId === object.id} focused={focusedId === object.id} />)}
              {NEBULAE.map((object) => <Nebula key={object.id} object={object} {...common} selected={selectedId === object.id} focused={focusedId === object.id} />)}
              <SolarSystem {...common} /><EarthSystem {...common} />
            </group>
          </group>
        </group>
      </group>
      {selectedObject && (
        <ObjectInfoCard object={selectedObject} detailed={focusedId === selectedObject.id && Boolean(selectedObject.image)} onClose={onCloseInfo} onExplore={onExplore} />
      )}
      <CameraRig zoomLevel={zoomLevel} orbit={orbit} navigation={navigation} />
    </>
  )
}

const getStage = (zoom) => ZOOM_STAGES.find((stage) => zoom >= stage.min && zoom < stage.max) ?? ZOOM_STAGES.at(-1)
const SCALE_LABELS = [[0, '운동장 몇 m'], [10, '학교 주변 약 1 km'], [20, '지구 약 1만 km'], [32, '지구·달 약 80만 km'], [45, '태양계 약 45 AU'], [60, '주변 수천 광년'], [75, '약 10만 광년'], [90, '약 300만 광년'], [100, '약 1,000만 광년'], [110, '주변 수천만 광년'], [120, '초은하단 규모'], [130, '우주 거대 구조 규모'], [136, '관측 가능한 우주 규모']]
const formatScale = (zoom) => [...SCALE_LABELS].reverse().find(([at]) => zoom >= at)?.[1]

function formatDistance(object) {
  const epochLabel = object.distanceEpoch ? ` (${object.distanceEpoch.slice(0, 10).replaceAll('-', '.')} 기준)` : ''
  if (object.id === 'milky-way') return '우리가 속해 있는 은하'
  const formatted = formatDistanceFromEarth(object)
  return formatted === '확인된 거리 자료 없음' ? '지구 기준 실제 거리 자료 없음' : `지구에서 ${formatted}${epochLabel}`
}

function calculateInfoPosition(element, camera, size) {
  const projected = new THREE.Vector3()
  element.getWorldPosition(projected)
  projected.project(camera)
  const x = projected.x * size.width / 2 + size.width / 2
  const y = -(projected.y * size.height / 2) + size.height / 2
  if (size.width <= 720) {
    const halfCard = Math.min(160, size.width * 0.43)
    const maxTop = Math.max(24, size.height * 0.42 - 36)
    return [
      clamp(x, halfCard, size.width - halfCard),
      clamp(y, 24, maxTop),
    ]
  }
  const maxLeft = Math.max(24, size.width - 390)
  const verticalPadding = Math.min(235, size.height * 0.38)
  return [
    clamp(x, 24, maxLeft),
    clamp(y, verticalPadding, size.height - verticalPadding),
  ]
}

function calculateDetailedInfoPosition(element, camera, size) {
  const projected = new THREE.Vector3()
  element.getWorldPosition(projected)
  projected.project(camera)
  const objectX = projected.x * size.width / 2 + size.width / 2
  if (size.width <= 720) return [size.width / 2, size.height - 16]

  const cardX = objectX >= size.width / 2 ? 20 : size.width - 380
  return [cardX, size.height / 2]
}

function ObjectInfoCard({ object, detailed, onClose, onExplore }) {
  return (
    <Html position={positionOf(object)} calculatePosition={detailed ? calculateDetailedInfoPosition : calculateInfoPosition} zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
      <article
        className={`object-info-card ${detailed ? 'is-detailed' : ''}`}
        style={{ '--object-accent': object.accent ?? object.color ?? '#7be4ff' }}
        onPointerDown={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
      >
        <button className="close-button" onClick={onClose} aria-label="천체 설명 닫기">×</button>
        <p className="info-type">{object.type} · {object.subtype}</p>
        <h2>{object.nameKo}</h2>
        <p className="english-name">{object.nameEn}</p>
        <div className="info-card-facts">
          <span><small>거리</small>{formatDistance(object)}</span>
          {object.actualDiameterKm != null && <span><small>실제 크기</small>지름 약 {object.actualDiameterKm.toLocaleString('ko-KR')} km</span>}
          {object.actualDiameterLy != null && <span><small>실제 크기</small>지름 약 {object.actualDiameterLy.toLocaleString('ko-KR')} 광년</span>}
        </div>
        <p className="description">{object.description}</p>
        {(object.image || object.id === 'milky-way') && !detailed && <div className="info-card-actions">
          <button className={`explore-button ${object.id === 'milky-way' ? '' : 'attention-pulse'}`} onClick={(event) => { event.stopPropagation(); onExplore(object) }}>{object.id === 'milky-way' ? '우리은하 탐사하기' : '이 천체 자세히 보기'}</button>
        </div>}
      </article>
    </Html>
  )
}

function TypeLegend() {
  return (
    <div className="type-legend" aria-label="천체 종류 범례">
      {[['별', 'star'], ['산개성단', 'open'], ['구상성단', 'globular'], ['성운', 'nebula'], ['은하', 'galaxy']].map(([label, icon]) => (
        <span key={label}><i className={`legend-${icon}`} />{label}</span>
      ))}
    </div>
  )
}

function ExplorationTutorial({ step }) {
  if (!step) return null
  const isPinch = step === 'pinch'
  return (
    <aside className={`exploration-tutorial tutorial-${step}`} aria-live="polite">
      {isPinch
        ? <div className="pinch-icon" aria-hidden="true"><i /><i /></div>
        : <div className="earth-tap-icon" aria-hidden="true"><i /><b /></div>}
      <div className="tutorial-copy">
        <small>조작 안내 · {isPinch ? '1 / 2' : '2 / 2'}</small>
        <strong>{isPinch ? '두 손가락을 천천히 오므려 보세요' : '천체를 눌러 보세요'}</strong>
        <p>{isPinch
          ? '화면을 축소하며 학교에서 더 큰 우주로 나아갈 수 있어요.'
          : '천체를 누르면 이름과 거리, 특징을 확인할 수 있어요.'}</p>
        {isPinch && <em>마우스에서는 휠을 아래로 움직여 보세요.</em>}
      </div>
    </aside>
  )
}

const ADDRESS_PRELUDE_TEXT = '우리가 지금 있는 학교에서 출발해, 지구, 태양계를 지나 더 넓은 우주까지 나아가봅시다.\n크고 작은 우주 구조 속에서 내가 있는 곳은 어디인지, 나의 우주 주소를 함께 찾아볼까요?'

function AddressPrelude({ onComplete }) {
  const [typedText, setTypedText] = useState('')

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setTypedText(ADDRESS_PRELUDE_TEXT)
      const finish = window.setTimeout(onComplete, 1300)
      return () => window.clearTimeout(finish)
    }

    let index = 0
    let finish
    const typing = window.setInterval(() => {
      index += 1
      setTypedText(ADDRESS_PRELUDE_TEXT.slice(0, index))
      if (index >= ADDRESS_PRELUDE_TEXT.length) {
        window.clearInterval(typing)
        finish = window.setTimeout(onComplete, 1450)
      }
    }, 42)

    return () => {
      window.clearInterval(typing)
      window.clearTimeout(finish)
    }
  }, [onComplete])

  return (
    <div className="intro-copy address-prelude-copy">
      <p className="intro-kicker">MY COSMIC ADDRESS</p>
      <h1><span>나는 우주 어디쯤에 있을까?</span><strong>우주 속 나의 주소</strong></h1>
      <p className="address-typing" aria-live="polite">
        {typedText}<i className="typing-cursor" aria-hidden="true" />
      </p>
      <div className="address-prelude-progress" aria-hidden="true"><span /></div>
    </div>
  )
}

function IntroScreen({ phase, leaving, onStart, onMilkyWay, onPreludeComplete }) {
  if (phase === 'address') {
    return (
      <section className={`intro-screen address-prelude ${leaving ? 'is-leaving' : ''}`} aria-label="나의 우주 주소 탐사 소개">
        <div className="intro-orbits" aria-hidden="true"><i /><i /><i /></div>
        <div className="intro-flight-path" aria-hidden="true"><i /></div>
        <AddressPrelude onComplete={onPreludeComplete} />
        <div className="intro-ground" aria-hidden="true"><span /><i /></div>
      </section>
    )
  }

  return (
    <section className={`intro-screen ${leaving ? 'is-leaving' : ''}`} aria-labelledby="intro-title">
      <div className="intro-orbits" aria-hidden="true"><i /><i /><i /></div>
      <div className="intro-flight-path" aria-hidden="true"><i /></div>
      <div className="intro-copy home-intro-copy">
        <p className="intro-kicker">THE UNIVERSE AND ME</p>
        <h1 id="intro-title"><strong>우주와 나</strong><span>내가 있는 곳, 내가 살아가는 우주를 탐사하기</span></h1>
        <div className="landscape-tip">
          <div className="landscape-device" aria-hidden="true"><i /><b>↻</b></div>
          <div><strong>태블릿은 가로 모드로 돌려 주세요</strong><span>더 넓은 화면에서 우주를 편하고 생생하게 탐색할 수 있어요.</span></div>
        </div>
        <div className="intro-usage" aria-label="사용 방법">
          <article>
            <div className="gesture-picture drag-picture" aria-hidden="true"><i className="gesture-screen" /><i className="gesture-finger" /><b>↔</b></div>
            <div><strong>한 손가락</strong><span>화면을 밀어 우주 공간 둘러보기</span></div>
          </article>
          <article>
            <div className="gesture-picture pinch-picture" aria-hidden="true"><i className="gesture-screen" /><i className="gesture-finger left" /><i className="gesture-finger right" /><b>↔</b></div>
            <div><strong>두 손가락</strong><span>벌리고 오므려 확대·축소하기</span></div>
          </article>
          <article>
            <div className="gesture-picture tap-picture" aria-hidden="true"><i className="gesture-screen" /><i className="gesture-star">✦</i><i className="gesture-finger" /><b /></div>
            <div><strong>천체 터치</strong><span>천체를 눌러 이름과 정보 확인하기</span></div>
          </article>
        </div>
        <div className="intro-choices" aria-label="탐사 모드 선택">
          <button className="intro-choice primary" onClick={onStart} disabled={leaving}>
            <span><strong>우주 속 나의 주소</strong><small>나는 우주 어디쯤에 있을까?</small></span><i aria-hidden="true">→</i>
          </button>
          <button className="intro-choice" onClick={onMilkyWay} disabled={leaving}>
            <span><strong>내가 살고 있는 우리은하</strong><small>우리은하는 어떤 모습이고, 그 안에는 무엇이 있을까?</small></span><i aria-hidden="true">→</i>
          </button>
        </div>
      </div>
      <div className="intro-ground" aria-hidden="true"><span /><i /></div>
    </section>
  )
}

function ObservableUniverseNotice({ zoomLevel }) {
  if (zoomLevel < 134) return null
  const opacity = smoothstep(134, 139, zoomLevel)
  return (
    <aside className="observable-notice" style={{ opacity }} aria-live="polite">
      <p className="observable-eyebrow">현재 우리가 관측할 수 있는 가장 큰 규모</p>
      <h2>관측 가능한 우주</h2>
      <p>우리가 관측할 수 있는 우주의 범위입니다.</p>
      <p><strong>이것이 우주의 끝이라는 뜻은 아닙니다.</strong></p>
      <p>우주의 나이가 유한하고 빛이 이동하는 데 시간이 걸려, 우리가 볼 수 있는 범위에는 한계가 있습니다.</p>
      {zoomLevel >= 138 && <small>화면 밖은 아직 관측으로 확인할 수 없는 영역입니다. 구체적인 천체 정보는 표시하지 않습니다.</small>}
    </aside>
  )
}

export default function App() {
  const [zoomLevel, setZoomLevel] = useState(2)
  const [selectedObject, setSelectedObject] = useState(null)
  const [focusedId, setFocusedId] = useState(null)
  const [tutorialStep, setTutorialStep] = useState('pinch')
  const [earthTutorialDone, setEarthTutorialDone] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [introLeaving, setIntroLeaving] = useState(false)
  const [introPhase, setIntroPhase] = useState('menu')
  const canvasArea = useRef(null)
  const introTimer = useRef(null)
  const targetZoom = useRef(2)
  const orbit = useRef({ yaw: 0, pitch: 0.02 })
  const navigation = useRef({ focus: new THREE.Vector3(), target: new THREE.Vector3() })
  const gesture = useRef({ mode: null, distance: 0, zoom: 2, x: 0, y: 0, focus: new THREE.Vector3() })
  const stage = getStage(zoomLevel)
  const minimumZoomAtCurrentFocus = useCallback(() => {
    const focus = navigation.current.target
    const earthDistance = focus.distanceTo(new THREE.Vector3(...SPACE_ANCHORS.earthCenter))
    if (earthDistance <= 3.2) return 0

    let nearestObject = null
    let nearestDistance = Infinity
    ALL_OBJECTS.forEach((object) => {
      if (object.id === 'local-group') return
      const distanceToObject = focus.distanceTo(new THREE.Vector3(...positionOf(object)))
      if (distanceToObject < nearestDistance) {
        nearestDistance = distanceToObject
        nearestObject = object
      }
    })
    if (!nearestObject) return 12
    if (nearestObject.scaleGroup === 'largeScale') return 92
    if (nearestObject.id === 'milky-way') return 58
    if (nearestObject.type === '은하' || nearestObject.scaleGroup === 'localGroup') return 48
    if (nearestObject.type === '성단' || nearestObject.type === '성운') return 30
    if (nearestObject.scaleGroup === 'milkyWay') return 17
    if (nearestObject.scaleGroup === 'solarSystem') return 8
    return 12
  }, [])
  const constrainZoom = useCallback((value) => clamp(value, minimumZoomAtCurrentFocus(), MAX_ZOOM), [minimumZoomAtCurrentFocus])
  const setZoomTarget = useCallback((value) => {
    const next = constrainZoom(value)
    targetZoom.current = next
    setTutorialStep((step) => step === 'pinch' ? null : step)
    return next
  }, [constrainZoom])
  const selectObject = useCallback((object) => {
    setSelectedObject(object)
    setFocusedId(null)
    if (object.id === 'earth') {
      setTutorialStep(null)
      setEarthTutorialDone(true)
    }
  }, [])

  useEffect(() => {
    if (showIntro || earthTutorialDone) return
    if (zoomLevel >= 18 && zoomLevel < 31) {
      setTutorialStep((step) => step === null ? 'earth' : step)
    } else if (zoomLevel >= 31) {
      setTutorialStep((step) => step === 'earth' ? null : step)
      setEarthTutorialDone(true)
    }
  }, [earthTutorialDone, showIntro, zoomLevel])

  useEffect(() => {
    const area = canvasArea.current
    if (!area) return undefined
    const distance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
    const midpoint = (touches) => ({ x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 })
    const start = (event) => {
      if (event.touches.length === 2) {
        event.preventDefault()
        gesture.current = { ...gesture.current, mode: 'pinch', distance: distance(event.touches), zoom: targetZoom.current, focus: navigation.current.target.clone(), midpoint: midpoint(event.touches) }
      } else if (event.touches.length === 1) {
        gesture.current = { mode: 'drag', x: event.touches[0].clientX, y: event.touches[0].clientY, focus: navigation.current.target.clone() }
      }
    }
    const move = (event) => {
      if (event.touches.length === 2 && gesture.current.mode === 'pinch') {
        event.preventDefault()
        const gestureChange = -Math.log(distance(event.touches) / Math.max(gesture.current.distance, 1)) * 16 * zoomGestureFactor(gesture.current.zoom)
        const nextZoom = constrainZoom(gesture.current.zoom + gestureChange)
        const rect = area.getBoundingClientRect()
        const center = midpoint(event.touches)
        const oldDistance = zoomToDistance(gesture.current.zoom)
        const nextDistance = zoomToDistance(nextZoom)
        const worldPerPixel = 2 * Math.tan(THREE.MathUtils.degToRad(52 / 2)) / rect.height
        const deltaDistance = oldDistance - nextDistance
        navigation.current.target.copy(gesture.current.focus).add(new THREE.Vector3(
          (center.x - rect.left - rect.width / 2) * worldPerPixel * deltaDistance,
          -(center.y - rect.top - rect.height / 2) * worldPerPixel * deltaDistance,
          0,
        ))
        setZoomTarget(nextZoom)
      } else if (event.touches.length === 1 && gesture.current.mode === 'drag') {
        event.preventDefault()
        const scale = zoomToDistance(targetZoom.current) * 0.00125
        const dx = event.touches[0].clientX - gesture.current.x
        const dy = event.touches[0].clientY - gesture.current.y
        navigation.current.target.copy(gesture.current.focus).add(new THREE.Vector3(-dx * scale, dy * scale, 0))
        if (Math.abs(dx) + Math.abs(dy) > 8) setFocusedId(null)
      }
    }
    const end = (event) => {
      if (event.touches.length === 0) gesture.current.mode = null
      else if (event.touches.length === 1) gesture.current = { mode: 'drag', x: event.touches[0].clientX, y: event.touches[0].clientY, focus: navigation.current.target.clone() }
    }
    const wheel = (event) => {
      event.preventDefault()
      setZoomTarget(targetZoom.current + event.deltaY * 0.008 * zoomGestureFactor(targetZoom.current))
    }
    area.addEventListener('touchstart', start, { passive: false }); area.addEventListener('touchmove', move, { passive: false }); area.addEventListener('touchend', end, { passive: false }); area.addEventListener('touchcancel', end, { passive: false }); area.addEventListener('wheel', wheel, { passive: false })
    return () => { area.removeEventListener('touchstart', start); area.removeEventListener('touchmove', move); area.removeEventListener('touchend', end); area.removeEventListener('touchcancel', end); area.removeEventListener('wheel', wheel) }
  }, [constrainZoom, setZoomTarget])

  const exploreObject = useCallback((object) => {
    if (object.id === 'milky-way') {
      window.location.hash = '/milky-way'
      return
    }
    navigation.current.target.fromArray(positionOf(object))
    setFocusedId(object.id)
    const nextZoom = object.type === '성단' ? 45 : object.type === '성운' ? 50 : object.type === '은하' ? 72 : 42
    setZoomTarget(nextZoom)
  }, [setZoomTarget])

  const returnToEarth = useCallback(() => {
    navigation.current.target.set(0, 0, 0)
    setFocusedId(null)
    setSelectedObject(null)
    setZoomTarget(2)
  }, [setZoomTarget])

  const returnToHome = useCallback(() => {
    navigation.current.target.set(0, 0, 0)
    setFocusedId(null)
    setSelectedObject(null)
    targetZoom.current = 2
    setZoomLevel(2)
    setTutorialStep('pinch')
    setEarthTutorialDone(false)
    setIntroLeaving(false)
    setIntroPhase('menu')
    setShowIntro(true)
  }, [])

  const startExploration = useCallback(() => {
    if (introLeaving || introPhase !== 'menu') return
    setIntroPhase('address')
  }, [introLeaving, introPhase])

  const completeAddressPrelude = useCallback(() => {
    if (introLeaving) return
    setIntroLeaving(true)
    introTimer.current = window.setTimeout(() => setShowIntro(false), 900)
  }, [introLeaving])

  const startMilkyWayExploration = useCallback(() => {
    window.location.hash = '/milky-way'
  }, [])

  useEffect(() => () => window.clearTimeout(introTimer.current), [])

  useEffect(() => {
    let frame
    const animate = () => {
      setZoomLevel((current) => {
        const next = current + (targetZoom.current - current) * 0.12
        return Math.abs(next - targetZoom.current) < 0.005 ? targetZoom.current : next
      })
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  const selectedId = selectedObject?.id
  return (
    <main className="app-shell">
      <div className="canvas-area" ref={canvasArea}>
        <Canvas camera={{ position: [0, 0.018, 0.045], fov: 52, near: 0.00015, far: 400000 }} dpr={[1, 1.65]} gl={{ antialias: true, logarithmicDepthBuffer: true }} onPointerMissed={() => { setSelectedObject(null); setFocusedId(null) }}>
          <Scene
            zoomLevel={zoomLevel}
            orbit={orbit}
            navigation={navigation}
            onSelect={selectObject}
            selectedId={selectedId}
            selectedObject={selectedObject}
            focusedId={focusedId}
            onCloseInfo={() => { setSelectedObject(null); setFocusedId(null) }}
            onExplore={exploreObject}
          />
        </Canvas>
      </div>
      <header className="brand"><div className="brand-mark" aria-hidden="true"><span /></div><div><p>WHERE AM I IN THE UNIVERSE?</p><h1>우주 속 나의 주소</h1></div></header>
      <button className="global-home-tab" onClick={returnToHome} aria-label="처음 화면으로 돌아가기"><span>⌂</span> 처음으로</button>
      <section className="stage-title" aria-live="polite"><p>{stage.eyebrow}</p><h2>{stage.label}</h2></section>
      <section className="status-card" aria-label="현재 탐색 범위"><div className="status-topline"><span>ZOOM LEVEL</span><strong>{zoomLevel.toFixed(1)}</strong></div><div className="progress-track"><span style={{ width: `${zoomLevel / MAX_ZOOM * 100}%` }} /></div><div className="scale-readout"><span>현재 시야의 너비</span><strong>{formatScale(zoomLevel)}</strong></div></section>
      <nav className="zoom-rail" aria-label="우주 규모 단계">{ZOOM_STAGES.map((item, index) => <button key={item.label} className={stage.label === item.label ? 'active' : ''} onClick={() => setZoomTarget((item.min + Math.min(item.max, MAX_ZOOM)) / 2)} aria-label={`${item.label} 단계로 이동`}><span>{String(index + 1).padStart(2, '0')}</span><i /><em>{item.label}</em></button>)}</nav>
      <button className="home-button" onClick={returnToEarth}><span>⌂</span> 지구로 돌아가기</button>
      {zoomLevel >= 52 && zoomLevel < 90 && <TypeLegend />}
      {!showIntro && <ExplorationTutorial key={tutorialStep ?? 'complete'} step={tutorialStep} />}
      <p className="scale-note">천체의 표시 크기는 실제 비율과 다르며 관찰하기 쉽게 조정되어 있습니다. 성단·성운·외부 은하 사진은 지구에서 관측한 2차원 모습으로, 화면의 깊이는 실제 3차원 구조와 다를 수 있습니다.</p>
      <ObservableUniverseNotice zoomLevel={zoomLevel} />
      {showIntro && <IntroScreen phase={introPhase} leaving={introLeaving} onStart={startExploration} onMilkyWay={startMilkyWayExploration} onPreludeComplete={completeAddressPrelude} />}
    </main>
  )
}

// 개발 중 데이터 누락을 빠르게 확인하기 위한 참조입니다.
export const CATALOG_SIZE = ALL_OBJECTS.length
