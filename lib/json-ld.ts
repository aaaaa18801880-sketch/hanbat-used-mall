// 파일 경로: lib/json-ld.ts
// JSON-LD를 <script>에 넣을 때 "<"를 유니코드 이스케이프로 바꿔 스크립트 태그 탈출을 막습니다.
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
