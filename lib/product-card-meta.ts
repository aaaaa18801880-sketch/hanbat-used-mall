// 파일 경로: lib/product-card-meta.ts
// 판매 제품 갤러리 카드용 회사명(브랜드) 추출, 중복 없는 제품명 정제, 핵심 사양 요약 순수 헬퍼
import { detectProductCategoryMismatch } from "./product-category-audit";

interface BrandRule {
  pattern: RegExp;
  label: string;
  /** 제품명 맨 앞의 중복 제조사 표기만 제거 (휘센·디오스·비스포크 등 제품 라인명은 유지) */
  stripPrefix: RegExp;
}

const BRAND_RULES: readonly BrandRule[] = [
  {
    pattern: /그랜드\s*우성/i,
    label: "그랜드우성",
    stripPrefix: /^(?:\[?\s*그랜드\s*우성\s*\]?\s*)+/i,
  },
  {
    pattern: /삼성전자|삼성|SAMSUNG|비스포크|그랑데|무풍/i,
    label: "삼성전자",
    stripPrefix: /^(?:\[?\s*(?:삼성전자|삼성|SAMSUNG)\s*\]?\s*)+/i,
  },
  {
    pattern: /LG전자|\bLG\b|엘지|휘센|디오스|DIOS|트롬|TROMM|오브제컬렉션|퓨리케어/i,
    label: "LG전자",
    stripPrefix: /^(?:\[?\s*(?:LG전자|LG|엘지전자|엘지)\s*\]?\s*)+/i,
  },
  {
    pattern: /캐리어|CARRIER/i,
    label: "캐리어",
    stripPrefix: /^(?:\[?\s*(?:캐리어\s*에어컨|캐리어|CARRIER)\s*\]?\s*)+/i,
  },
  {
    pattern: /위니아|딤채|WINIA/i,
    label: "위니아",
    stripPrefix: /^(?:\[?\s*(?:위니아전자|위니아|WINIA)\s*\]?\s*)+/i,
  },
  {
    pattern: /우성|WOOSUNG/i,
    label: "우성",
    stripPrefix: /^(?:\[?\s*(?:우성냉동|우성|WOOSUNG)\s*\]?\s*)+/i,
  },
  {
    pattern: /스타리온|STARION/i,
    label: "스타리온",
    stripPrefix: /^(?:\[?\s*(?:스타리온|STARION)\s*\]?\s*)+/i,
  },
  {
    pattern: /유니크|에버젠|UNIQUE/i,
    label: "유니크",
    stripPrefix: /^(?:\[?\s*(?:유니크|UNIQUE)\s*\]?\s*)+/i,
  },
  {
    pattern: /라셀르|LASSERLE|LASELLE/i,
    label: "라셀르",
    stripPrefix: /^(?:\[?\s*(?:라셀르|LASSERLE|LASELLE)\s*\]?\s*)+/i,
  },
  {
    pattern: /터보에어|TURBO\s*AIR/i,
    label: "터보에어",
    stripPrefix: /^(?:\[?\s*(?:터보에어|TURBO\s*AIR)\s*\]?\s*)+/i,
  },
  {
    pattern: /다이아\s*R&F|다이아냉장|DIA\s*R&F/i,
    label: "다이아R&F",
    stripPrefix: /^(?:\[?\s*(?:다이아\s*R&F|다이아냉장|DIA\s*R&F)\s*\]?\s*)+/i,
  },
  {
    pattern: /아이스트로|ICETRO/i,
    label: "아이스트로",
    stripPrefix: /^(?:\[?\s*(?:아이스트로|ICETRO)\s*\]?\s*)+/i,
  },
  {
    pattern: /호시자키|HOSHIZAKI/i,
    label: "호시자키",
    stripPrefix: /^(?:\[?\s*(?:호시자키|HOSHIZAKI)\s*\]?\s*)+/i,
  },
  {
    pattern: /카이저|KAISER/i,
    label: "카이저",
    stripPrefix: /^(?:\[?\s*(?:카이저|KAISER)\s*\]?\s*)+/i,
  },
  {
    pattern: /아쿠아글로리|AQUA\s*GLORY/i,
    label: "아쿠아글로리",
    stripPrefix: /^(?:\[?\s*(?:아쿠아글로리|AQUA\s*GLORY)\s*\]?\s*)+/i,
  },
  {
    pattern: /린나이|RINNAI/i,
    label: "린나이",
    stripPrefix: /^(?:\[?\s*(?:린나이|RINNAI)\s*\]?\s*)+/i,
  },
  {
    pattern: /대신전기산업|대신전기/i,
    label: "대신전기산업",
    stripPrefix: /^(?:\[?\s*(?:대신전기산업|대신전기)\s*\]?\s*)+/i,
  },
  {
    pattern: /천마스타/i,
    label: "천마스타",
    stripPrefix: /^(?:\[?\s*천마스타\s*\]?\s*)+/i,
  },
  {
    pattern: /중원공조|MAGICE/i,
    label: "중원공조",
    stripPrefix: /^(?:\[?\s*(?:중원공조|MAGICE)\s*\]?\s*)+/i,
  },
  {
    pattern: /화로스타/i,
    label: "화로스타",
    stripPrefix: /^(?:\[?\s*화로스타\s*\]?\s*)+/i,
  },
  {
    pattern: /태영엔텍|TYPACK/i,
    label: "태영엔텍",
    stripPrefix: /^(?:\[?\s*태영엔텍\s*\]?\s*)+/i,
  },
  {
    pattern: /동구전자/i,
    label: "동구전자",
    stripPrefix: /^(?:\[?\s*동구전자\s*\]?\s*)+/i,
  },
  {
    pattern: /동양셰프/i,
    label: "동양셰프",
    stripPrefix: /^(?:\[?\s*동양셰프\s*\]?\s*)+/i,
  },
  {
    pattern: /피닉스/i,
    label: "피닉스",
    stripPrefix: /^(?:\[?\s*피닉스\s*\]?\s*)+/i,
  },
  {
    pattern: /다사랑|DAIRANG|DASARANG/i,
    label: "DAIRANG",
    stripPrefix: /^(?:\[?\s*(?:다사랑|DAIRANG|DASARANG)\s*\]?\s*)+/i,
  },
  {
    pattern: /하이얼|HAIER/i,
    label: "하이얼",
    stripPrefix: /^(?:\[?\s*(?:하이얼|HAIER)\s*\]?\s*)+/i,
  },
  {
    pattern: /한성컴퓨터/i,
    label: "한성컴퓨터",
    stripPrefix: /^(?:\[?\s*한성컴퓨터\s*\]?\s*)+/i,
  },
  {
    pattern: /쿠잉|COOING/i,
    label: "쿠잉",
    stripPrefix: /^(?:\[?\s*(?:쿠잉|COOING)\s*\]?\s*)+/i,
  },
  {
    pattern: /창홍|CHANGHONG/i,
    label: "창홍",
    stripPrefix: /^(?:\[?\s*(?:창홍|CHANGHONG)\s*\]?\s*)+/i,
  },
  {
    pattern: /에이스침대|CLUB\s*ACE/i,
    label: "에이스침대",
    stripPrefix: /^(?:\[?\s*에이스침대\s*\]?\s*)+/i,
  },
  {
    pattern: /SK매직|동양매직/i,
    label: "SK매직",
    stripPrefix: /^(?:\[?\s*(?:SK매직|동양매직)\s*\]?\s*)+/i,
  },
  {
    pattern: /쿠쿠|CUCKOO/i,
    label: "쿠쿠",
    stripPrefix: /^(?:\[?\s*(?:쿠쿠|CUCKOO)\s*\]?\s*)+/i,
  },
  {
    pattern: /쿠첸|CUCHEN/i,
    label: "쿠첸",
    stripPrefix: /^(?:\[?\s*(?:쿠첸|CUCHEN)\s*\]?\s*)+/i,
  },
  {
    pattern: /파세코|PASECO/i,
    label: "파세코",
    stripPrefix: /^(?:\[?\s*(?:파세코|PASECO)\s*\]?\s*)+/i,
  },
  {
    pattern: /신일|SHINIL/i,
    label: "신일",
    stripPrefix: /^(?:\[?\s*(?:신일전자|신일|SHINIL)\s*\]?\s*)+/i,
  },
  {
    pattern: /대우전자|대우(?=\s|$)|클라쎄|KLASSE/i,
    label: "대우",
    stripPrefix: /^(?:\[?\s*(?:대우전자|대우)\s*\]?\s*)+/i,
  },
  {
    pattern: /하이메이드|HIMADE/i,
    label: "하이메이드",
    stripPrefix: /^(?:\[?\s*(?:하이메이드|HIMADE)\s*\]?\s*)+/i,
  },
  {
    pattern: /루컴즈|LUCOMS/i,
    label: "루컴즈",
    stripPrefix: /^(?:\[?\s*(?:루컴즈전자|루컴즈|LUCOMS)\s*\]?\s*)+/i,
  },
  {
    pattern: /코웨이|COWAY/i,
    label: "코웨이",
    stripPrefix: /^(?:\[?\s*(?:코웨이|COWAY)\s*\]?\s*)+/i,
  },
  {
    pattern: /청호나이스/i,
    label: "청호나이스",
    stripPrefix: /^(?:\[?\s*청호나이스\s*\]?\s*)+/i,
  },
  {
    pattern: /다이슨|DYSON/i,
    label: "다이슨",
    stripPrefix: /^(?:\[?\s*(?:다이슨|DYSON)\s*\]?\s*)+/i,
  },
  {
    pattern: /일렉트로룩스|ELECTROLUX/i,
    label: "일렉트로룩스",
    stripPrefix: /^(?:\[?\s*(?:일렉트로룩스|ELECTROLUX)\s*\]?\s*)+/i,
  },
  {
    pattern: /밀레|MIELE/i,
    label: "밀레",
    stripPrefix: /^(?:\[?\s*(?:밀레|MIELE)\s*\]?\s*)+/i,
  },
  {
    pattern: /미디어|MIDEA/i,
    label: "미디어",
    stripPrefix: /^(?:\[?\s*(?:미디어|MIDEA)\s*\]?\s*)+/i,
  },
  {
    pattern: /부성/i,
    label: "부성",
    stripPrefix: /^(?:\[?\s*부성\s*\]?\s*)+/i,
  },
  {
    pattern: /한일전기|한일(?=\s|$)/i,
    label: "한일",
    stripPrefix: /^(?:\[?\s*(?:한일전기|한일)\s*\]?\s*)+/i,
  },
  {
    pattern: /귀뚜라미/i,
    label: "귀뚜라미",
    stripPrefix: /^(?:\[?\s*귀뚜라미\s*\]?\s*)+/i,
  },
  {
    pattern: /경동나비엔|나비엔/i,
    label: "경동나비엔",
    stripPrefix: /^(?:\[?\s*(?:경동나비엔|나비엔)\s*\]?\s*)+/i,
  },
];

