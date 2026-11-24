// 파일 경로: lib/kakao-skill.ts
// 카카오톡 채널(카카오 i 오픈빌더) DB 직접 조회형 스킬 파싱·검색·응답 생성 순수 헬퍼

import {
  STORE,
  extractModelName,
  extractSpecCapsules,
  extractWidthMmFromText,
  formatProductPrice,
  getCategoryWarrantyInfo,
  hasProductPrice,
  isProductPendingReview,
  isProductReserved,
  isProductSold,
  matchesSearchQuery,
  normalizeProductCategory,
  splitImages,
} from "./site";
import { buildProductCardDisplay } from "./product-card-meta";

export const KAKAO_SKILL_CAROUSEL_LIMIT = 10;

export interface KakaoProductRecord {
  id: string | number;
  title?: string | null;
  category?: string | null;
  description?: string | null;
  image_url?: string | null;
  price?: number | null;
  status?: string | null;
  created_at?: string | null;
}

export interface KakaoSkillRequestPayload {
  userRequest?: {
    utterance?: unknown;
    user?: {
      id?: unknown;
    };
  };
  action?: {
    params?: Record<string, unknown>;
    clientExtra?: Record<string, unknown>;
  };
}

export type KakaoSkillButton =
  | {
      action: "webLink";
      label: string;
      webLinkUrl: string;
    }
  | {
      action: "phone";
      label: string;
      phoneNumber: string;
    }
  | {
      action: "message";
      label: string;
      messageText: string;
    };

export interface KakaoBasicCard {
  title: string;
  description: string;
  thumbnail: {
    imageUrl: string;
    fixedRatio?: boolean;
  };
  buttons: KakaoSkillButton[];
}

export type KakaoSkillOutput =
  | {
      simpleText: {
        text: string;
      };
    }
  | {
      basicCard: KakaoBasicCard;
    }
  | {
      carousel: {
        type: "basicCard";
        items: KakaoBasicCard[];
      };
    };

export interface KakaoQuickReply {
  label: string;
  action: "message";
  messageText: string;
}

export interface KakaoSkillResponse {
  version: "2.0";
  template: {
    outputs: KakaoSkillOutput[];
    quickReplies?: KakaoQuickReply[];
  };
}

export interface ParsedKakaoQuery {
  rawUtterance: string;
  normalizedQuery: string;
  tokens: string[];
  keywordTokens: string[];
  requestedWidthMm: number | null;
}

export const KAKAO_DEFAULT_QUICK_REPLIES: readonly KakaoQuickReply[] = [
  { label: "에어컨 추천", action: "message", messageText: "중고 에어컨 추천" },
  { label: "냉장고 1200", action: "message", messageText: "냉장고 1200" },
  { label: "업소용 냉장고", action: "message", messageText: "업소용 냉장고" },
  { label: "김치냉장고", action: "message", messageText: "김치냉장고" },
  { label: "드럼세탁기", action: "message", messageText: "드럼세탁기" },
  { label: "제빙기·쇼케이스", action: "message", messageText: "제빙기" },
] as const;

const CONVERSATIONAL_FILLERS = new Set([
  "있어요",
  "있나요",
  "있습니까",
  "있는지",
  "있을까요",
  "있어",
  "있나",
  "보여줘",
  "보여주세요",
  "보여",
  "알려줘",
  "알려주세요",
  "찾아요",
  "찾고있어요",
  "찾습니다",
  "찾아줘",
  "추천",
  "추천해줘",
  "추천해주세요",
  "추천좀",
  "가격",
  "얼마",
  "얼마예요",
  "얼마에요",
  "얼마인가요",
  "얼마나",
  "금액",
  "비용",
  "중고",
  "매물",
  "제품",
  "상품",
  "재고",
  "물건",
  "혹시",
  "지금",
  "현재",
  "구매",
  "구해요",
  "구합니다",
  "사고싶어요",
  "원해요",
  "필요해요",
  "문의",
  "좀",
  "한밭중고전자",
  "매장",
  "검색",
]);

const TRAILING_PHRASE_REGEX =
  /(?:있습니까|있을까요|있나요|있어요|있는지|보여주세요|보여줘|알려주세요|알려줘|추천해주세요|추천해줘|추천|얼마예요|얼마에요|얼마인가요|가격|얼마|구해요|사고싶어요|필요해요)$/i;

const TOKEN_SUFFIX_REGEX =
  /(?:짜리|에서|으로|이나|이랑|하고|부터|까지|처럼|정도|이상|이하|가량|인가요|은|는|을|를|도|만|좀|요)$/;

