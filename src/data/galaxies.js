const SIMBAD = 'https://simbad.cds.unistra.fr/simbad/sim-basic?Ident='
const nullCartesian = { x: null, y: null, z: null }
const externalBase = {
  type: '은하', actualDiameterKm: null, galacticLongitudeDeg: null, galacticLatitudeDeg: null,
  actualCartesian: nullCartesian, sourceName: 'SIMBAD Astronomical Database',
  imageSourceName: null, imageSourceUrl: null,
}

const external = [
  { id: 'andromeda', nameKo: '안드로메다은하', nameEn: 'Andromeda Galaxy', subtype: '나선은하', distanceLy: 2540000, raDeg: 10.6847, decDeg: 41.2692, image: '/astronomy/andromeda.jpg', description: '우리은하와 가장 가까운 큰 나선은하입니다.', educationalNote: '거리는 은하 중심까지의 대표값입니다. 우리은하와 함께 국부은하군의 큰 구성원입니다.' },
  {
    id: 'm32', nameKo: 'M32 은하', nameEn: 'Messier 32', subtype: '왜소 조밀 타원은하',
    distanceLy: 2500000, raDeg: 10.67427, decDeg: 40.86517, image: '/astronomy/m32.jpg',
    description: 'M32는 안드로메다은하 주위를 도는 작고 조밀한 타원은하입니다. 나선팔이 없고, 많은 별이 중심에 빽빽하게 모여 매끈한 타원 모양으로 보입니다.',
    educationalNote: 'NASA는 M32를 지구에서 약 250만 광년 떨어진 안드로메다은하의 위성은하로 소개합니다.',
    sourceName: 'NASA Science · SIMBAD',
    sourceUrl: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-32/',
    coordinateSourceName: 'SIMBAD Astronomical Database',
    coordinateSourceUrl: 'https://simbad.u-strasbg.fr/simbad/sim-id?Ident=M+32',
    imageSourceName: 'NASA/ESA Hubble Space Telescope',
    imageSourceUrl: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-32/',
  },
  { id: 'triangulum', nameKo: '삼각형자리은하', nameEn: 'Triangulum Galaxy', subtype: '나선은하', distanceLy: 2730000, raDeg: 23.4621, decDeg: 30.6602, image: '/astronomy/triangulum.jpg', description: '국부은하군에서 세 번째로 큰 나선은하입니다.', educationalNote: '거리는 은하 중심까지의 대표값입니다. 안드로메다와 비슷한 방향이지만 별개의 은하입니다.' },
  {
    id: 'lmc', nameKo: '대마젤란은하', nameEn: 'Large Magellanic Cloud', subtype: '왜소 불규칙은하',
    distanceLy: 163000, raDeg: 80.8942, decDeg: -69.7561, image: '/astronomy/large-magellanic-cloud.jpg',
    description: '우리은하 가까이에 있는 왜소 불규칙은하입니다. 사진의 색은 여러 관측 장비가 포착한 가스와 차갑거나 따뜻한 먼지를 구분해 합성한 것입니다.',
    educationalNote: '거리는 은하 중심까지의 대표값입니다. 남반구에서 흐린 구름처럼 보입니다.',
    imageSourceName: 'ESA/NASA/JPL-Caltech/CSIRO/C. Clark (STScI)',
    imageSourceUrl: 'https://science.nasa.gov/photojournal/large-magellanic-cloud-imaged-by-herschel-planck-iras-cobe/',
  },
]

export const GALAXY_DATA = [
  {
    id: 'milky-way', nameKo: '우리은하', nameEn: 'Milky Way', type: '은하', subtype: '막대나선은하',
    raDeg: null, decDeg: null, distancePc: null, distanceLy: null, actualDiameterKm: null, actualDiameterLy: 100000,
    galacticLongitudeDeg: null, galacticLatitudeDeg: null, actualCartesian: nullCartesian,
    description: '태양계를 포함하는 막대나선은하입니다.',
    educationalNote: '태양계는 중심이 아니라 Local Arm(Orion Spur) 부근에 있습니다. 은하 구조와 태양 위치는 관측 자료를 바탕으로 한 모식 표현입니다.',
    image: null, sourceName: 'NASA Science', sourceUrl: 'https://science.nasa.gov/universe/exoplanets/our-milky-way-galaxy-how-big-is-space/', actualSizeSource: 'NASA Science', actualSizeSourceUrl: 'https://science.nasa.gov/photojournal/amazing-andromeda-galaxy/', imageSourceName: null, imageSourceUrl: null,
  },
  ...external.map((record) => ({
    ...externalBase, ...record, distancePc: null, distanceKind: 'galaxy-center',
    ...(record.id === 'andromeda' ? { actualDiameterLy: 220000, actualSizeSource: 'NASA Science', actualSizeSourceUrl: 'https://science.nasa.gov/universe/exoplanets/our-milky-way-galaxy-how-big-is-space/' } : {}),
    sourceUrl: record.sourceUrl ?? `${SIMBAD}${encodeURIComponent(record.nameEn)}`,
    imageSourceName: record.image ? record.imageSourceName ?? '사용자 제공 관측 이미지' : null,
  })),
  {
    id: 'local-group', nameKo: '국부은하군', nameEn: 'Local Group', type: '은하군', subtype: '은하군',
    raDeg: null, decDeg: null, distancePc: null, distanceLy: null, actualDiameterKm: null,
    galacticLongitudeDeg: null, galacticLatitudeDeg: null, actualCartesian: nullCartesian,
    description: '우리은하와 안드로메다은하, 삼각형자리은하 및 여러 작은 은하를 포함하는 집단입니다.',
    educationalNote: '은하들이 한곳에 합쳐진 것이 아니라 넓은 공간에서 중력으로 연결된 집단입니다.',
    image: null, sourceName: 'NASA/IPAC Extragalactic Database', sourceUrl: 'https://ned.ipac.caltech.edu/', imageSourceName: null, imageSourceUrl: null,
  },
]
