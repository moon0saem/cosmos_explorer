export const LIGHT_YEARS_PER_PARSEC = 3.261563777
export const AU_PER_PARSEC = 206264.80624709636
export const KM_PER_AU = 149597870.7

/** public 폴더 자산을 로컬 개발과 GitHub Pages 하위 경로에서 모두 찾는다. */
export function publicAssetUrl(path) {
  if (!path || /^(?:https?:|data:)/.test(path)) return path
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}

const DEG_TO_RAD = Math.PI / 180
const emptyCartesian = () => ({ x: null, y: null, z: null })
const hasNumber = (value) => Number.isFinite(value)

/**
 * 태양 중심 ICRS 적도 좌표계의 직교좌표(pc)를 만든다.
 * +x: RA 0°, Dec 0° / +y: RA 90°, Dec 0° / +z: 북천구극.
 * 이 좌표는 실제 거리 계산 전용이며 Three.js 장면 좌표로 사용하지 않는다.
 */
export function equatorialToCartesianPc(raDeg, decDeg, distancePc) {
  if (![raDeg, decDeg, distancePc].every(hasNumber) || distancePc < 0) return emptyCartesian()
  const ra = raDeg * DEG_TO_RAD
  const dec = decDeg * DEG_TO_RAD
  const cosDec = Math.cos(dec)
  return {
    x: distancePc * cosDec * Math.cos(ra),
    y: distancePc * cosDec * Math.sin(ra),
    z: distancePc * Math.sin(dec),
  }
}

export function auVectorToCartesianPc(vector) {
  if (!vector || ![vector.x, vector.y, vector.z].every(hasNumber)) return emptyCartesian()
  return { x: vector.x / AU_PER_PARSEC, y: vector.y / AU_PER_PARSEC, z: vector.z / AU_PER_PARSEC }
}

export function normalizeAstronomicalRecord(record) {
  const distancePc = hasNumber(record.distancePc)
    ? record.distancePc
    : hasNumber(record.distanceLy) ? record.distanceLy / LIGHT_YEARS_PER_PARSEC : null
  const distanceLy = hasNumber(record.distanceLy)
    ? record.distanceLy
    : hasNumber(record.distancePc) ? record.distancePc * LIGHT_YEARS_PER_PARSEC : null
  let actualCartesian = record.actualCartesian ?? emptyCartesian()

  if (record.heliocentricVectorAu) actualCartesian = auVectorToCartesianPc(record.heliocentricVectorAu)
  else if ([record.raDeg, record.decDeg, distancePc].every(hasNumber)) {
    actualCartesian = equatorialToCartesianPc(record.raDeg, record.decDeg, distancePc)
  }

  return {
    ...record,
    distancePc,
    distanceLy,
    actualCartesian,
    actualCartesianUnit: 'pc',
    actualCartesianFrame: record.actualCartesianFrame ?? 'heliocentric ICRS equatorial',
  }
}

/** 실제 좌표만 사용한다. 좌표가 없거나 기준 좌표계가 다르면 null이다. */
export function distanceBetween(objectA, objectB) {
  const a = objectA?.actualCartesian
  const b = objectB?.actualCartesian
  if (!a || !b || ![a.x, a.y, a.z, b.x, b.y, b.z].every(hasNumber)) return null
  if (objectA.actualCartesianFrame !== objectB.actualCartesianFrame) return null
  const distancePc = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
  return {
    distancePc,
    distanceLy: distancePc * LIGHT_YEARS_PER_PARSEC,
    distanceAu: distancePc * AU_PER_PARSEC,
    distanceKm: distancePc * AU_PER_PARSEC * KM_PER_AU,
  }
}

const rounded = (value, maximumFractionDigits = 1) => value.toLocaleString('ko-KR', { maximumFractionDigits })

export function formatAstronomicalDistance({ distanceKm, distanceAu, distanceLy, distancePc } = {}) {
  if (hasNumber(distanceKm) && distanceKm < 10_000_000) return `약 ${rounded(distanceKm, 0)} km`
  if (hasNumber(distanceAu) && distanceAu < 10_000) return `약 ${rounded(distanceAu, distanceAu < 10 ? 2 : 1)} AU`
  const pc = hasNumber(distancePc) ? distancePc : hasNumber(distanceLy) ? distanceLy / LIGHT_YEARS_PER_PARSEC : null
  const ly = hasNumber(distanceLy) ? distanceLy : hasNumber(distancePc) ? distancePc * LIGHT_YEARS_PER_PARSEC : null
  if (!hasNumber(pc) || !hasNumber(ly)) return '확인된 거리 자료 없음'
  if (pc >= 1_000_000) return `약 ${rounded(pc / 1_000_000)} Mpc (${rounded(ly / 1_000_000)}백만 광년)`
  if (pc >= 1_000) return `약 ${rounded(pc / 1_000)} kpc (${rounded(ly / 1_000)}천 광년)`
  return `약 ${rounded(ly)}광년 (약 ${rounded(pc)} pc)`
}

export function formatDistanceFromEarth(object) {
  return formatAstronomicalDistance({ distanceKm: object.distanceKm, distanceAu: object.distanceAu, distanceLy: object.distanceLy, distancePc: object.distancePc })
}

// 아래 압축 함수와 변환은 화면 표현 전용이다. 실제 거리 계산에는 사용하지 않는다.
export function compressGalacticDistance(distanceLy) {
  return 72 + Math.log10(Math.max(distanceLy, 1)) * 112
}

export function compressLocalGroupDistance(distanceLy) {
  return 1450 + Math.log10(Math.max(distanceLy / 100000, 1)) * 2100
}

export function compressedRenderPosition(object, origin = { x: 20, y: -1, z: 0 }) {
  if (![object.distanceLy, object.raDeg, object.decDeg].every(hasNumber)) return { ...origin }
  const radius = object.scaleGroup === 'localGroup' ? compressLocalGroupDistance(object.distanceLy) : compressGalacticDistance(object.distanceLy)
  const ra = object.raDeg * DEG_TO_RAD
  const dec = object.decDeg * DEG_TO_RAD
  return {
    x: origin.x + Math.cos(dec) * Math.sin(ra) * radius,
    y: origin.y + Math.sin(dec) * radius,
    z: origin.z - Math.cos(dec) * Math.cos(ra) * radius,
  }
}

export const positionOf = (object) => {
  const position = object?.renderPosition
  if (Array.isArray(position)) return position
  return position ? [position.x, position.y, position.z] : [0, 0, 0]
}