function stripSingleTokenNoise(rawToken: string): string {
  let token = rawToken.trim();
  if (!token) return "";

  token = token.replace(TRAILING_PHRASE_REGEX, "").trim();
  if (!token) return "";

  // 숫자 + mm 단위 또는 '가로1200', '폭1200' 결합 토큰 정규화 (예: 1200mm, 가로1200 -> 1200)
  const mmMatch = token.match(/^(?:가로|폭)?(\d{3,4})\s*(?:mm)?$/i);
  if (mmMatch) {
    return mmMatch[1];
  }

  // 조사 제거는 어간 2글자 이상인 경우만 제한적으로 수행 ("벽걸이", "통돌이", "냉장고" 보존)
  if (token.length >= 3) {
    const stripped = token.replace(TOKEN_SUFFIX_REGEX, "").trim();
    if (stripped.length >= 2) {
      token = stripped;
    }
  }

  return CONVERSATIONAL_FILLERS.has(token) ? "" : token;
}

export function extractUtteranceFromKakaoPayload(
  payload: KakaoSkillRequestPayload | null | undefined
): string {
  const paramQuery = payload?.action?.params?.query;
  if (typeof paramQuery === "string" && paramQuery.trim()) {
    return paramQuery.trim();
  }
  const extraQuery = payload?.action?.clientExtra?.query;
  if (typeof extraQuery === "string" && extraQuery.trim()) {
    return extraQuery.trim();
  }
  const utterance = payload?.userRequest?.utterance;
  return typeof utterance === "string" ? utterance.trim() : "";
}

/**
 * 한국어 자연어 발화("냉장고 1200짜리 있어요?", "중고 에어컨 추천")에서
 * DB 키워드·가로 규격 토큰을 추출합니다.
 */
