// 파일 경로: tests/register-ts.mjs
import fs from "node:fs";
import path from "node:path";
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

process.env.NEXT_PUBLIC_SUPABASE_URL ||= "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||= "anon-test-key";

const NEXT_SERVER_STUB =
  "data:text/javascript,export class NextRequest extends Request {} export const NextResponse = { json: (b, i) => Response.json(b, i) };";

const EXTENSIONS = [".ts", ".tsx", "/index.ts", "/index.tsx", ".js", ".mjs"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/server") {
      return { shortCircuit: true, url: NEXT_SERVER_STUB };
    }

    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      context.parentURL?.startsWith("file://") &&
      !path.extname(specifier)
    ) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      for (const ext of EXTENSIONS) {
        const candidate = path.resolve(parentDir, `${specifier}${ext}`);
        if (fs.existsSync(candidate)) {
          return {
            shortCircuit: true,
            url: pathToFileURL(candidate).href,
          };
        }
      }
    }

    return nextResolve(specifier, context);
  },

  load(url, context, nextLoad) {
    if (url.startsWith("file://") && /\.(ts|tsx)$/.test(url)) {
      const filePath = fileURLToPath(url);
      const source = fs.readFileSync(filePath, "utf8");
      const { outputText } = ts.transpileModule(source, {
        fileName: filePath,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      });
      return {
        shortCircuit: true,
        format: "module",
        source: outputText,
      };
    }

    return nextLoad(url, context);
  },
});