const CATEGORY_SPEC_FALLBACK: Record<string, string> = {
  "에어컨/냉난방기": "에어컨·냉난방기 실매물",
  냉장고: "가정용 냉장·김치냉장고",
  "세탁기/건조기": "드럼·통돌이·건조기 실매물",
  업소용기기: "업소용 주방·냉장설비",
  기타: "TV·주방·생활 소형가전",
};

function findBrandRule(title: string | null | undefined): BrandRule | null {
  const safeTitle = (title || "").trim();
  if (!safeTitle) return null;
  for (const rule of BRAND_RULES) {
    if (rule.pattern.test(safeTitle)) {
      return rule;
    }
  }
  return null;
}

/**
 * 제품명에서 제조사(회사명)를 추출합니다.
 * - 브랜드가 명시되지 않은 일반/모음 매물은 정돈된 품목명을 반환합니다.
 */
export function extractProductBrand(
  title: string | null | undefined,
  fallbackCategory: string
): string {
  const matched = findBrandRule(title);
  if (matched) return matched.label;
  return fallbackCategory || "한밭중고전자";
}

/**
 * 카드 상단 우측 표시용 모델코드 검증기
 * - "개별 명판 확인 필요", "상담 및 평형 지정" 같은 안내 문구는 제외합니다.
 * - 실내기/실외기 두 코드가 `/`로 이어진 경우 대표 모델코드 1개만 깔끔하게 반환합니다.
 */
