# .fig 추출 도구

Figma `.fig` 파일에서 **디자인 토큰(색·폰트·크기)과 이미지 에셋**을 뽑아낸다.
외부 의존성 없이 Node 내장 모듈(zlib의 deflate·zstd)만 사용한다.

```bash
node tools/fig/extract.mjs docs/반창고.fig /tmp/fig
node tools/fig/figspec.mjs /tmp/fig/nodes.json
```

`extract.mjs` 가 만드는 것:
- `images/` — 원본 이미지 에셋 (로고·마스코트 등, 최대 4096px)
- `nodes.json` — 전체 노드 트리 (색·폰트·크기·좌표·텍스트)
- `thumbnail.png`, `meta.json`

`figspec.mjs` 가 출력하는 것: 텍스트 스타일 목록, 사용 폰트, 색상 팔레트,
프레임/컴포넌트 크기, 모서리 반경 분포.

## 포맷 메모

`.fig` 는 zip 이고 그 안의 `canvas.fig` 가 실제 문서다.

```
"fig-kiwi" (8B) + version(u32) + [ len(u32) + data ] ...
  chunk 0 = kiwi 스키마      (deflate raw)
  chunk 1 = 문서 데이터       (zstd)
```

[kiwi](https://github.com/evanw/kiwi) 는 스키마가 자기 자신을 기술하므로,
chunk 0 을 먼저 읽어 정의를 얻은 뒤 그것으로 chunk 1 을 디코딩한다.
파서는 `kiwi.mjs` 에 있다.
