const SIMBAD = 'https://simbad.cds.unistra.fr/simbad/sim-basic?Ident='
const base = {
  type: '성운', actualDiameterKm: null, galacticLongitudeDeg: null, galacticLatitudeDeg: null,
  actualCartesian: { x: null, y: null, z: null }, sourceName: 'SIMBAD Astronomical Database',
  imageSourceName: '사용자 제공 관측 이미지', imageSourceUrl: null,
}

const records = [
  { id: 'orion-nebula', nameKo: '오리온성운', nameEn: 'Orion Nebula', subtype: '발광성운', distanceLy: 1344, raDeg: 83.8221, decDeg: -5.3911, image: '/astronomy/orion-nebula.jpg', description: '가스와 먼지가 넓게 퍼져 있고 그 안에서 새로운 별들이 태어나고 있습니다.', educationalNote: '표시 거리는 넓은 성운의 대표 중심까지이며 화면 크기는 실제 공간 크기가 아닙니다.' },
  { id: 'eagle-nebula', nameKo: '독수리성운', nameEn: 'Eagle Nebula', subtype: '발광성운', distanceLy: 7000, raDeg: 274.7, decDeg: -13.8, image: '/astronomy/eagle-nebula.jpg', description: '가스와 먼지가 거대한 기둥처럼 보이는 부분을 포함한 성운입니다.', educationalNote: '표시 거리는 성운의 대표 중심까지입니다. 기둥 모양 먼지 뒤에서도 별이 만들어집니다.' },
  { id: 'lagoon-nebula', nameKo: '석호성운', nameEn: 'Lagoon Nebula', subtype: '발광성운', distanceLy: 4100, raDeg: 270.925, decDeg: -24.38, image: '/astronomy/lagoon-nebula.jpg', description: '뜨거운 젊은 별빛 때문에 주변 수소 가스가 밝게 빛나는 넓은 성운입니다.', educationalNote: '표시 거리는 넓은 영역의 대표 중심까지이며 화면 크기는 실제 지름이 아닙니다.' },
  { id: 'horsehead-nebula', nameKo: '말머리성운', nameEn: 'Horsehead Nebula', subtype: '암흑성운', distanceLy: 1500, raDeg: 85.2458, decDeg: -2.4583, image: '/astronomy/horsehead-nebula.png', description: '뒤쪽의 밝은 빛을 가리는 차갑고 짙은 가스와 먼지 구름입니다.', educationalNote: '성운은 스스로 밝게 빛나는 영역만을 뜻하지 않습니다. 거리는 성운 중심까지의 대표값입니다.', sourceName: 'NASA Science · Hubble', sourceUrl: 'https://science.nasa.gov/asset/hubble/horsehead-nebula-infrared/', imageSourceName: 'NASA · ESA · Hubble Heritage Team', imageSourceUrl: 'https://science.nasa.gov/asset/hubble/horsehead-nebula-infrared/' },
]

export const NEBULA_DATA = records.map((record) => ({
  ...base, ...record, distancePc: null, distanceKind: 'representative-center',
  sourceUrl: record.sourceUrl ?? `${SIMBAD}${encodeURIComponent(record.nameEn)}`,
}))