export function sanitizeCardModelCode(
  modelName: string | null | undefined
): string | null {
  if (!modelName) return null;
  const raw = modelName.trim();
  if (!raw) return null;
  if (/확인\s*필요|상담|지정|미확인|문의|다수/.test(raw)) return null;

  const stripped = raw
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!stripped) return null;
  if (/[가-힣]/.test(stripped)) return null;

  // "CPV-Q1101P0I / CPV-Q1101P0O" 처럼 실내외기 코드가 2개 나열된 경우 대표 코드 1개 선택
  const primaryCandidate = stripped.includes(" / ")
    ? stripped.split(" / ")[0].trim()
    : stripped;

  if (!primaryCandidate || primaryCandidate.length > 24) return null;
  if (!/[A-Za-z0-9]{2,}/.test(primaryCandidate)) return null;
  return primaryCandidate;
}

function isModelCodeToken(token: string): boolean {
  const trimmed = token.trim();
  if (!trimmed || /[가-힣]/.test(trimmed)) return false;
  // 순수 용량·전력·크기 단위(540W, 23L, 100kg, 220V 등)는 모델코드가 아닌 스펙으로 유지
  if (/^\d+(?:\.\d+)?\s*(?:L|kg|kW|W|V|㎡|mm|cm|평|구|도어|박스)$/i.test(trimmed)) {
    return false;
  }
  return /[A-Za-z]/.test(trimmed) && /\d/.test(trimmed) && trimmed.length >= 4;
}

