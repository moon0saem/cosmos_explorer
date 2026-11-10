# 천문 데이터 좌표 규칙

## 실제 좌표

- `actualCartesian`의 단위는 pc이며 원점은 태양이다.
- 축은 ICRS 적도 좌표계를 따른다: +x는 RA 0°/Dec 0°, +y는 RA 90°/Dec 0°, +z는 북천구극이다.
- 별·성단·성운·외부은하는 `raDeg`, `decDeg`, `distancePc`로 계산한다.
- 태양계 천체는 `2026-11-10T00:00:00Z`의 JPL Horizons 태양 중심 ICRF 벡터(AU)를 pc로 바꾼다.
- 성단·성운·은하의 좌표는 하나의 점 전체를 뜻하지 않고 데이터에 기록된 대표 중심을 뜻한다.
- 우리은하와 국부은하군은 관측자가 그 내부에 있어 같은 방식의 단일 태양 중심 좌표를 주지 않으며 `null`이다.

## 렌더 좌표

- `renderPosition`은 교육용 화면 배치이며 단위가 실제 pc가 아니다.
- 실제 데이터 파일에는 렌더 좌표를 넣지 않는다. 모든 시각 설정은 `renderConfig.js`에 둔다.
- `catalog.js`가 실제 데이터와 렌더 설정을 합쳐 React Three Fiber에서 사용할 객체를 만든다.
- 실제 거리는 반드시 `distanceBetween()`과 `actualCartesian`으로 계산한다. `renderPosition` 사이의 길이는 사용할 수 없다.
- 은하단처럼 넓고 중심 정의가 자료마다 달라지는 구조는 확인된 대표 거리만 저장하고, 단일 RA/Dec는 억지로 채우지 않는다.
- `largeScaleStructures.js`의 처녀자리 은하단과 라니아케아 표시 위치는 화면 연속성을 위한 교육용 `renderPosition`이다.
- cosmic web 점·선 분포는 특정 관측 지도의 복제가 아니라, 관측으로 알려진 필라멘트·밀집부·공동의 특징을 설명하는 모식화다.

## 검증

개발 서버 주소에 `?validateData=1`을 붙이면 브라우저 개발자 콘솔에서 실제 좌표와 렌더 좌표를 나란히 확인할 수 있다.
