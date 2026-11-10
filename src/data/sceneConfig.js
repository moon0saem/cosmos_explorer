export const SCHOOL_LOCATION = { name: '우리 학교', latitude: 37.5665, longitude: 126.978 }
export const MAX_ZOOM = 140

export const SPACE_ANCHORS = {
  school: [0, 0, 0],
  earthCenter: [0, -1, 0],
  sun: [20, -1, 0],
  galacticCenter: [-800, 80, -40],
}

export const ZOOM_STAGES = [
  { min: 0, max: 12, label: '학교 · 지표면', eyebrow: '지금 내가 서 있는 곳' },
  { min: 12, max: 30, label: '지구', eyebrow: '우리가 사는 행성' },
  { min: 30, max: 50, label: '태양계', eyebrow: '태양의 가족' },
  { min: 50, max: 72, label: '별 · 성단 · 성운', eyebrow: '우리은하 안의 이웃' },
  { min: 72, max: 90, label: '우리은하', eyebrow: '태양계가 속한 은하' },
  { min: 90, max: 104, label: '국부은하군', eyebrow: '여러 은하의 집단' },
  { min: 104, max: 120, label: '은하군 · 은하단', eyebrow: '국부은하군 너머' },
  { min: 120, max: 134, label: '우주 거대 구조', eyebrow: '초은하단에서 필라멘트로' },
  { min: 134, max: 141, label: '관측 가능한 우주', eyebrow: '현재 관측할 수 있는 규모' },
]

export const BREADCRUMBS = [
  { label: '학교', at: 0 }, { label: '지구', at: 15 },
  { label: '태양계', at: 38 }, { label: '우리은하', at: 74 },
  { label: '국부은하군', at: 94 }, { label: '우주 거대 구조', at: 122 },
  { label: '관측 가능한 우주', at: 134 },
]