export interface ProductCardDisplay {
  /** 상단 회사명(제조사) 또는 품목명 */
  brandLabel: string;
  /** 실제 제조사 브랜드 인식 여부 */
  hasBrand: boolean;
  /** 중복 제조사명과 괄호 모델코드를 걷어낸 명확한 제품 본명 */
  displayTitle: string;
  /** 모델코드만 제외하고 용도·용량 등 핵심 괄호 설명은 유지한 2줄용 명확한 제품명 */
  descriptiveTitle: string;
  /** 우측 상단 표기용 정돈된 모델코드 */
  modelCode: string | null;
  /** 제품명 아래 핵심 규격·특징 1~2줄 요약 */
  specSummary: string | null;
  /** 보더리스 카드 하단 1줄 보조 메타 (핵심 스펙 + 모델코드, 군더더기 폴백 제외) */
  subMetaLine: string | null;
}

export interface CardWarrantyHighlight {
  accent: string;
  label: string;
}

/**
 * DB 카테고리 오분류(예: 전자레인지·광파오븐이 에어컨/냉난방기 또는 세탁기/건조기로 등록된 경우)로 인해
 * 에어컨 전용 8개월 또는 주요가전 4개월 보증이 소형가전에 잘못 노출되는 것을 방지합니다.
 */
export function resolveCardWarrantyCategory(
  categoryLabel: string,
  title: string | null | undefined
): string {
  const mismatch = detectProductCategoryMismatch({
    id: "card-warranty-guard",
    title,
    category: categoryLabel,
  });
  if (mismatch) {
    return mismatch.suggestedCategory;
  }
  return categoryLabel;
}

/**
 * SSOT 보증 정책 문자열(getCategoryWarrantyInfo().compactLabel)을
 * 카드 강조 2단 타이포(오렌지 강조 + 다크 본문)로 안전하게 분리합니다.
 */
export function splitWarrantyHighlight(
  compactLabel: string
): CardWarrantyHighlight {
  const safe = (compactLabel || "").trim();
  const maxMatch = safe.match(/^(최대\s*\d+개월)\s+(.+)$/);
  if (maxMatch) {
    return { accent: maxMatch[1], label: maxMatch[2] };
  }
  const firstSpace = safe.indexOf(" ");
  if (firstSpace > 0) {
    return {
      accent: safe.slice(0, firstSpace),
      label: safe.slice(firstSpace + 1).trim(),
    };
  }
  return { accent: safe || "직영", label: "보증" };
}

/**
 * 제품 카드에 표시할 브랜드·제품 본명·모델코드·핵심 사양 요약을 중복 없이 구조화합니다.
 * - 상단에 회사명이 나오므로 제품명 앞의 중복 제조사 표기를 제거합니다.
 * - 제목 끝 괄호 `(냉방 6.5kW / 난방 7.5kW, CSV-Q161AW)`는 모델코드와 핵심 사양으로 분리해 깔끔하게 배치합니다.
 */
