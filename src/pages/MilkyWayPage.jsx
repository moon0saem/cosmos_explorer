import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { CLUSTERS, NEBULAE } from '../data/catalog.js'
import { publicAssetUrl } from '../data/astronomy.js'

const MODES = [['shape', '모양 탐사'], ['distribution', '대표적인 천체'], ['measure', '우리은하와 태양계'], ['earth', '지구에서 바라보기']]
const CATEGORIES = [['open', '산개성단'], ['globular', '구상성단'], ['nebula', '성운']]
const SOLAR_POSITION = new THREE.Vector3(20.5, 0, -6.5)
const GALAXY_RADIUS = 38
const SEASONS = [
  { id: 'spring', label: '봄', angle: 0 }, { id: 'summer', label: '여름', angle: Math.PI / 2 },
  { id: 'autumn', label: '가을', angle: Math.PI }, { id: 'winter', label: '겨울', angle: Math.PI * 1.5 },
]
const NAMED_POSITIONS = {
  pleiades: [20.5, .2, -5], hyades: [18, -.15, -8], m13: [8, 13, 4], 'omega-centauri': [-5, -15, -7],
  'orion-nebula': [19.5, .1, -3.5], 'eagle-nebula': [15, .05, 9], 'lagoon-nebula': [11, -.1, 5],
  'horsehead-nebula': [18.5, .15, -2.5],
}

function formatPcDistance(object) {
  if (!Number.isFinite(object?.distancePc) || !Number.isFinite(object?.distanceLy)) return '확인된 거리 자료 없음'
  const pcDigits = object.distancePc >= 100 ? 0 : 1
  return `약 ${object.distancePc.toLocaleString('ko-KR', { maximumFractionDigits: pcDigits })} pc (${object.distanceLy.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}광년)`
}

function seededRandom(seed) {
  let value = seed >>> 0
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296 }
}

function makeGalaxyGeometry() {
  const random = seededRandom(240513), disk = [], arms = [], bar = [], bulge = [], halo = []
  for (let i = 0; i < 3200; i += 1) {
    const radius = Math.pow(random(), .72) * GALAXY_RADIUS, angle = random() * Math.PI * 2
    disk.push(Math.cos(angle) * radius, (random() - .5) * (1.1 + 2.5 * (1 - radius / GALAXY_RADIUS)), Math.sin(angle) * radius)
  }
  for (let arm = 0; arm < 4; arm += 1) for (let i = 0; i < 600; i += 1) {
    const t = random(), radius = 7 + t * 31, angle = arm * Math.PI / 2 + t * Math.PI * 2.15 + (random() - .5) * .14
    arms.push(Math.cos(angle) * radius, (random() - .5) * .7, Math.sin(angle) * radius)
  }
  for (let i = 0; i < 720; i += 1) { const x = (random() - .5) * 23; bar.push(x, (random() - .5) * (2.4 - Math.abs(x) * .07), (random() - .5) * 4.2) }
  for (let i = 0; i < 900; i += 1) { const r = Math.pow(random(), 1.8) * 9, a = random() * Math.PI * 2, p = Math.acos(2 * random() - 1); bulge.push(Math.sin(p) * Math.cos(a) * r, Math.cos(p) * r * .55, Math.sin(p) * Math.sin(a) * r) }
  for (let i = 0; i < 380; i += 1) { const r = 9 + Math.pow(random(), .6) * 35, a = random() * Math.PI * 2, p = Math.acos(2 * random() - 1); halo.push(Math.sin(p) * Math.cos(a) * r, Math.cos(p) * r * .62, Math.sin(p) * Math.sin(a) * r) }
  return { disk: new Float32Array(disk), arms: new Float32Array(arms), bar: new Float32Array(bar), bulge: new Float32Array(bulge), halo: new Float32Array(halo) }
}

function PointCloud({ positions, color, size, opacity }) {
  return <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color={color} size={size} sizeAttenuation transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} /></points>
}