export function parseKakaoSearchQuery(
  rawInput: string | null | undefined
): ParsedKakaoQuery {
  const rawUtterance = (rawInput || "").trim().slice(0, 120);
  if (!rawUtterance) {
    return {
      rawUtterance: "",
      normalizedQuery: "",
      tokens: [],
      keywordTokens: [],
      requestedWidthMm: null,
    };
  }

  const sanitized = rawUtterance
    .replace(/[?!.,~'"()[\]{}/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const rawTokens = sanitized.split(" ").filter(Boolean);
  const tokens: string[] = [];
  let requestedWidthMm: number | null = null;

  for (const rawTok of rawTokens) {
    if (CONVERSATIONAL_FILLERS.has(rawTok)) continue;
    const cleaned = stripSingleTokenNoise(rawTok);
    if (!cleaned) continue;

    if (/^\d{3,4}$/.test(cleaned)) {
      const numeric = Number(cleaned);
      if (numeric >= 350 && numeric <= 3000 && requestedWidthMm === null) {
        requestedWidthMm = numeric;
      }
    }

    if (!tokens.includes(cleaned)) {
      tokens.push(cleaned);
    }
  }

  const keywordTokens = tokens.filter((tok) => !/^\d+$/.test(tok));

  return {
    rawUtterance,
    normalizedQuery: tokens.join(" "),
    tokens,
    keywordTokens,
    requestedWidthMm,
  };
}

function getSellableProducts<T extends KakaoProductRecord>(
  products: readonly T[]
): T[] {
  const active = products.filter(
    (p) =>
      p.category !== "배송인증" &&
      !isProductPendingReview(p.status) &&
      !isProductSold(p.status)
  );

  // 판매중 우선, 예약중 후순위 (각 그룹 내 최신 등록순 유지)
  return [...active].sort((a, b) => {
    const resA = isProductReserved(a.status) ? 1 : 0;
    const resB = isProductReserved(b.status) ? 1 : 0;
    return resA - resB;
  });
}

const GENERIC_MODIFIER_TOKENS = new Set([
  "업소용",
  "가정용",
  "상업용",
  "식당용",
  "카페용",
  "매장용",
  "사무용",
  "소형",
  "대형",
  "미니",
  "올스텐",
  "인버터",
]);

function scoreProductFallback(
  product: KakaoProductRecord,
  parsed: ParsedKakaoQuery
): number {
  const hay = `${product.title || ""} ${product.category || ""} ${
    product.description || ""
  }`.toLowerCase();

  const primaryKeywords = parsed.keywordTokens.filter(
    (kw) => !GENERIC_MODIFIER_TOKENS.has(kw.toLowerCase())
  );
  const effectiveKeywords =
    primaryKeywords.length > 0 ? primaryKeywords : parsed.keywordTokens;

  let primaryScore = 0;
  for (const kw of effectiveKeywords) {
    if (hay.includes(kw.toLowerCase())) {
      primaryScore += 10;
    }
  }

  // 핵심 품목 키워드 일치 없이 수식어/숫자만 맞는 경우(예: "업소용 튀김기" -> 냉장고 반환) 차단
  if (effectiveKeywords.length > 0 && primaryScore === 0) {
    return 0;
  }

  let score = primaryScore;
  for (const kw of parsed.keywordTokens) {
    if (GENERIC_MODIFIER_TOKENS.has(kw.toLowerCase()) && hay.includes(kw.toLowerCase())) {
      score += 3;
    }
  }

  if (parsed.requestedWidthMm !== null) {
    const numStr = String(parsed.requestedWidthMm);
    if (hay.includes(numStr)) {
      score += 8;
    } else {
      const extractedWidth = extractWidthMmFromText(hay);
      if (extractedWidth !== null) {
        const diff = Math.abs(extractedWidth - parsed.requestedWidthMm);
        if (diff <= 150) {
          score += 5 - Math.floor(diff / 50);
        }
      }
    }
  }

  return score;
}

export type KakaoSearchMatchType = "exact" | "fallback" | "featured" | "empty";

export interface KakaoSearchResult<T extends KakaoProductRecord> {
  items: T[];
  totalMatched: number;
  matchType: KakaoSearchMatchType;
  parsed: ParsedKakaoQuery;
}

export function searchKakaoCatalogProducts<T extends KakaoProductRecord>(
  products: readonly T[],
  rawQuery: string | null | undefined,
  maxItems = KAKAO_SKILL_CAROUSEL_LIMIT
): KakaoSearchResult<T> {
  const limit = Math.max(1, Math.min(maxItems, KAKAO_SKILL_CAROUSEL_LIMIT));
  const sellable = getSellableProducts(products);
  const parsed = parseKakaoSearchQuery(rawQuery);

  if (parsed.tokens.length === 0) {
    const featured = sellable.slice(0, limit);
    return {
      items: featured,
      totalMatched: sellable.length,
      matchType: featured.length > 0 ? "featured" : "empty",
      parsed,
    };
  }

  const exactMatches = sellable.filter((p) =>
    matchesSearchQuery(
      parsed.normalizedQuery,
      p.title,
      p.category,
      p.description
    )
  );

  if (exactMatches.length > 0) {
    return {
      items: exactMatches.slice(0, limit),
      totalMatched: exactMatches.length,
      matchType: "exact",
      parsed,
    };
  }

  // 다중 토큰/규격 검색에서 정확 일치가 0건이면 품목 키워드·근접 가로 규격 순으로 관련 매물 안내
  const scoredFallback = sellable
    .map((item) => ({
      item,
      score: scoreProductFallback(item, parsed),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scoredFallback.length > 0) {
    return {
      items: scoredFallback.slice(0, limit).map((e) => e.item),
      totalMatched: scoredFallback.length,
      matchType: "fallback",
      parsed,
    };
  }

  return {
    items: [],
    totalMatched: 0,
    matchType: "empty",
    parsed,
  };
}

export function truncateKakaoText(text: string, maxLength: number): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, Math.max(1, maxLength - 1)).trim()}…`;
}

function hasKakaoStandardImageExtension(rawUrl: string): boolean {
  try {
    const pathname = new URL(rawUrl).pathname.toLowerCase();
    return (
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".png")
    );
  } catch {
    return false;
  }
}

/**
 * 카카오톡 클라이언트는 WebP 썸네일이 일부 환경에서 누락될 수 있으므로,
 * JPG/PNG가 아닌 이미지(예: Supabase WebP)는 /api/kakao/thumb?id=... JPEG 프록시로 연결합니다.
 */
export function resolveKakaoThumbnailUrl(
  product: Pick<KakaoProductRecord, "id" | "image_url">,
  siteOrigin: string = STORE.url
): string {
  const origin = siteOrigin.replace(/\/+$/, "");
  const primary = splitImages(product.image_url)[0];
  if (!primary) {
    return `${origin}/og-image.jpg`;
  }

  try {
    const parsed = new URL(primary);
    if (parsed.protocol !== "https:") {
      return `${origin}/og-image.jpg`;
    }
    if (hasKakaoStandardImageExtension(primary)) {
      return primary;
    }
    return `${origin}/api/kakao/thumb?id=${encodeURIComponent(
      String(product.id)
    )}`;
  } catch {
    return `${origin}/og-image.jpg`;
  }
}

export function buildKakaoProductCard(
  product: KakaoProductRecord,
  siteOrigin: string = STORE.url
): KakaoBasicCard {
  const origin = siteOrigin.replace(/\/+$/, "");
  const normalizedCategory = normalizeProductCategory(product.category);
  const modelName = extractModelName(product.description, product.title);
  const specCapsules = extractSpecCapsules(
    product.title,
    product.description,
    2,
    normalizedCategory
  );
  const display = buildProductCardDisplay({
    title: product.title || "중고가전 실매물",
    categoryLabel: normalizedCategory,
    modelName,
    specCapsules,
  });

  const statusPrefix = isProductReserved(product.status) ? "[예약중] " : "";
  const title = truncateKakaoText(
    `${statusPrefix}${display.displayTitle}`,
    45
  );

  const priceLabel = hasProductPrice(product.price)
    ? `${formatProductPrice(product.price)}원`
    : "가격 전화문의";
  const warrantyLabel = getCategoryWarrantyInfo(normalizedCategory).shortLabel;
  const specChunk = display.subMetaLine || display.specSummary;
  const descParts = [priceLabel, specChunk, warrantyLabel].filter(Boolean);
  const description = truncateKakaoText(descParts.join(" · "), 72);

  return {
    title,
    description,
    thumbnail: {
      imageUrl: resolveKakaoThumbnailUrl(product, origin),
      fixedRatio: true,
    },
    buttons: [
      {
        action: "webLink",
        label: "상세보기",
        webLinkUrl: `${origin}/${encodeURIComponent(String(product.id))}`,
      },
      {
        action: "phone",
        label: "전화문의",
        phoneNumber: STORE.tel,
      },
    ],
  };
}

export function buildKakaoSkillSearchResponse({
  products,
  rawQuery,
  siteOrigin = STORE.url,
}: {
  products: readonly KakaoProductRecord[];
  rawQuery: string | null | undefined;
  siteOrigin?: string;
}): KakaoSkillResponse {
  const origin = siteOrigin.replace(/\/+$/, "");
  const result = searchKakaoCatalogProducts(products, rawQuery);
  const quickReplies = [...KAKAO_DEFAULT_QUICK_REPLIES];

  if (result.items.length === 0) {
    const queryLabel = result.parsed.rawUtterance
      ? `'${truncateKakaoText(result.parsed.rawUtterance, 24)}' `
      : "";

    return {
      version: "2.0",
      template: {
        outputs: [
          {
            basicCard: {
              title: "찾으시는 매물이 보이지 않나요?",
              description: truncateKakaoText(
                `${queryLabel}조건의 등록 매물이 없거나 방금 입고 중일 수 있습니다. 전체 매물 보기 또는 전화로 바로 확인해 보세요.`,
                72
              ),
              thumbnail: {
                imageUrl: `${origin}/og-image.jpg`,
                fixedRatio: true,
              },
              buttons: [
                {
                  action: "webLink",
                  label: "전체 매물 보기",
                  webLinkUrl: result.parsed.normalizedQuery
                    ? `${origin}/gallery?q=${encodeURIComponent(
                        result.parsed.normalizedQuery
                      )}`
                    : `${origin}/gallery`,
                },
                {
                  action: "phone",
                  label: "전화문의",
                  phoneNumber: STORE.tel,
                },
              ],
            },
          },
        ],
        quickReplies,
      },
    };
  }

  const cards = result.items.map((item) => buildKakaoProductCard(item, origin));
  const queryLabel = result.parsed.normalizedQuery || result.parsed.rawUtterance;
  const countText =
    result.totalMatched > cards.length
      ? `총 ${result.totalMatched}건 중 상위 ${cards.length}건`
      : `${cards.length}건`;

  let leadText = "";
  if (result.matchType === "exact") {
    leadText = `'${truncateKakaoText(
      queryLabel,
      24
    )}' 실매물 ${countText}입니다. 카드를 옆으로 넘겨 확인해 보세요.`;
  } else if (result.matchType === "fallback") {
    leadText = `'${truncateKakaoText(
      queryLabel,
      24
    )}' 정확 일치가 없어 관련 실매물 ${countText}을 안내해 드립니다.`;
  } else {
    leadText = `${STORE.name} 현재 판매중 최신 실매물 ${cards.length}건입니다. 품목명이나 가로 규격(예: 냉장고 1200)을 입력해 보세요.`;
  }

  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: leadText,
          },
        },
        {
          carousel: {
            type: "basicCard",
            items: cards,
          },
        },
      ],
      quickReplies,
    },
  };
}

export function buildKakaoSkillErrorResponse(
  siteOrigin: string = STORE.url
): KakaoSkillResponse {
  const origin = siteOrigin.replace(/\/+$/, "");
  return {
    version: "2.0",
    template: {
      outputs: [
        {
          basicCard: {
            title: "잠시 매물 조회가 지연되고 있습니다",
            description: `아래 버튼으로 홈페이지 실매물을 바로 보시거나 ${STORE.tel}로 전화 문의해 주세요.`,
            thumbnail: {
              imageUrl: `${origin}/og-image.jpg`,
              fixedRatio: true,
            },
            buttons: [
              {
                action: "webLink",
                label: "매물 갤러리 열기",
                webLinkUrl: `${origin}/gallery`,
              },
              {
                action: "phone",
                label: "전화문의",
                phoneNumber: STORE.tel,
              },
            ],
          },
        },
      ],
      quickReplies: [...KAKAO_DEFAULT_QUICK_REPLIES],
    },
  };
}