export function buildProductCardDisplay({
  title,
  categoryLabel,
  modelName,
  specCapsules,
}: {
  title: string | null | undefined;
  categoryLabel: string;
  modelName?: string | null;
  specCapsules?: readonly string[] | null;
}): ProductCardDisplay {
  const rawTitle = (title || "").trim();
  const matchedBrand = findBrandRule(rawTitle);
  const brandLabel = matchedBrand
    ? matchedBrand.label
    : categoryLabel || "한밭중고전자";
  const hasBrand = Boolean(matchedBrand);

  // 1) 제목 끝 괄호 영역 분리 (예: "(냉방 6.5kW / 난방 7.5kW, CSV-Q161AW)")
  let mainTitle = rawTitle;
  const parentheticalSpecs: string[] = [];
  let modelFromParens: string | null = null;

  const trailingParenMatch = mainTitle.match(/\s*\(([^()]+)\)\s*$/);
  if (trailingParenMatch) {
    const inside = trailingParenMatch[1].trim();
    const candidateMain = mainTitle.slice(0, trailingParenMatch.index).trim();
    if (candidateMain.length >= 4) {
      mainTitle = candidateMain;
      const chunks = inside
        .split(/\s*[,/]\s*/)
        .map((c) => c.trim())
        .filter(Boolean);

      for (const chunk of chunks) {
        if (isModelCodeToken(chunk)) {
          if (!modelFromParens) {
            modelFromParens = sanitizeCardModelCode(chunk);
          }
        } else {
          parentheticalSpecs.push(chunk);
        }
      }
    }
  }

  // 2) 상단에 제조사명이 이미 표시되므로, 제품명 선두의 중복 제조사 표기 제거
  if (matchedBrand) {
    const withoutPrefix = mainTitle
      .replace(matchedBrand.stripPrefix, "")
      .trim();
    if (withoutPrefix.length >= 3) {
      mainTitle = withoutPrefix;
    }
  }

  const cleanModelCode =
    sanitizeCardModelCode(modelName) || modelFromParens || null;

  // 3) 핵심 사양 요약 조합 (제목·모델코드와 중복되는 항목 자동 제외, 최대 3개)
  const normalizedTitleLower = mainTitle.toLowerCase();
  const normalizedModelLower = (cleanModelCode || "").toLowerCase();
  const summaryParts: string[] = [];

  const tryPushSpec = (rawSpec: string) => {
    const spec = rawSpec.trim();
    if (!spec || spec.length > 26) return;
    if (summaryParts.length >= 3) return;
    const lower = spec.toLowerCase();
    if (normalizedModelLower && lower === normalizedModelLower) return;
    // 제목에 이미 동일 수치/단어가 명확히 들어있으면 중복 생략 (예: "16평형", "23L", "식기세척기")
    if (normalizedTitleLower.includes(lower)) return;
    if (
      summaryParts.some(
        (existing) =>
          existing.toLowerCase() === lower ||
          existing.toLowerCase().includes(lower) ||
          lower.includes(existing.toLowerCase())
      )
    ) {
      return;
    }
    summaryParts.push(spec);
  };

  for (const ps of parentheticalSpecs) {
    tryPushSpec(ps);
  }
  for (const cap of specCapsules || []) {
    tryPushSpec(cap);
  }

  const specSummary =
    summaryParts.length > 0
      ? summaryParts.join(" · ")
      : CATEGORY_SPEC_FALLBACK[categoryLabel] || categoryLabel || null;

  const subMetaParts: string[] = [...summaryParts.slice(0, 2)];
  if (cleanModelCode) {
    subMetaParts.push(cleanModelCode);
  }
  const subMetaLine =
    subMetaParts.length > 0 ? subMetaParts.join(" · ") : null;

  const resolvedMainTitle = mainTitle || rawTitle;
  const descriptiveTitle =
    parentheticalSpecs.length > 0
      ? `${resolvedMainTitle} (${parentheticalSpecs.slice(0, 2).join(", ")})`
      : resolvedMainTitle;

  return {
    brandLabel,
    hasBrand,
    displayTitle: resolvedMainTitle,
    descriptiveTitle,
    modelCode: cleanModelCode,
    specSummary,
    subMetaLine,
  };
}

/**
 * 갤러리 카드 하단의 정돈된 1줄 요약 스펙을 생성합니다.
 */
export function formatCleanCardMeta({
  modelName,
  specCapsules,
}: {
  modelName?: string | null;
  specCapsules?: readonly string[] | null;
}): string | null {
  const parts: string[] = [];
  const cleanCode = sanitizeCardModelCode(modelName);
  if (cleanCode) {
    parts.push(cleanCode);
  }

  const specs = (specCapsules || [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 18);

  for (const spec of specs) {
    if (parts.length >= 2) break;
    if (!parts.some((p) => p.toLowerCase() === spec.toLowerCase())) {
      parts.push(spec);
    }
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}
