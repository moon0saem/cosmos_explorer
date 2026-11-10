const DISTANCE_EPOCH = '2026-11-10T00:00:00Z'
const HORIZONS_URL = 'https://ssd-api.jpl.nasa.gov/doc/horizons.html'
const NASA_PLANETS = 'https://science.nasa.gov/solar-system/planets/'
const SIZE_SOURCE = 'https://science.nasa.gov/resource/solar-system-sizes/'
const empty = { x: null, y: null, z: null }

const base = {
  raDeg: null, decDeg: null, distancePc: null, distanceLy: null,
  galacticLongitudeDeg: null, galacticLatitudeDeg: null,
  actualCartesian: empty, image: null, imageSourceName: null, imageSourceUrl: null,
  sourceName: 'NASA Solar System Exploration', sourceUrl: NASA_PLANETS,
  distanceEpoch: DISTANCE_EPOCH,
  distanceSourceName: 'NASA/JPL Horizons (지구 중심 겉보기 거리)',
  distanceSourceUrl: HORIZONS_URL,
  actualCartesianSourceName: 'NASA/JPL Horizons (태양 중심 ICRF 벡터)',
  actualCartesianSourceUrl: HORIZONS_URL,
  actualCartesianEpoch: DISTANCE_EPOCH,
}

const records = [
  { id: 'sun', nameKo: '태양', nameEn: 'Sun', type: '별', subtype: 'G형 주계열성', distanceAu: 0.99048, actualDiameterKm: 1391400, heliocentricVectorAu: { x: 0, y: 0, z: 0 }, description: '태양계의 중심에 있는 별로, 행성들은 태양 주위를 공전합니다.', educationalNote: '행성과 달리 스스로 빛과 열을 냅니다.' },
  { id: 'mercury', nameKo: '수성', nameEn: 'Mercury', type: '행성', subtype: '지구형 행성', distanceAu: 0.733282, orbitalSemimajorAxisAu: 0.39, actualDiameterKm: 4879, heliocentricVectorAu: { x: 0.07905690126265739, y: 0.2654688996251654, z: 0.1336216061611652 }, description: '태양에 가장 가까운 가장 작은 행성입니다.', educationalNote: '태양에서 바깥쪽으로 행성 순서를 확인해 보세요.' },
  { id: 'venus', nameKo: '금성', nameEn: 'Venus', type: '행성', subtype: '지구형 행성', distanceAu: 0.307689, orbitalSemimajorAxisAu: 0.72, actualDiameterKm: 12104, heliocentricVectorAu: { x: 0.3892869091077192, y: 0.5633294649492586, z: 0.2288565423246532 }, description: '두꺼운 이산화탄소 대기를 가진 태양계 두 번째 행성입니다.', educationalNote: '크기는 지구와 비슷하지만 표면 환경은 매우 다릅니다.' },
  { id: 'earth', nameKo: '지구', nameEn: 'Earth', type: '행성', subtype: '지구형 행성', distanceKm: 0, orbitalSemimajorAxisAu: 1, actualDiameterKm: 12742, heliocentricVectorAu: { x: 0.6726227034059016, y: 0.6670914711179085, z: 0.2891692651318816 }, description: '액체 상태의 물과 생명체가 확인된 우리의 행성입니다.', educationalNote: '지구는 태양에서 세 번째 행성이며 태양계의 중심이 아닙니다.' },
  { id: 'moon', nameKo: '달', nameEn: 'Moon', type: '위성', subtype: '자연위성', distanceKm: 399775, actualDiameterKm: 3475, heliocentricVectorAu: { x: 0.671104379360273, y: 0.665177674563539, z: 0.2880861358933749 }, description: '지구 주위를 도는 지구의 유일한 자연위성입니다.', educationalNote: '위성은 행성 주위를 도는 천체입니다.' },
  { id: 'mars', nameKo: '화성', nameEn: 'Mars', type: '행성', subtype: '지구형 행성', distanceAu: 1.358156, orbitalSemimajorAxisAu: 1.52, actualDiameterKm: 6779, heliocentricVectorAu: { x: -0.4064255462371009, y: 1.406000974473853, z: 0.6558614058516782 }, description: '산화철 때문에 붉게 보이는 태양계 네 번째 행성입니다.', educationalNote: '지구 바깥쪽을 도는 지구형 행성입니다.' },
  { id: 'jupiter', nameKo: '목성', nameEn: 'Jupiter', type: '행성', subtype: '가스 행성', distanceAu: 5.36135, orbitalSemimajorAxisAu: 5.2, actualDiameterKm: 139820, heliocentricVectorAu: { x: -3.715868902610422, y: 3.465387221926318, z: 1.575811046015292 }, description: '태양계에서 가장 큰 가스 행성입니다.', educationalNote: '화면 크기는 교육용으로 조정되지만 실제 지름 자료는 별도로 저장됩니다.' },
  { id: 'saturn', nameKo: '토성', nameEn: 'Saturn', type: '행성', subtype: '가스 행성', distanceAu: 8.631311, orbitalSemimajorAxisAu: 9.58, actualDiameterKm: 116460, heliocentricVectorAu: { x: 9.202348604171258, y: 1.98049007114267, z: 0.421715623196934 }, description: '얼음과 암석 조각으로 이루어진 밝은 고리가 돋보이는 행성입니다.', educationalNote: '목성 다음, 태양에서 여섯 번째 행성입니다.' },
  { id: 'uranus', nameKo: '천왕성', nameEn: 'Uranus', type: '행성', subtype: '얼음 행성', distanceAu: 18.483352, orbitalSemimajorAxisAu: 19.2, actualDiameterKm: 50724, heliocentricVectorAu: { x: 8.789309004906194, y: 15.92227635426138, z: 6.849101442615147 }, description: '옆으로 누운 듯한 자전축을 가진 푸른빛의 얼음 행성입니다.', educationalNote: '태양에서 일곱 번째 행성입니다.' },
  { id: 'neptune', nameKo: '해왕성', nameEn: 'Neptune', type: '행성', subtype: '얼음 행성', distanceAu: 29.177116, orbitalSemimajorAxisAu: 30.05, actualDiameterKm: 49244, heliocentricVectorAu: { x: 29.83045879580505, y: 1.667705000960902, z: -0.06003294631446435 }, description: '태양에서 가장 멀리 있는 여덟 번째 행성입니다.', educationalNote: '강한 바람이 부는 차갑고 푸른 얼음 행성입니다.' },
]

export const SOLAR_SYSTEM_DATA = records.map((record) => ({
  ...base,
  ...record,
  actualSizeSource: 'NASA Solar System Sizes',
  actualSizeSourceUrl: SIZE_SOURCE,
}))
