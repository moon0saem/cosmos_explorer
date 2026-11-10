const SIMBAD = 'https://simbad.cds.unistra.fr/simbad/sim-basic?Ident='
const base = {
  type: '성단', actualDiameterKm: null, galacticLongitudeDeg: null, galacticLatitudeDeg: null,
  actualCartesian: { x: null, y: null, z: null }, sourceName: 'SIMBAD Astronomical Database',
  imageSourceName: '사용자 제공 관측 이미지', imageSourceUrl: null,
}

const details = {
  pleiades: {
    image: '/astronomy/pleiades.jpg',
    members: ['알키오네', '아틀라스', '엘렉트라', '마이아', '메로페', '타이게타', '플레이오네', '셀라에노', '스테로페'].map((nameKo, index) => ({ id: `pleiades-member-${index + 1}`, nameKo, nameEn: ['Alcyone', 'Atlas', 'Electra', 'Maia', 'Merope', 'Taygeta', 'Pleione', 'Celaeno', 'Sterope'][index] })),
  },
  hyades: { image: '/astronomy/hyades.jpg', members: Array.from({ length: 12 }, (_, index) => ({ id: `hyades-member-${index + 1}`, nameKo: `히아데스 대표 별 ${index + 1}`, nameEn: `Hyades member ${index + 1}` })) },
  m13: { image: '/astronomy/m13.jpg' },
  'omega-centauri': { image: '/astronomy/omega-centauri.jpg' },
}

const records = [
  { id: 'pleiades', nameKo: '플레이아데스 성단', nameEn: 'Pleiades', subtype: '산개성단 · 반사성운', distanceLy: 442, raDeg: 56.6008, decDeg: 24.1139, description: '비교적 젊은 별들이 성기게 모여 있는 산개성단입니다. 밝고 푸른 별빛이 주변을 지나가는 가스와 먼지 구름에 반사되어 별들 둘레에 푸른 반사성운도 나타납니다.', educationalNote: '플레이아데스의 성운은 성단이 태어난 물질이 아니라 성단을 지나가는 별개의 성간 구름으로 알려져 있습니다.' },
  { id: 'hyades', nameKo: '히아데스 성단', nameEn: 'Hyades', subtype: '산개성단', distanceLy: 153, raDeg: 67.4471, decDeg: 16.9481, description: '태양계에서 가까운 대표적인 산개성단입니다.', educationalNote: '거리는 성단 중심의 대표값이며, 하늘에서는 황소자리 얼굴 부근에 넓게 퍼져 보입니다.' },
  { id: 'm13', nameKo: '헤르쿨레스자리 구상성단', nameEn: 'M13', subtype: '구상성단', distanceLy: 25100, raDeg: 250.4235, decDeg: 36.4613, description: '수많은 오래된 별이 공 모양으로 빽빽하게 모인 구상성단입니다.', educationalNote: '거리는 성단 중심의 대표값입니다. 중심으로 갈수록 별이 조밀해집니다.' },
  { id: 'omega-centauri', nameKo: '오메가 센타우리', nameEn: 'Omega Centauri', subtype: '구상성단', distanceLy: 15800, raDeg: 201.697, decDeg: -47.4795, description: '우리은하에서 가장 밝고 큰 구상성단 가운데 하나입니다.', educationalNote: '거리는 성단 중심의 대표값입니다. 구상성단은 은하 헤일로에서도 발견됩니다.' },
]

export const CLUSTER_DATA = records.map((record) => ({
  ...base, ...record, ...details[record.id], distancePc: null, distanceKind: 'representative-center',
  sourceUrl: `${SIMBAD}${encodeURIComponent(record.nameEn)}`,
}))