function PulseGroup({ active, children, position }) {
  const group = useRef()
  useFrame(({ clock }) => {
    if (!group.current) return
    group.current.visible = !active || Math.sin(clock.elapsedTime * 7.5) > -.15
  })
  return <group ref={group} position={position}>{children}</group>
}

function ClusterGlyph({ object, position, globular, highlighted, onSelect, color, emphasized = false }) {
  const points = useMemo(() => {
    const random = seededRandom(object.id.length * 1097), values = [], count = globular ? 160 : 18
    for (let i = 0; i < count; i += 1) {
      if (globular) { const r = Math.pow(random(), 2.45) * 1.28, a = random() * Math.PI * 2, p = Math.acos(2 * random() - 1); values.push(Math.sin(p) * Math.cos(a) * r, Math.cos(p) * r, Math.sin(p) * Math.sin(a) * r) }
      else values.push((random() - .5) * 2.6, (random() - .5) * .45, (random() - .5) * 2.6)
    }
    return new Float32Array(values)
  }, [globular, object.id])
  const clusterColor = color ?? (globular ? '#e7dfc9' : '#b9ddff')
  return <PulseGroup position={position} active={highlighted}><group onClick={(event) => { event.stopPropagation(); onSelect(object) }}>{globular && <mesh scale={emphasized ? .72 : .58}><sphereGeometry args={[1, 20, 16]} /><meshBasicMaterial color={clusterColor} transparent opacity={emphasized ? .12 : .075} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>}<PointCloud positions={points} color={clusterColor} size={globular ? (emphasized ? .24 : .19) : .27} opacity={globular ? .9 : .95} /><mesh><sphereGeometry args={[1.8, 12, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh></group></PulseGroup>
}

function NebulaShape({ object }) {
  if (object.id === 'horsehead-nebula') return <><mesh scale={[2.1, .8, 1.4]}><sphereGeometry args={[1, 18, 12]} /><meshBasicMaterial color="#c56757" transparent opacity={.17} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh><mesh position={[0, .05, .15]} scale={[.7, 1.05, .55]}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color="#09080b" transparent opacity={.82} depthWrite={false} /></mesh></>
  const color = object.id === 'eagle-nebula' ? '#cf8d71' : '#c084ff'
  return <>{[[-.7, 0, 0, 1.3], [.6, .12, .2, 1], [0, -.1, -.6, .85]].map(([x, y, z, scale], index) => <mesh key={index} position={[x, y, z]} scale={[scale * 1.5, scale * .55, scale]}><sphereGeometry args={[1, 18, 12]} /><meshBasicMaterial color={color} transparent opacity={.14} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>)}</>
}

function NebulaGlyph({ object, position, highlighted, onSelect }) {
  return <PulseGroup position={position} active={highlighted}><group onClick={(event) => { event.stopPropagation(); onSelect(object) }}><NebulaShape object={object} /><mesh><sphereGeometry args={[2.4, 12, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh></group></PulseGroup>
}

function DistributionObjects({ highlight, onSelect }) {
  const openClusters = CLUSTERS.filter((object) => !object.subtype.includes('구상성단'))
  return <>{openClusters.map((object) => <ClusterGlyph key={object.id} object={object} position={NAMED_POSITIONS[object.id]} globular={false} highlighted={highlight === 'open' || (highlight === 'nebula' && object.id === 'pleiades')} onSelect={onSelect} />)}{NEBULAE.map((object) => <NebulaGlyph key={object.id} object={object} position={NAMED_POSITIONS[object.id]} highlighted={highlight === 'nebula'} onSelect={onSelect} />)}</>
}

function HaloClusterField({ highlighted, prominent }) {
  const points = useMemo(() => {
    const random = seededRandom(731905), values = []
    for (let clusterIndex = 0; clusterIndex < 16; clusterIndex += 1) {
      const haloRadius = 13 + random() * 27
      const azimuth = random() * Math.PI * 2
      const polar = Math.acos(2 * random() - 1)
      const center = new THREE.Vector3(
        Math.sin(polar) * Math.cos(azimuth) * haloRadius,
        Math.cos(polar) * haloRadius * .72,
        Math.sin(polar) * Math.sin(azimuth) * haloRadius,
      )
      const count = 22 + Math.floor(random() * 18)
      for (let starIndex = 0; starIndex < count; starIndex += 1) {
        const radius = Math.pow(random(), 2.3) * (.34 + random() * .32)
        const starAzimuth = random() * Math.PI * 2
        const starPolar = Math.acos(2 * random() - 1)
        values.push(
          center.x + Math.sin(starPolar) * Math.cos(starAzimuth) * radius,
          center.y + Math.cos(starPolar) * radius,
          center.z + Math.sin(starPolar) * Math.sin(starAzimuth) * radius,
        )
      }
    }
    return new Float32Array(values)
  }, [])
  return <PulseGroup position={[0, 0, 0]} active={highlighted}><PointCloud positions={points} color="#b6c7df" size={prominent ? .13 : .105} opacity={prominent ? .52 : .32} /></PulseGroup>
}

function HaloGlobularClusters({ highlight, onSelect, mode }) {
  const globularClusters = CLUSTERS.filter((object) => object.subtype.includes('구상성단'))
  const featured = mode === 'distribution'
  return <><HaloClusterField highlighted={highlight === 'globular'} prominent={featured} />{globularClusters.map((object) => <ClusterGlyph key={object.id} object={object} position={NAMED_POSITIONS[object.id]} globular highlighted={highlight === 'globular'} onSelect={onSelect} emphasized={featured} color={featured ? (object.id === 'm13' ? '#ffd39c' : '#cde7ff') : '#e2ddcf'} />)}</>
}

function SolarPositionMarker() {
  const group = useRef(), material = useRef()
  useFrame(({ clock }) => {
    const pulse = .5 + .5 * Math.sin(clock.elapsedTime * 5.5)
    group.current?.scale.setScalar(.88 + pulse * .34)
    if (material.current) material.current.opacity = .35 + pulse * .65
  })
  return <group ref={group} position={SOLAR_POSITION}><mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[1.05, 1.24, 40]} /><meshBasicMaterial ref={material} color="#7be4ff" transparent opacity={.8} side={THREE.DoubleSide} depthWrite={false} /></mesh></group>
}

function MeasurementOverlay({ measurement }) {
  if (!measurement) return null
  if (measurement === 'solar-position') return <SolarPositionMarker />
  const diameter = measurement === 'diameter'
  const start = diameter ? [-GALAXY_RADIUS, 1.2, 0] : [0, 1.2, 0]
  const end = diameter ? [GALAXY_RADIUS, 1.2, 0] : [SOLAR_POSITION.x, 1.2, SOLAR_POSITION.z]
  const midpoint = start.map((value, index) => (value + end[index]) / 2)
  return <group><Line points={[start, end]} color={diameter ? '#ffc96f' : '#7be4ff'} lineWidth={2} dashed dashSize={.8} gapSize={.45} /><mesh position={start}><sphereGeometry args={[.55, 16, 16]} /><meshBasicMaterial color={diameter ? '#ffc96f' : '#fff3bd'} /></mesh><mesh position={end}><sphereGeometry args={[.55, 16, 16]} /><meshBasicMaterial color={diameter ? '#ffc96f' : '#7be4ff'} /></mesh><Html position={midpoint} center><div className="mw-measure-label"><strong>{diameter ? '우리은하의 지름' : '태양계 ↔ 은하 중심'}</strong><span>{diameter ? '약 30,000 pc (약 98,000광년)' : '약 8,500 pc (약 27,700광년)'}</span><small>화면의 선은 위치를 비교하기 위한 모식 표현</small></div></Html></group>
}

function earthOrbitState(angle) {
  const centerDirection = SOLAR_POSITION.clone().multiplyScalar(-1).normalize()
  const tangent = new THREE.Vector3(-centerDirection.z, 0, centerDirection.x)
  const nightDirection = tangent.multiplyScalar(Math.cos(angle)).add(centerDirection.multiplyScalar(Math.sin(angle))).normalize()
  const earth = SOLAR_POSITION.clone().addScaledVector(nightDirection, 2.25)
  const dot = SOLAR_POSITION.dot(nightDirection)
  const pathLength = -dot + Math.sqrt(dot * dot + GALAXY_RADIUS ** 2 - SOLAR_POSITION.lengthSq())
  const minPath = GALAXY_RADIUS - SOLAR_POSITION.length(), maxPath = GALAXY_RADIUS + SOLAR_POSITION.length()
  return { earth, nightDirection, pathRatio: THREE.MathUtils.clamp((pathLength - minPath) / (maxPath - minPath), 0, 1) }
}

function GalaxyModel({ mode, highlight, measurement, yearAngle, onSelect }) {
  const geometry = useMemo(makeGalaxyGeometry, [])
  const inside = mode === 'earth'
  return <group><PointCloud positions={geometry.disk} color="#8bb9e9" size={inside ? .22 : .11} opacity={inside ? .58 : .3} /><PointCloud positions={geometry.arms} color="#c2e2ff" size={inside ? .3 : .18} opacity={inside ? .88 : .6} /><PointCloud positions={geometry.bar} color="#ffe0a8" size={inside ? .3 : .2} opacity={inside ? .92 : .78} /><PointCloud positions={geometry.bulge} color="#ffd59b" size={inside ? .34 : .24} opacity={inside ? .9 : .68} /><PointCloud positions={geometry.halo} color="#9fb7df" size={.14} opacity={mode === 'distribution' ? .42 : .2} /><HaloGlobularClusters highlight={highlight} onSelect={onSelect} mode={mode} />{mode === 'distribution' && <DistributionObjects highlight={highlight} onSelect={onSelect} />}{mode === 'measure' && <MeasurementOverlay measurement={measurement} />}</group>
}

function GalaxyCamera({ view, orbit, distance, mode, yearAngle }) {
  useFrame(({ camera }, delta) => {
    let desired, target = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), desiredFov = 48
    if (mode === 'earth') { const { nightDirection } = earthOrbitState(yearAngle); desired = SOLAR_POSITION.clone().add(new THREE.Vector3(0, .35, 0)); target = desired.clone().addScaledVector(nightDirection, 18); desiredFov = 72 }
    else if (view === 'top') { desired = new THREE.Vector3(0, 70, .01); up = new THREE.Vector3(0, 0, -1) }
    else if (view === 'side') desired = new THREE.Vector3(0, 7, 72)
    else { const r = distance.current; desired = new THREE.Vector3(Math.sin(orbit.current.yaw) * Math.cos(orbit.current.pitch) * r, Math.sin(orbit.current.pitch) * r, Math.cos(orbit.current.yaw) * Math.cos(orbit.current.pitch) * r) }
    const easing = 1 - Math.exp(-delta * 3.2); camera.position.lerp(desired, easing); camera.up.lerp(up, easing).normalize(); camera.fov = THREE.MathUtils.lerp(camera.fov, desiredFov, easing); camera.lookAt(target); camera.near = mode === 'earth' ? .025 : .1; camera.updateProjectionMatrix()
  })
  return null
}

function ObjectCard({ object, onClose }) {
  if (!object) return null
  return <aside className={`mw-object-card ${object.image ? 'has-image' : ''}`}><button onClick={onClose} aria-label="천체 정보 닫기">×</button>{object.image && <figure key={`${object.id}-observation`}><img src={publicAssetUrl(object.image)} alt={`${object.nameKo} 관측 이미지`} loading="eager" /><figcaption>지구에서 관측한 실제 이미지</figcaption></figure>}<small>{object.type} · {object.subtype}</small><h2>{object.nameKo}</h2><p className="mw-object-en">{object.nameEn}</p><p><strong>지구에서의 거리</strong>{formatPcDistance(object)}</p><p>{object.description}</p></aside>
}

function EarthViewPanel({ angle, setAngle, playing, setPlaying }) {
  const { pathRatio, nightDirection } = earthOrbitState(angle)
  const nearest = SEASONS.reduce((best, item) => Math.abs(Math.atan2(Math.sin(angle - item.angle), Math.cos(angle - item.angle))) < Math.abs(Math.atan2(Math.sin(angle - best.angle), Math.cos(angle - best.angle))) ? item : best, SEASONS[0])
  const solarX = 50 + SOLAR_POSITION.x / GALAXY_RADIUS * 39
  const solarY = 50 + SOLAR_POSITION.z / GALAXY_RADIUS * 39
  const earthX = solarX + nightDirection.x * 6.5
  const earthY = solarY + nightDirection.z * 6.5
  const nightX = earthX + nightDirection.x * 18
  const nightY = earthY + nightDirection.z * 18
  const direction = pathRatio > .66 ? '은하 중심 쪽' : pathRatio < .34 ? '은하 바깥쪽' : '은하 원반을 비스듬히 보는 방향'
  const skyStyle = { '--band-opacity': .24 + pathRatio * .68, '--band-height': `${14 + pathRatio * 27}%`, '--band-blur': `${6.2 - pathRatio * 2.8}px` }
  return <aside className="earth-view-panel"><div className="season-controls">{SEASONS.map((item) => <button key={item.id} className={nearest.id === item.id && !playing ? 'active' : ''} onClick={() => { setPlaying(false); setAngle(item.angle) }}>{item.label}</button>)}</div><section className="earth-local-orbit earth-galaxy-map"><h3>우리은하 위 태양계와 지구 공전</h3><svg viewBox="0 0 100 100" role="img" aria-label={`${nearest.label}의 지구 위치와 우리은하 안에서 바라보는 밤 방향`}><defs><radialGradient id="galaxyGlow"><stop offset="0" stopColor="#ffe0a8" stopOpacity=".9" /><stop offset=".24" stopColor="#83b9eb" stopOpacity=".42" /><stop offset="1" stopColor="#24476f" stopOpacity=".05" /></radialGradient><marker id="nightArrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5z" fill="#7be4ff" /></marker></defs><circle cx="50" cy="50" r="42" className="galaxy-map-disk" /><circle cx="50" cy="50" r="35" className="galaxy-map-arm" /><circle cx="50" cy="50" r="27" className="galaxy-map-arm arm-two" /><circle cx="50" cy="50" r="18" className="galaxy-map-arm arm-three" /><line x1="39" y1="56" x2="61" y2="44" className="galaxy-map-bar" /><circle cx="50" cy="50" r="3" className="galaxy-map-center" /><text x="43" y="47" className="galaxy-center-text">은하 중심</text><line x1={solarX} y1={solarY} x2="50" y2="50" className="center-guide" /><circle cx={solarX} cy={solarY} r="6.5" className="earth-orbit-large" /><circle cx={solarX} cy={solarY} r="2.4" className="season-sun" /><circle cx={earthX} cy={earthY} r="2.1" className="season-earth" /><line x1={solarX} y1={solarY} x2={earthX} y2={earthY} className="sun-ray" /><line x1={earthX} y1={earthY} x2={nightX} y2={nightY} className="night-arrow" markerEnd="url(#nightArrow)" /><text x={solarX + 3} y={solarY - 3}>태양계</text><text x={nightX + 1} y={nightY}>밤쪽</text></svg><p>지구 공전궤도는 우리은하 크기에 비해 매우 크게 확대했습니다.</p></section><section className="earth-direction-readout"><small>현재 3D 밤하늘 방향</small><strong>{direction}</strong><span>별이 많은 원반을 통과하는 상대적 길이 <b>{Math.round(pathRatio * 100)}%</b></span><i><em style={{ width: `${Math.max(8, pathRatio * 100)}%` }} /></i></section><section className="earth-night-sky" style={skyStyle}><h3>{nearest.label}에 보이는 은하수</h3><div className="season-band" /><span>{direction}을 바라보며 보이는 별의 겹침 정도를 반영했습니다.</span><small>위 3D 시점 및 공전 그림과 같은 밤 방향</small></section><div className="year-controls"><button onClick={() => setPlaying((value) => !value)}>{playing ? '일시정지' : '1년 동안 보기'}</button><button onClick={() => { setPlaying(false); setAngle(0) }}>처음으로</button></div></aside>
}

export default function MilkyWayPage() {
  const [mode, setMode] = useState('shape'), [view, setView] = useState('free'), [highlight, setHighlight] = useState(null)
  const [measurement, setMeasurement] = useState(null), [selected, setSelected] = useState(null), [showScienceNote, setShowScienceNote] = useState(false)
  const [yearAngle, setYearAngle] = useState(0), [playing, setPlaying] = useState(false)
  const [showIntro, setShowIntro] = useState(true), [introLeaving, setIntroLeaving] = useState(false)
  const highlightTimer = useRef(null)
  const interaction = useRef(null), gesture = useRef({ type: null, x: 0, y: 0, distance: 0 }), orbit = useRef({ yaw: .65, pitch: .42 }), cameraDistance = useRef(73)
  useEffect(() => { if (!playing) return undefined; let frame, previous = performance.now(); const animate = (now) => { const delta = Math.min(.05, (now - previous) / 1000); previous = now; setYearAngle((value) => (value + delta * .42) % (Math.PI * 2)); frame = requestAnimationFrame(animate) }; frame = requestAnimationFrame(animate); return () => cancelAnimationFrame(frame) }, [playing])
  useEffect(() => { const leave = window.setTimeout(() => setIntroLeaving(true), 1650); const remove = window.setTimeout(() => setShowIntro(false), 2550); return () => { window.clearTimeout(leave); window.clearTimeout(remove) } }, [])
  useEffect(() => () => window.clearTimeout(highlightTimer.current), [])
  useEffect(() => {
    const area = interaction.current; if (!area) return undefined
    const touchDistance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
    const start = (event) => { if (event.touches.length === 2) gesture.current = { type: 'pinch', distance: touchDistance(event.touches), startDistance: cameraDistance.current }; else if (event.touches.length === 1) gesture.current = { type: 'drag', x: event.touches[0].clientX, y: event.touches[0].clientY } }
    const move = (event) => { event.preventDefault(); if (event.touches.length === 2 && gesture.current.type === 'pinch') cameraDistance.current = THREE.MathUtils.clamp(gesture.current.startDistance * gesture.current.distance / touchDistance(event.touches), 38, 120); else if (event.touches.length === 1 && gesture.current.type === 'drag' && mode !== 'earth') { const touch = event.touches[0]; orbit.current.yaw -= (touch.clientX - gesture.current.x) * .007; orbit.current.pitch = THREE.MathUtils.clamp(orbit.current.pitch + (touch.clientY - gesture.current.y) * .005, -.05, 1.42); gesture.current.x = touch.clientX; gesture.current.y = touch.clientY; setView('free') } }
    const wheel = (event) => { event.preventDefault(); cameraDistance.current = THREE.MathUtils.clamp(cameraDistance.current + event.deltaY * .045, 38, 120) }
    area.addEventListener('touchstart', start, { passive: false }); area.addEventListener('touchmove', move, { passive: false }); area.addEventListener('wheel', wheel, { passive: false })
    return () => { area.removeEventListener('touchstart', start); area.removeEventListener('touchmove', move); area.removeEventListener('wheel', wheel) }
  }, [mode])
  const selectMode = (next) => { setMode(next); setSelected(null); setPlaying(false); if (next === 'measure') setView('free'); else if (next === 'earth') setView('top') }
  const triggerHighlight = (id) => { window.clearTimeout(highlightTimer.current); setHighlight(id); highlightTimer.current = window.setTimeout(() => setHighlight(null), 3000) }
  return <main className="milky-way-explorer"><div className="mw-canvas" ref={interaction} onPointerDown={(event) => { if (event.pointerType === 'touch') return; gesture.current = { type: 'mouse', x: event.clientX, y: event.clientY }; event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={(event) => { if (gesture.current.type !== 'mouse' || mode === 'earth') return; orbit.current.yaw -= (event.clientX - gesture.current.x) * .007; orbit.current.pitch = THREE.MathUtils.clamp(orbit.current.pitch + (event.clientY - gesture.current.y) * .005, -.05, 1.42); gesture.current.x = event.clientX; gesture.current.y = event.clientY; setView('free') }} onPointerUp={() => { gesture.current.type = null }}><Canvas camera={{ position: [30, 28, 58], fov: 48, near: .1, far: 500 }} dpr={[1, 1.5]} gl={{ antialias: true }} onPointerMissed={() => setSelected(null)}><color attach="background" args={['#01030a']} /><GalaxyModel mode={mode} highlight={highlight} measurement={measurement} yearAngle={yearAngle} onSelect={setSelected} /><GalaxyCamera view={view} orbit={orbit} distance={cameraDistance} mode={mode} yearAngle={yearAngle} /></Canvas></div>
    <header className="mw-header"><button className="milky-way-back" onClick={() => { window.location.hash = '' }} aria-label="처음 화면으로 돌아가기"><span>⌂</span> 처음으로</button><div><p>INWARD JOURNEY</p><h1>안으로 들어가는 우리은하 여행</h1><span>우리은하를 직접 움직여 보며 모양과 천체의 분포를 발견해 보자.</span></div><button className="mw-science-button" onClick={() => setShowScienceNote((value) => !value)}>i</button></header>
    {showScienceNote && <aside className="mw-science-note"><strong>관측 자료와 모식도의 구분</strong><p>우리은하 전체는 밖에서 촬영할 수 없습니다. 이 화면은 여러 파장의 관측 자료를 바탕으로 재구성한 교육용 모식도입니다. 지름은 약 30,000 pc(약 98,000광년), 태양계에서 중심까지의 거리는 약 8,500 pc(약 27,700광년)를 기준으로 표시했습니다.</p></aside>}
    <div className="mw-top-tools"><nav className="mw-mode-tabs" aria-label="우리은하 탐사 기능">{MODES.map(([id, label], index) => <button key={id} className={mode === id ? 'active' : ''} onClick={() => selectMode(id)}><span>{index + 1}</span>{label}</button>)}</nav>{mode === 'shape' && <div className="mw-view-controls"><button className={view === 'top' ? 'active' : ''} onClick={() => setView('top')}>위에서 보기</button><button className={view === 'side' ? 'active' : ''} onClick={() => setView('side')}>옆에서 보기</button><button className={view === 'free' ? 'active' : ''} onClick={() => setView('free')}>자유롭게 보기</button></div>}{mode === 'measure' && <div className="mw-measure-controls"><button className={measurement === 'diameter' ? 'active' : ''} onClick={() => setMeasurement('diameter')}>우리은하의 지름</button><button className={measurement === 'solar-position' ? 'active' : ''} onClick={() => setMeasurement('solar-position')}>태양계의 위치</button><button className={measurement === 'solar-center' ? 'active' : ''} onClick={() => setMeasurement('solar-center')}>태양계–중심 사이 거리</button></div>}</div>
    {mode === 'distribution' && <div className="mw-emphasis-controls">{CATEGORIES.map(([id, label]) => <button key={id} className={highlight === id ? `active filter-${id}` : ''} onClick={() => triggerHighlight(id)}>{label}</button>)}</div>}
    {mode === 'earth' && <EarthViewPanel angle={yearAngle} setAngle={setYearAngle} playing={playing} setPlaying={setPlaying} />}
    <button className="mw-overview-button" onClick={() => { setMode('shape'); setView('top'); setPlaying(false) }}>우리은하 전체 보기</button><ObjectCard object={selected} onClose={() => setSelected(null)} />
    {showIntro && <section className={`mw-entry-image ${introLeaving ? 'is-leaving' : ''}`} aria-label="우리은하 탐사 시작"><img src={publicAssetUrl('/astronomy/milky-way-explorer-intro.png')} alt="관측 자료를 바탕으로 재구성한 막대나선형 우리은하 모식도" /><div><small>INWARD JOURNEY</small><strong>안으로 들어가는 우리은하 여행</strong></div></section>}
  </main>
}
