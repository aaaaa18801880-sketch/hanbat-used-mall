import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@supabase/auth-helpers-nextjs",
              message:
                "'@supabase/auth-helpers-nextjs'는 더 이상 사용할 수 없습니다. 대신 '@supabase/ssr'(createBrowserClient, createServerClient)를 사용하세요.",
            },
          ],
          patterns: [
            {
              group: ["@supabase/auth-helpers-nextjs/*"],
              message:
                "'@supabase/auth-helpers-nextjs'는 더 이상 사용할 수 없습니다. 대신 '@supabase/ssr'(createBrowserClient, createServerClient)를 사용하세요.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "warn",
        {
          selector:
            "CallExpression[callee.name='setTimeout'], CallExpression[callee.object.name=/^(window|globalThis|self)$/][callee.property.name='setTimeout']",
          message:
            "setTimeout 기반 타이머 우회 대신 상태 손상이나 비동기 타이밍의 근본 원인을 해결하세요.",
        },
        {
          selector:
            "CallExpression[callee.name='useEffect'], CallExpression[callee.object.name='React'][callee.property.name='useEffect']",
          message:
            "상태 동기화나 데이터 페칭용 useEffect 대신 파생 상태, 이벤트 핸들러 또는 Server Components로 대체하세요.",
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
