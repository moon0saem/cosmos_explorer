const SIMBAD = 'https://simbad.cds.unistra.fr/simbad/sim-basic?Ident='
const base = {
  type: '별', actualDiameterKm: null, galacticLongitudeDeg: null, galacticLatitudeDeg: null,
  actualCartesian: { x: null, y: null, z: null }, image: null,
  sourceName: 'SIMBAD Astronomical Database', imageSourceName: null, imageSourceUrl: null,
}

const records = [
  { id: 'proxima-centauri', nameKo: '프록시마 센타우리', nameEn: 'Proxima Centauri', subtype: '적색왜성', distanceLy: 4.25, raDeg: 217.4292, decDeg: -62.6795, description: '태양에서 가장 가까운 것으로 알려진 별입니다. 작고 어두운 적색왜성입니다.', educationalNote: '가까운 별도 빛이 도달하는 데 4년 넘게 걸립니다.' },
  { id: 'sirius', nameKo: '시리우스', nameEn: 'Sirius', subtype: 'A형 주계열성·쌍성계', distanceLy: 8.6, raDeg: 101.2872, decDeg: -16.7161, description: '밤하늘에서 가장 밝게 보이는 별이며 실제로는 쌍성계입니다.', educationalNote: '겉보기 밝기는 별의 실제 밝기와 거리 모두에 영향을 받습니다.' },
  { id: 'betelgeuse', nameKo: '베텔게우스', nameEn: 'Betelgeuse', subtype: '적색초거성', distanceLy: 548, raDeg: 88.7929, decDeg: 7.4071, description: '오리온자리의 어깨에 해당하는 붉은 초거성입니다.', educationalNote: '거리는 측정 방법과 자료 갱신에 따라 조금 달라질 수 있습니다.' },
  { id: 'rigel', nameKo: '리겔', nameEn: 'Rigel', subtype: '청색초거성', distanceLy: 864, raDeg: 78.6345, decDeg: -8.2016, description: '오리온자리의 발에 해당하는 매우 밝고 뜨거운 청색초거성입니다.', educationalNote: '베텔게우스와 색을 비교하면 별의 온도 차이를 짐작할 수 있습니다.' },
  { id: 'polaris', nameKo: '북극성', nameEn: 'Polaris', subtype: '황색초거성·세페이드 변광성', distanceLy: 448, raDeg: 37.9546, decDeg: 89.2641, description: '하늘의 북극 가까이에 있어 방향을 찾는 기준이 되는 별입니다.', educationalNote: '북극성이 특별히 가장 밝은 별인 것은 아닙니다.' },
  { id: 'deneb', nameKo: '데네브', nameEn: 'Deneb', subtype: '청백색초거성', distanceLy: 2600, raDeg: 310.358, decDeg: 45.2803, description: '백조자리의 꼬리에 해당하며 여름철 대삼각형을 이루는 별입니다.', educationalNote: '매우 멀지만 본래 밝기가 커서 맨눈으로 보입니다.' },
]

export const STAR_DATA = records.map((record) => ({
  ...base, ...record, distancePc: null, distanceKind: 'stellar-system',
  sourceUrl: `${SIMBAD}${encodeURIComponent(record.nameEn)}`,
}))
