// 파일 경로: app/admin/page.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  supabase,
  isAuthorizedAdminUser,
  getAdminAuthHeaders,
} from "../../lib/supabase";
import {
  STORE,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS,
  PRODUCT_STATUS_LIST,
  PRODUCT_CONDITION_GRADES,
  INQUIRY_ADMIN_STATUS_OPTIONS,
  isPriorityInquiryStatus,
  isProductSold,
  normalizeProductStatus,
  normalizeProductCategory,
  formatProductPrice,
  splitImages,
  compressImage,
  rotateImageFile,
  enhanceImageFile,
  PRODUCT_IMAGE_TONE_PRESET,
  PRODUCT_IMAGE_TONE_EXTRA,
  sanitizeOldManufactureYear,
  validateImageFiles,
  extractModelName,
  extractInquiryImages,
  generatePromoPostText,
  parseStructuredInquiryDescription,
  getDaysSinceCreated,
  matchesSearchQuery,
  type NotificationDispatchResult,
  telHref,
  revokeObjectUrls,
} from "../../lib/site";

import { Icon, ICON, SafeImg } from "../../lib/ui";
import {
  removeStorageImagesSafe,
  compressAndUploadProductImages,
} from "../../lib/product-ops";

type AdminTab = "overview" | "inquiries" | "products" | "delivery" | "notifications";

interface AdminProductRow {
  id: string;
  title: string;
  price?: number | null;
  category?: string | null;
  condition_grade?: string | null;
  status?: string | null;
  description?: string | null;
  image_url?: string | null;
  views?: number | null;
  created_at?: string | null;
}

interface AdminDeliveryRow {
  id: string;
  title: string;
  description?: string | null;
  image_url?: string | null;
  created_at?: string | null;
}

interface AdminInquiryRow {
  id: string;
  name: string;
  masked_name?: string;
  phone: string;
  inquiry_type: string;
  category: string;
  model?: string | null;
  condition_grade?: string | null;
  region?: string | null;
  description?: string | null;
  images?: string[];
  image_url?: string | null;
  has_images?: boolean;
  is_notice?: boolean;
  status: string;
  admin_reply?: string | null;
  created_at: string;
}

const ADMIN_REPLY_TEMPLATES = [
  {
    label: "매입 견적 안내",
    text: `안녕하세요, ${STORE.name}입니다.\n남겨주신 매입 문의와 사진을 확인했습니다. 정확한 수거 일정 및 견적 안내를 위해 기재해주신 연락처로 곧 전화드리겠습니다. 감사합니다.`,
  },
  {
    label: "구매·재고 안내",
    text: `안녕하세요, ${STORE.name}입니다.\n문의하신 제품은 현재 매장 실물 확인 및 배송·설치 상담이 가능합니다. 설치 지역과 여건에 맞춰 담당자가 곧 연락드리겠습니다.`,
  },
  {
    label: "방문 일정 조율",
    text: `안녕하세요, ${STORE.name}입니다.\n요청하신 희망 방문 일정을 확인했습니다. 기사님 배차 스케줄을 확인한 뒤 오늘 중으로 유선 연락드리겠습니다.`,
  },
] as const;

export default function IntegratedAdminDashboard() {
  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUserEmail, setAdminUserEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPw, setLoginPw] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  /* 데이터 상태 */
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [deliveryCases, setDeliveryCases] = useState<AdminDeliveryRow[]>([]);
  const [inquiries, setInquiries] = useState<AdminInquiryRow[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  /* 문의/매입 필터 상태 */
  const [inqTypeFilter, setInqTypeFilter] = useState<string>("전체");
  const [inqStatusFilter, setInqStatusFilter] = useState<string>("priority");
  const [inqKeyword, setInqKeyword] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  /* 상품 검색·필터 및 등록/수정 폼 상태 */
  const [prodCategoryFilter, setProdCategoryFilter] = useState<string>("전체");
  const [prodStatusFilter, setProdStatusFilter] = useState<string>("전체");
  const [prodKeyword, setProdKeyword] = useState("");

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingExistingImages, setEditingExistingImages] = useState<string[]>([]);
  const [prodTitle, setProdTitle] = useState("");
  const [prodModel, setProdModel] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCategory, setProdCategory] = useState<string>(PRODUCT_CATEGORIES[0]);
  const [prodGrade, setProdGrade] = useState<string>(PRODUCT_CONDITION_GRADES[1]);
  const [prodStatus, setProdStatus] = useState<string>(PRODUCT_STATUS.SELLING);
  const [prodDesc, setProdDesc] = useState("");
  const [prodFiles, setProdFiles] = useState<File[]>([]);
  const [prodPreviews, setProdPreviews] = useState<string[]>([]);
  const [savingProduct, setSavingProduct] = useState(false);

  /* Gemini AI 상품 분석 3계층 상태 */
  const [useSearchSpecs, setUseSearchSpecs] = useState(true);
  const [analyzingProduct, setAnalyzingProduct] = useState(false);
  const [aiPhotoObserved, setAiPhotoObserved] = useState<string[]>([]);
  const [aiSearchSpecs, setAiSearchSpecs] = useState<string[]>([]);
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const [aiSourceNote, setAiSourceNote] = useState<string>("");
  const [aiSources, setAiSources] = useState<string[]>([]);

  /* 배송·설치 사례 등록 상태 */
  const [delivTitle, setDelivTitle] = useState("");
  const [delivFiles, setDelivFiles] = useState<File[]>([]);
  const [delivPreviews, setDelivPreviews] = useState<string[]>([]);
  const [analyzingDelivery, setAnalyzingDelivery] = useState(false);
  const [delivObserved, setDelivObserved] = useState<string[]>([]);
  const [delivReviewNotes, setDelivReviewNotes] = useState<string[]>([]);
  const [savingDelivery, setSavingDelivery] = useState(false);

  /* 알림 발송 기록 및 상태 점검 */
  const [notificationLogs, setNotificationLogs] = useState<
    Record<string, NotificationDispatchResult>
  >({});

  const fetchAllAdminData = useCallback(async () => {
    setLoadingData(true);
    try {
      const { data: allProds, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!prodErr && allProds) {
        setProducts(allProds.filter((p) => p.category !== "배송인증"));
        setDeliveryCases(allProds.filter((p) => p.category === "배송인증"));
      }

      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/inquiries", { headers });
      if (res.ok) {
        const json = await res.json();
        setInquiries(json.inquiries || []);
      }
    } catch (err) {
      console.error("관리자 데이터 조회 오류:", err);
      toast.error("데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const ok = isAuthorizedAdminUser(session?.user);
      setIsAdmin(ok);
      setAdminUserEmail(session?.user?.email || "");
      setAuthChecking(false);
      if (ok) fetchAllAdminData();
    };
    check();

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const ok = isAuthorizedAdminUser(session?.user);
      setIsAdmin(ok);
      setAdminUserEmail(session?.user?.email || "");
      setAuthChecking(false);
      if (ok) fetchAllAdminData();
    });
    return () => sub.subscription.unsubscribe();
  }, [fetchAllAdminData]);

  // 관리자 컴포넌트 언마운트 시 메모리에 잔류하는 모든 Blob Object URL 일괄 해제
  useEffect(() => {
    return () => {
      revokeObjectUrls(prodPreviews);
      revokeObjectUrls(delivPreviews);
    };
  }, [prodPreviews, delivPreviews]);

  /* ───── 기본 운영 지표 계산 ───── */
  const metrics = useMemo(() => {
    const regularInquiries = inquiries.filter((i) => !i.is_notice);
    const priorityCount = regularInquiries.filter((i) =>
      isPriorityInquiryStatus(i.status)
    ).length;
    const buybackCount = regularInquiries.filter(
      (i) =>
        (i.inquiry_type || "").includes("팔기") ||
        (i.inquiry_type || "").includes("매입")
    ).length;
    const sellingProducts = products.filter(
      (p) => normalizeProductStatus(p.status) === "판매중"
    ).length;
    const reservedProducts = products.filter(
      (p) => normalizeProductStatus(p.status) === "예약중"
    ).length;
    const soldProducts = products.filter((p) => isProductSold(p.status)).length;
    const staleSellingProducts = products.filter(
      (p) =>
        normalizeProductStatus(p.status) === "판매중" &&
        getDaysSinceCreated(p.created_at) >= 30
    ).length;

    return {
      totalInquiries: regularInquiries.length,
      priorityCount,
      buybackCount,
      totalProducts: products.length,
      sellingProducts,
      reservedProducts,
      soldProducts,
      staleSellingProducts,
      deliveryCount: deliveryCases.length,
    };
  }, [inquiries, products, deliveryCases]);

  /* ───── 문의/매입 필터링 (공지사항 필터 포함) ───── */
  const filteredInquiries = useMemo(() => {
    const q = inqKeyword.trim().toLowerCase();
    return inquiries
      .filter((i) => {
        if (inqStatusFilter === "notice") return Boolean(i.is_notice);
        if (i.is_notice) return false;
        if (inqTypeFilter !== "전체" && i.inquiry_type !== inqTypeFilter) {
          return false;
        }
        if (inqStatusFilter === "priority") {
          return isPriorityInquiryStatus(i.status);
        }
        if (
          inqStatusFilter !== "전체" &&
          (i.status || "접수") !== inqStatusFilter
        ) {
          return false;
        }
        if (q) {
          const hay = `${i.name || ""} ${i.phone || ""} ${i.category || ""} ${
            i.description || ""
          }`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const priA = isPriorityInquiryStatus(a.status) ? 0 : 1;
        const priB = isPriorityInquiryStatus(b.status) ? 0 : 1;
        if (priA !== priB) return priA - priB;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [inquiries, inqTypeFilter, inqStatusFilter, inqKeyword]);

  /* ───── 상품 필터링 ───── */
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const cat = normalizeProductCategory(p.category);
      const stat = normalizeProductStatus(p.status);
      if (prodCategoryFilter !== "전체" && cat !== prodCategoryFilter)
        return false;
      if (prodStatusFilter === "stale30") {
        if (stat !== "판매중" || getDaysSinceCreated(p.created_at) < 30) {
          return false;
        }
      } else if (prodStatusFilter !== "전체" && stat !== prodStatusFilter) {
        return false;
      }
      if (prodKeyword) {
        const modelName = extractModelName(p.description, p.title) || "";
        if (
          !matchesSearchQuery(
            prodKeyword,
            p.id,
            p.title,
            modelName,
            p.description
          )
        ) {
          return false;
        }
      }
      return true;
    });
  }, [products, prodCategoryFilter, prodStatusFilter, prodKeyword]);

  /* ───── 관리자 로그인 / 로그아웃 ───── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loggingIn) return;
    setLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPw,
      });
      if (error) throw error;
      if (!isAuthorizedAdminUser(data.user)) {
        await supabase.auth.signOut();
        toast.error("관리자 권한이 허용되지 않은 계정입니다.");
        return;
      }
      toast.success("관리자 대시보드에 로그인되었습니다.");
      setLoginPw("");
    } catch {
      toast.error("로그인 실패: 이메일과 비밀번호를 확인해 주세요.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("관리자 세션에서 로그아웃하시겠습니까?")) return;
    await supabase.auth.signOut();
    setIsAdmin(false);
    toast.success("로그아웃되었습니다.");
  };

  /* ───── 문의 명시적 상태 변경 및 답변 저장 ───── */
  const handleExplicitInquiryStatusChange = async (
    inquiryId: string,
    nextStatus: string
  ) => {
    if (busyActionId) return;
    setBusyActionId(`inq-status-${inquiryId}`);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "상태 변경 실패");

      setInquiries((prev) =>
        prev.map((row) =>
          row.id === inquiryId ? { ...row, status: nextStatus } : row
        )
      );
      toast.success(`진행 상태가 '${nextStatus}'(으)로 변경되었습니다.`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "상태 변경에 실패했습니다."
      );
    } finally {
      setBusyActionId(null);
    }
  };

  const handleSaveInquiryReply = async (inquiryId: string) => {
    if (!replyDraft.trim()) {
      toast.error("답변 내용을 입력해 주세요.");
      return;
    }
    if (busyActionId) return;
    setBusyActionId(`inq-reply-${inquiryId}`);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_reply: replyDraft.trim(),
          status: "답변완료",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "답변 저장 실패");

      setInquiries((prev) =>
        prev.map((row) =>
          row.id === inquiryId
            ? { ...row, admin_reply: replyDraft.trim(), status: "답변완료" }
            : row
        )
      );
      setActiveReplyId(null);
      setReplyDraft("");
      toast.success("답변이 등록되고 '답변완료' 상태로 변경되었습니다.");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "답변 등록 중 오류가 발생했습니다."
      );
    } finally {
      setBusyActionId(null);
    }
  };

  const handleDeleteInquiry = async (inquiryId: string, title: string) => {
    if (
      !confirm(
        `'${title}' 문의 내역을 영구 삭제하시겠습니까?\n삭제된 내역은 복구할 수 없습니다.`
      )
    )
      return;
    if (busyActionId) return;
    setBusyActionId(`inq-del-${inquiryId}`);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("삭제 실패");
      setInquiries((prev) => prev.filter((r) => r.id !== inquiryId));
      toast.success("문의 내역이 삭제되었습니다.");
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    } finally {
      setBusyActionId(null);
    }
  };

  /* ───── 알림 수동 재발송 ───── */
  const handleManualNotificationDispatch = async (
    channel: "telegram" | "alimtalk",
    inq: { id: string; name: string; phone: string; inquiry_type: string; category: string }
  ) => {
    const actionKey = `notify-${channel}-${inq.id}`;
    if (busyActionId) return;
    setBusyActionId(actionKey);

    try {
      const headers = await getAdminAuthHeaders();
      const endpoint = channel === "telegram" ? "/api/telegram" : "/api/alimtalk";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryId: inq.id,
          name: inq.name,
          phone: inq.phone,
          type: inq.inquiry_type,
          title: inq.category,
          forceRetry: true,
        }),
      });
      const json = (await res.json()) as NotificationDispatchResult;
      setNotificationLogs((prev) => ({
        ...prev,
        [`${channel}:${inq.id}`]: json,
      }));

      if (json.sent) {
        toast.success(`[${channel.toUpperCase()}] ${json.statusLabel}: ${json.message}`);
      } else {
        toast.error(`[${channel.toUpperCase()}] ${json.statusLabel}: ${json.message}`);
      }
    } catch {
      toast.error("알림 요청 중 네트워크 오류가 발생했습니다.");
    } finally {
      setBusyActionId(null);
    }
  };

  /* ───── Gemini AI 상품 사진 분석 (3계층 분리 + 5년 경과 연식 블라인드 + 자동 회전) ───── */
  const adminUserRotatedRef = useRef<Set<number>>(new Set());

  const rotateProdFile = async (
    index: number,
    degrees = 90,
    isAuto = false
  ) => {
    let targetFile: File | null = null;
    setProdFiles((prev) => {
      targetFile = prev[index] || null;
      return prev;
    });
    if (!targetFile) return;

    try {
      const rotated = await rotateImageFile(targetFile, degrees);
      setProdFiles((prev) => {
        const next = [...prev];
        if (index < next.length) next[index] = rotated;
        return next;
      });
      setProdPreviews((prev) => {
        const next = [...prev];
        if (index < next.length) {
          if (next[index]) URL.revokeObjectURL(next[index]);
          next[index] = URL.createObjectURL(rotated);
        }
        return next;
      });
      if (!isAuto) {
        adminUserRotatedRef.current.add(index);
        toast.success(`${index + 1}번 사진이 90° 회전되었습니다.`);
      }
    } catch {
      if (!isAuto) toast.error("사진 회전에 실패했습니다.");
    }
  };

  const enhanceProdFile = async (
    index: number,
    options: { degrees?: number; brightness?: number; contrast?: number; saturate?: number } = {},
    isAuto = false
  ) => {
    let targetFile: File | null = null;
    setProdFiles((prev) => {
      targetFile = prev[index] || null;
      return prev;
    });
    if (!targetFile) return;

    try {
      const enhanced = await enhanceImageFile(targetFile, options);
      setProdFiles((prev) => {
        const next = [...prev];
        if (index < next.length) next[index] = enhanced;
        return next;
      });
      setProdPreviews((prev) => {
        const next = [...prev];
        if (index < next.length) {
          if (next[index]) URL.revokeObjectURL(next[index]);
          next[index] = URL.createObjectURL(enhanced);
        }
        return next;
      });
      if (!isAuto) {
        adminUserRotatedRef.current.add(index);
        toast.success(`${index + 1}번 사진을 한 단계 더 밝게 보정했습니다.`);
      }
    } catch {
      if (!isAuto) toast.error("사진 보정에 실패했습니다.");
    }
  };

  const removeProdFile = (index: number) => {
    revokeObjectUrls([prodPreviews[index]]);
    setProdFiles((prev) => prev.filter((_, i) => i !== index));
    setProdPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const moveProdFile = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= prodFiles.length) return;
    setProdFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setProdPreviews((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  const makePrimaryProdFile = (targetIdx: number) => {
    if (targetIdx <= 0 || targetIdx >= prodFiles.length) return;
    setProdFiles((prev) => {
      const next = [...prev];
      const [picked] = next.splice(targetIdx, 1);
      return [picked, ...next];
    });
    setProdPreviews((prev) => {
      const next = [...prev];
      const [picked] = next.splice(targetIdx, 1);
      return [picked, ...next];
    });
  };

  const appendSearchSpecsToAdminDesc = () => {
    if (aiSearchSpecs.length === 0) return;
    const block = aiSearchSpecs.map((s) => `• ${s}`).join("\n");
    setProdDesc((prev) =>
      prev.trim() ? `${prev.trim()}\n\n[검색 참조 사양]\n${block}` : block
    );
    toast.success("검색 참조 사양이 설명란에 추가되었습니다.");
  };

  const runGeminiProductAnalysis = async (filesToAnalyze: File[]) => {
    if (filesToAnalyze.length === 0 || analyzingProduct) return;
    setAnalyzingProduct(true);
    const toastId = toast.loading(
      "Gemini AI가 사진을 판독하고 초안을 작성 중입니다..."
    );

    try {
      const formData = new FormData();
      formData.append("category", prodCategory);
      formData.append("searchSpecs", useSearchSpecs ? "true" : "false");

      for (const f of filesToAnalyze.slice(0, 3)) {
        const blob = await compressImage(f, 1080, 0.72);
        formData.append(
          "files",
          new File([blob], f.name, { type: "image/jpeg" })
        );
      }

      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/analyze-product", {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI 분석 실패");

      const cleanData = sanitizeOldManufactureYear(data);

      if (cleanData.category) {
        setProdCategory(normalizeProductCategory(cleanData.category));
      }
      if (cleanData.title) setProdTitle(cleanData.title);
      if (cleanData.modelNumber) setProdModel(cleanData.modelNumber);
      if (cleanData.specDetails) setProdDesc(cleanData.specDetails);

      setAiPhotoObserved(
        Array.isArray(cleanData.photoObserved) ? cleanData.photoObserved : []
      );
      setAiSearchSpecs(
        Array.isArray(cleanData.searchDerivedSpecs)
          ? cleanData.searchDerivedSpecs
          : []
      );
      setAiWarnings(
        Array.isArray(cleanData.needsReview) ? cleanData.needsReview : []
      );
      setAiSourceNote(data.sourceVerificationNote || "");
      setAiSources(Array.isArray(data.sourceUrls) ? data.sourceUrls : []);

      if (
        Array.isArray(data.imageRotations) &&
        data.imageRotations.length > 0
      ) {
        let rotatedCount = 0;

        for (const r of data.imageRotations as Array<{
          index?: unknown;
          rotate?: unknown;
        }>) {
          const idx = typeof r.index === "number" ? r.index - 1 : -1;
          const deg = typeof r.rotate === "number" ? r.rotate : 0;

          if (
            idx >= 0 &&
            idx < filesToAnalyze.length &&
            !adminUserRotatedRef.current.has(idx)
          ) {
            // [EVO-016] 톤업은 업로드 시 자동 적용되므로 AI는 방향 교정만 수행
            if (deg > 0 && deg < 360) {
              await enhanceProdFile(idx, { degrees: deg }, true);
              rotatedCount++;
            }
          }
        }

        if (rotatedCount > 0) {
          toast.success(
            "AI가 옆으로 누운 사진을 감지하여 정방향으로 자동 회전했습니다."
          );
        }
      }

      toast.success("AI 초안이 작성되었습니다. 확인 후 저장해 주세요.", {
        id: toastId,
      });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "AI 분석에 실패했습니다.",
        { id: toastId }
      );
    } finally {
      setAnalyzingProduct(false);
    }
  };

  const handleProductFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files);
    e.target.value = "";
    adminUserRotatedRef.current.clear();
    const remaining = 3 - (editingExistingImages.length + prodFiles.length);
    if (remaining <= 0) {
      toast.error("상품 사진은 최대 3장까지 등록할 수 있습니다.");
      return;
    }
    const { ok, error } = validateImageFiles(picked, remaining);
    if (error) toast.error(error);
    if (ok.length === 0) return;

    // [EVO-016] 업로드 즉시 쇼룸 스튜디오 톤업 자동 적용 (톤업 버튼을 누르지 않아도 기본 진행)
    const toned = await Promise.all(
      ok.map(async (f) => {
        try {
          return await enhanceImageFile(f, PRODUCT_IMAGE_TONE_PRESET);
        } catch {
          return f;
        }
      })
    );

    setProdFiles((prev) => [...prev, ...toned]);
    setProdPreviews((prev) => [
      ...prev,
      ...toned.map((f) => URL.createObjectURL(f)),
    ]);
    toast.success(
      `사진 ${toned.length}장에 쇼룸 스튜디오 톤업(밝기 +20%)을 자동 적용했습니다.`
    );

    if (prodFiles.length === 0 && ok.length > 0 && !editingProductId) {
      // AI 판독은 보정 전 원본 기준으로 수행 (방향·밝기 판단 정확도 유지)
      runGeminiProductAnalysis(ok);
    }
  };

  const resetProductForm = () => {
    revokeObjectUrls(prodPreviews);
    adminUserRotatedRef.current.clear();
    setEditingProductId(null);
    setEditingExistingImages([]);
    setProdTitle("");
    setProdModel("");
    setProdPrice("");
    setProdCategory(PRODUCT_CATEGORIES[0]);
    setProdGrade(PRODUCT_CONDITION_GRADES[1]);
    setProdStatus(PRODUCT_STATUS.SELLING);
    setProdDesc("");
    setProdFiles([]);
    setProdPreviews([]);
    setAiPhotoObserved([]);
    setAiSearchSpecs([]);
    setAiWarnings([]);
    setAiSourceNote("");
    setAiSources([]);
  };

    const startEditProduct = (product: AdminProductRow) => {
    resetProductForm();
    setEditingProductId(product.id);
    setEditingExistingImages(splitImages(product.image_url));
    setProdTitle(product.title || "");
    setProdModel(extractModelName(product.description, product.title) || "");
    setProdCategory(normalizeProductCategory(product.category));
    setProdPrice(
      product.price && product.price > 0 ? String(product.price) : ""
    );
    setProdGrade(product.condition_grade || PRODUCT_CONDITION_GRADES[1]);
    setProdStatus(normalizeProductStatus(product.status));
    setProdDesc(product.description || "");
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handledDeepLinkRef = useRef(false);

  // URL 딥링크 (?search= 또는 ?edit=) 감지 및 원클릭 상품 수정 자동 전환
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      products.length === 0 ||
      handledDeepLinkRef.current
    )
      return;
    const urlParams = new URLSearchParams(window.location.search);
    const searchTarget = urlParams.get("search") || urlParams.get("edit");
    if (!searchTarget) return;

    handledDeepLinkRef.current = true;
    queueMicrotask(() => {
      setActiveTab("products");
      setProdKeyword(searchTarget);

      const matched = products.find(
        (p) =>
          p.id === searchTarget ||
          p.id.toLowerCase() === searchTarget.toLowerCase() ||
          p.title.includes(searchTarget)
      );
      if (matched) {
        startEditProduct(matched);
        toast.success(`'${matched.title}' 상품 수정 모드로 전환되었습니다.`);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProduct) return;
    if (!prodTitle.trim()) {
      toast.error("상품명을 입력해 주세요.");
      return;
    }
    if (editingExistingImages.length + prodFiles.length === 0) {
      toast.error("최소 1장의 상품 사진을 등록해 주세요.");
      return;
    }

    setSavingProduct(true);
    try {
      const uploadedUrls = await compressAndUploadProductImages(prodFiles);

      const numericPrice = prodPrice
        ? Number(prodPrice.replace(/[^0-9]/g, ""))
        : 0;

      let finalDesc = prodDesc.trim();
      if (prodModel.trim() && !finalDesc.includes("모델명")) {
        finalDesc = `• 모델명: ${prodModel.trim()}\n` + finalDesc;
      }

      if (editingProductId) {
        const originalProd = products.find((p) => p.id === editingProductId);
        const originalUrls = splitImages(originalProd?.image_url);
        const removedUrls = originalUrls.filter(
          (u) => !editingExistingImages.includes(u)
        );

        const mergedImages = [...editingExistingImages, ...uploadedUrls];
        const patch: Record<string, unknown> = {
          title: prodTitle.trim(),
          price: numericPrice,
          category: normalizeProductCategory(prodCategory),
          condition_grade: prodGrade,
          status: normalizeProductStatus(prodStatus),
          description: finalDesc,
          image_url: mergedImages.join(","),
        };

        const { error } = await supabase
          .from("products")
          .update(patch)
          .eq("id", editingProductId);
        if (error) throw error;

        if (removedUrls.length > 0) {
          await removeStorageImagesSafe(removedUrls).catch(() => {});
        }
        toast.success("상품 정보가 수정되었습니다.");
      } else {
        const { error } = await supabase.from("products").insert({
          title: prodTitle.trim(),
          price: numericPrice,
          category: normalizeProductCategory(prodCategory),
          condition_grade: prodGrade,
          description: finalDesc,
          image_url: uploadedUrls.join(","),
          status: normalizeProductStatus(prodStatus),
          views: 0,
        });
        if (error) throw error;
        toast.success("새 상품이 등록되었습니다.");
      }

      resetProductForm();
      await fetchAllAdminData();
    } catch (err: unknown) {
      toast.error(
        "상품 저장 실패: " +
          (err instanceof Error ? err.message : "알 수 없는 오류")
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const handleExplicitProductStatusChange = async (
    productId: string,
    nextStatus: string
  ) => {
    if (busyActionId) return;
    setBusyActionId(`prod-status-${productId}`);
    try {
      const normalized = normalizeProductStatus(nextStatus);
      const { error } = await supabase
        .from("products")
        .update({ status: normalized })
        .eq("id", productId);
      if (error) throw error;

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: normalized } : p))
      );
      toast.success(`상품 상태가 '${normalized}'(으)로 변경되었습니다.`);
    } catch {
      toast.error("상품 상태 변경에 실패했습니다.");
    } finally {
      setBusyActionId(null);
    }
  };

  const handleDeleteProduct = async (product: AdminProductRow) => {
    if (
      !confirm(
        `'${product.title}' 상품을 영구 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
      )
    )
      return;
    if (busyActionId) return;
    setBusyActionId(`prod-del-${product.id}`);

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", product.id);
      if (error) throw error;

      const imgs = splitImages(product.image_url);
      if (imgs.length > 0) {
        await removeStorageImagesSafe(imgs).catch(() => {});
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("상품이 삭제되었습니다.");
    } catch {
      toast.error("상품 삭제 중 오류가 발생했습니다.");
    } finally {
      setBusyActionId(null);
    }
  };

  /* ───── 배송·설치 사례 AI 분석 및 등록 ───── */
  const handleDeliveryFilesChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files);
    e.target.value = "";
    const { ok, error } = validateImageFiles(picked, 5 - delivFiles.length);
    if (error) toast.error(error);
    if (ok.length === 0) return;

    const merged = [...delivFiles, ...ok];
    setDelivFiles(merged);
    setDelivPreviews((prev) => [
      ...prev,
      ...ok.map((f) => URL.createObjectURL(f)),
    ]);

    if (!delivTitle.trim() && merged.length > 0) {
      setAnalyzingDelivery(true);
      const toastId = toast.loading(
        "AI가 현장 사진을 기반으로 제목 초안을 생성 중입니다..."
      );
      try {
        const formData = new FormData();
        for (const f of merged.slice(0, 2)) {
          const blob = await compressImage(f);
          formData.append(
            "files",
            new File([blob], f.name, { type: "image/jpeg" })
          );
        }
        const headers = await getAdminAuthHeaders();
        const res = await fetch("/api/analyze-delivery", {
          method: "POST",
          headers,
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "분석 실패");

        if (data.title) setDelivTitle(data.title);
        setDelivObserved(
          Array.isArray(data.observedElements) ? data.observedElements : []
        );
        setDelivReviewNotes(
          Array.isArray(data.needsReview) ? data.needsReview : []
        );
        toast.success("배송·설치 제목 초안이 작성되었습니다.", { id: toastId });
      } catch {
        toast.error("제목 자동 생성 실패. 직접 입력해 주세요.", { id: toastId });
      } finally {
        setAnalyzingDelivery(false);
      }
    }
  };

  const handleSaveDeliveryCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingDelivery) return;
    if (!delivTitle.trim() || delivFiles.length === 0) {
      toast.error("사례 제목과 최소 1장의 현장 사진을 입력해 주세요.");
      return;
    }
    setSavingDelivery(true);
    try {
      const urls = await compressAndUploadProductImages(delivFiles, {
        prefix: "delivery",
        quality: 0.82,
      });

      const { error } = await supabase.from("products").insert({
        title: delivTitle.trim(),
        category: "배송인증",
        image_url: urls.join(","),
        price: 0,
        status: "판매중",
      });
      if (error) throw error;

      revokeObjectUrls(delivPreviews);
      setDelivTitle("");
      setDelivFiles([]);
      setDelivPreviews([]);
      setDelivObserved([]);
      setDelivReviewNotes([]);
      toast.success("배송·설치 사례가 게시되었습니다.");
      await fetchAllAdminData();
    } catch {
      toast.error("배송·설치 사례 등록 중 오류가 발생했습니다.");
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleDeleteDeliveryCase = async (id: string, title: string) => {
    if (!confirm(`'${title}' 배송·설치 사례를 삭제하시겠습니까?`)) return;
    try {
      const target = deliveryCases.find((d) => d.id === id);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;

      if (target?.image_url) {
        await removeStorageImagesSafe(splitImages(target.image_url)).catch(
          () => {}
        );
      }

      setDeliveryCases((prev) => prev.filter((d) => d.id !== id));
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제하지 못했습니다.");
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7] text-[14px] font-semibold text-[#4B5260]">
        관리자 권한을 확인하고 있습니다...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F7] p-4 font-sans">
        <div className="bg-white p-7 sm:p-9 rounded-xl shadow-card border border-[#E5E2DC] w-full max-w-sm">
          <div className="text-center mb-6">
            <span className="inline-block rounded-sm bg-[#0E1A2B] px-2.5 py-0.5 text-[10.5px] font-extrabold tracking-[0.16em] text-[#FF8A50] uppercase">
              Admin Console
            </span>
            <h1 className="mt-2 text-[21px] font-extrabold text-[#0E1A2B] tracking-[-0.02em]">
              한밭중고전자 통합 관리자
            </h1>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              인가된 관리자 계정으로 로그인해야 접근할 수 있습니다.
            </p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="hb-label">관리자 이메일</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@example.com"
                className="hb-input mt-1"
              />
            </div>
            <div>
              <label className="hb-label">비밀번호</label>
              <input
                type="password"
                required
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                placeholder="••••••••"
                className="hb-input mt-1"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="hb-btn-primary h-12 w-full text-[14.5px]"
            >
              {loggingIn ? "인증 확인 중..." : "관리자 로그인"}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-[#EEEBE5] text-center">
            <Link
              href="/"
              className="text-[12.5px] font-semibold text-[#6B7280] hover:text-[#0E1A2B] underline underline-offset-4"
            >
              ← 고객용 홈 화면으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] font-sans text-[#1F2530] pb-20">
      {/* 상단 관리자 헤더 */}
      <header className="sticky top-0 z-40 bg-[#0E1A2B] text-white border-b border-white/10 shadow-md">
        <div className="hb-container py-3.5 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-[#D9531E] px-2 py-0.5 text-[10.5px] font-extrabold tracking-wider">
                ADMIN
              </span>
              <h1 className="text-[17px] sm:text-[20px] font-extrabold tracking-[-0.02em]">
                한밭중고전자 통합 운영 대시보드
              </h1>
            </div>
            <p className="text-[11.5px] text-white/65 mt-0.5 font-mono">
              접속 계정: {adminUserEmail}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={fetchAllAdminData}
              disabled={loadingData}
              className="rounded border border-white/20 bg-white/10 px-2.5 sm:px-3 py-1.5 text-[12px] font-bold hover:bg-white/20 transition-colors"
            >
              {loadingData ? "갱신 중..." : "↻ 데이터 새로고침"}
            </button>
            <Link
              href="/gallery"
              className="hidden sm:inline-flex rounded border border-white/20 bg-white/10 px-3 py-1.5 text-[12px] font-semibold hover:bg-white/20 transition-colors"
            >
              갤러리 관리
            </Link>
            <Link
              href="/"
              className="rounded border border-white/20 bg-white/10 px-2.5 sm:px-3 py-1.5 text-[12px] font-semibold hover:bg-white/20 transition-colors"
            >
              사이트 보기
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded bg-red-600/90 px-2.5 sm:px-3 py-1.5 text-[12px] font-bold text-white hover:bg-red-700 transition-colors ml-1"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 탭 내비게이션 */}
        <div className="hb-container flex gap-1 overflow-x-auto scrollbar-none border-t border-white/10 pt-2">
          {(
            [
              {
                id: "overview",
                label: "운영 요약 · 신규 접수",
                badge: metrics.priorityCount,
                highlight: metrics.priorityCount > 0,
              },
              {
                id: "inquiries",
                label: "문의 · 매입 관리",
                badge: metrics.totalInquiries,
                highlight: false,
              },
              {
                id: "products",
                label: "상품 등록 · 재고",
                badge: metrics.totalProducts,
                highlight: false,
              },
              {
                id: "delivery",
                label: "배송·설치 사례",
                badge: metrics.deliveryCount,
                highlight: false,
              },
              {
                id: "notifications",
                label: "알림 발송 상태 · 재시도",
                badge: null,
                highlight: false,
              },
            ] as const
          ).map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 sm:px-4 py-2.5 text-[12.5px] sm:text-[13px] font-bold whitespace-nowrap rounded-t transition-colors flex items-center gap-1.5 ${
                  active
                    ? "bg-[#FAF9F7] text-[#0E1A2B]"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>{t.label}</span>
                {t.badge !== null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[11px] font-extrabold tabular-nums ${
                      t.highlight
                        ? "bg-[#D9531E] text-white"
                        : active
                        ? "bg-[#0E1A2B]/10 text-[#0E1A2B]"
                        : "bg-white/15 text-white/85"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="hb-container py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* 1. 기본 운영 지표 카드 (클릭 시 해당 필터/탭으로 즉시 전환) */}
        <section
          aria-label="운영 지표 요약"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          <button
            type="button"
            onClick={() => {
              setActiveTab("inquiries");
              setInqStatusFilter("priority");
            }}
            className="text-left rounded-xl border border-[#FADCD0] bg-[#FFF5F0] p-4 hover:border-[#D9531E] transition-colors shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] sm:text-[12px] font-bold text-[#B5431A]">
                우선 확인 필요 (접수·검토중)
              </span>
              <span className="h-2 w-2 rounded-full bg-[#D9531E]" />
            </div>
            <p className="mt-1.5 text-[24px] sm:text-[28px] font-extrabold text-[#D9531E] tabular-nums">
              {metrics.priorityCount}건
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("inquiries");
              setInqStatusFilter("전체");
            }}
            className="text-left rounded-xl border border-[#E5E2DC] bg-white p-4 hover:border-[#0E1A2B]/40 transition-colors shadow-2xs"
          >
            <span className="text-[11.5px] sm:text-[12px] font-bold text-[#6B7280] block">
              전체 문의 · 매입 신청
            </span>
            <p className="mt-1.5 text-[24px] sm:text-[28px] font-extrabold text-[#0E1A2B] tabular-nums">
              {metrics.totalInquiries}건{" "}
              <span className="text-[12px] sm:text-[13px] font-semibold text-[#6B7280]">
                (매입 {metrics.buybackCount})
              </span>
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className="text-left rounded-xl border border-[#E5E2DC] bg-white p-4 hover:border-[#0E1A2B]/40 transition-colors shadow-2xs"
          >
            <span className="text-[11.5px] sm:text-[12px] font-bold text-[#6B7280] block">
              현재 판매중 / 예약중 재고
            </span>
            <p className="mt-1.5 text-[24px] sm:text-[28px] font-extrabold text-[#0E1A2B] tabular-nums">
              {metrics.sellingProducts}건{" "}
              <span className="text-[12px] sm:text-[13px] font-semibold text-amber-700">
                (예약 {metrics.reservedProducts})
              </span>
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("delivery")}
            className="text-left rounded-xl border border-[#E5E2DC] bg-white p-4 hover:border-[#0E1A2B]/40 transition-colors shadow-2xs"
          >
            <span className="text-[11.5px] sm:text-[12px] font-bold text-[#6B7280] block">
              판매완료 / 배송사례
            </span>
            <p className="mt-1.5 text-[24px] sm:text-[28px] font-extrabold text-[#4B5260] tabular-nums">
              {metrics.soldProducts}건{" "}
              <span className="text-[12px] sm:text-[13px] font-semibold text-[#6B7280]">
                (사례 {metrics.deliveryCount})
              </span>
            </p>
          </button>
        </section>

        {/* 2. 탭별 본문: OVERVIEW 또는 INQUIRIES */}
        {(activeTab === "overview" || activeTab === "inquiries") && (
          <section className="rounded-xl border border-[#E5E2DC] bg-white p-4 sm:p-6 shadow-2xs space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 border-b border-[#E5E2DC] pb-4">
              <div>
                <h2 className="text-[17px] sm:text-[18px] font-extrabold text-[#0E1A2B]">
                  고객 문의 및 매입 신청 통합 관리
                </h2>
                <p className="mt-0.5 text-[12.5px] sm:text-[13px] text-[#6B7280]">
                  신규 접수 건을 우선 확인하고, 진행 상태를 명시적으로 선택하여 변경하거나 답변을 등록하세요.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={inqStatusFilter}
                  onChange={(e) => setInqStatusFilter(e.target.value)}
                  className="h-9 rounded border border-[#DDD9D1] bg-white px-2.5 text-[12.5px] sm:text-[13px] font-bold text-[#0E1A2B]"
                >
                  <option value="priority">⚡ 미처리 신규(접수·검토중)만</option>
                  <option value="전체">전체 상태 보기</option>
                  <option value="notice">📢 등록된 공지사항만 보기</option>
                  {INQUIRY_ADMIN_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label} 상태만
                    </option>
                  ))}
                </select>

                <select
                  value={inqTypeFilter}
                  onChange={(e) => setInqTypeFilter(e.target.value)}
                  className="h-9 rounded border border-[#DDD9D1] bg-white px-2.5 text-[12.5px] sm:text-[13px] font-semibold text-[#4B5260]"
                >
                  <option value="전체">모든 문의 유형</option>
                  <option value="내 물건 팔기">내 물건 팔기 (매입)</option>
                  <option value="구매 문의">구매 문의</option>
                  <option value="대량·업소용 상담">대량·업소용 상담</option>
                  <option value="기타 문의">기타 문의</option>
                </select>

                <input
                  type="search"
                  value={inqKeyword}
                  onChange={(e) => setInqKeyword(e.target.value)}
                  placeholder="고객명·연락처·제목 검색"
                  className="h-9 flex-1 sm:flex-none rounded border border-[#DDD9D1] px-3 text-[12.5px] sm:text-[13px]"
                />
              </div>
            </div>

            {filteredInquiries.length === 0 ? (
              <div className="py-12 text-center text-[14px] text-[#8A8478]">
                해당 조건에 맞는 문의/매입 신청 내역이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInquiries.map((req) => {
                  const imgs = extractInquiryImages(req);
                  const isPriority = isPriorityInquiryStatus(req.status);
                  const tgLog = notificationLogs[`telegram:${req.id}`];

                  return (
                    <div
                      key={req.id}
                      className={`rounded-xl border p-4 sm:p-5 transition-colors ${
                        isPriority
                          ? "border-[#D9531E]/50 bg-[#FFFDFB] shadow-2xs"
                          : "border-[#E5E2DC] bg-white"
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            {isPriority && !req.is_notice && (
                              <span className="rounded-sm bg-[#D9531E] px-2 py-0.5 text-[11px] font-bold text-white">
                                우선 확인
                              </span>
                            )}
                            <span className="rounded-sm bg-[#0E1A2B] px-2.5 py-0.5 text-[11px] font-bold text-white">
                              {req.is_notice ? "공지" : req.status || "접수"}
                            </span>
                            <span className="rounded-sm bg-[#F2F0EC] px-2 py-0.5 text-[11.5px] font-bold text-[#4B5260]">
                              {req.is_notice ? "공지사항" : req.inquiry_type || "문의"}
                            </span>
                            <span className="text-[11.5px] sm:text-[12px] text-[#8A8478] tabular-nums">
                              {new Date(req.created_at).toLocaleString("ko-KR")}
                            </span>
                          </div>

                          <h3 className="text-[15.5px] sm:text-[16px] font-bold text-[#0E1A2B] pt-1">
                            {req.category}
                          </h3>

                          <p className="text-[13px] sm:text-[13.5px] text-[#4B5260] flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span>
                              접수자: <strong className="text-[#0E1A2B]">{req.name}</strong>
                            </span>
                            {req.phone && (
                              <a
                                href={telHref(req.phone)}
                                className="font-bold text-[#D9531E] underline tabular-nums"
                              >
                                📞 {req.phone}
                              </a>
                            )}
                            {req.region && (
                              <span className="text-[#6B7280]">
                                📍 지역: {req.region}
                              </span>
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F2EFE9]">
                          {!req.is_notice && (
                            <>
                              <label className="text-[12px] font-bold text-[#6B7280]">
                                상태:
                              </label>
                              <select
                                aria-label={`${req.category} 진행 상태 선택`}
                                value={req.status || "접수"}
                                disabled={busyActionId === `inq-status-${req.id}`}
                                onChange={(e) =>
                                  handleExplicitInquiryStatusChange(
                                    req.id,
                                    e.target.value
                                  )
                                }
                                className="h-9 rounded border border-[#0E1A2B] bg-white px-2.5 text-[12.5px] font-bold text-[#0E1A2B]"
                              >
                                {INQUIRY_ADMIN_STATUS_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveReplyId(
                                    activeReplyId === req.id ? null : req.id
                                  );
                                  setReplyDraft(req.admin_reply || "");
                                }}
                                className="h-9 rounded bg-[#0E1A2B] px-3 text-[12px] font-bold text-white hover:bg-[#1C2D47]"
                              >
                                {req.admin_reply ? "답변 수정" : "답변 작성"}
                              </button>

                              <button
                                type="button"
                                disabled={busyActionId === `notify-telegram-${req.id}`}
                                onClick={() => handleManualNotificationDispatch("telegram", req)}
                                className="h-9 rounded border border-[#0E1A2B]/30 bg-white px-2.5 text-[12px] font-bold text-[#0E1A2B] hover:bg-[#FAF9F7]"
                                title="텔레그램 알림 수동 재전송"
                              >
                                ✈️ 텔레그램
                              </button>
                              <button
                                type="button"
                                disabled
                                className="h-9 rounded border border-gray-200 bg-gray-100 px-2.5 text-[12px] font-semibold text-gray-400 cursor-not-allowed opacity-75"
                                title="알림톡은 대행사 API 연동 준비 중입니다 (텔레그램 알림 활성)"
                              >
                                💬 알림톡 연동 준비중
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            disabled={busyActionId === `inq-del-${req.id}`}
                            onClick={() =>
                              handleDeleteInquiry(req.id, req.category)
                            }
                            className="h-9 rounded border border-red-200 bg-red-50 px-2.5 text-[12px] font-bold text-red-600 hover:bg-red-100 ml-auto md:ml-1"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      {req.description &&
                        (() => {
                          const parsed = parseStructuredInquiryDescription(
                            req.description
                          );
                          if (!parsed.isStructured) {
                            return (
                              <div className="mt-3 rounded bg-[#FAF9F7] p-3.5 text-[13.5px] text-[#1F2530] whitespace-pre-wrap leading-relaxed border border-[#EEEBE5]">
                                {req.description}
                              </div>
                            );
                          }
                          return (
                            <div className="mt-3 space-y-2.5">
                              {(parsed.structuredLines.length > 0 ||
                                parsed.bulkItems.length > 0) && (
                                <div className="rounded-md border border-[#0E1A2B]/20 bg-[#F8FAFC] p-3.5 text-[13px] space-y-2">
                                  <strong className="text-[12px] font-extrabold text-[#0E1A2B] block">
                                    📋 고객 확인 상담 조건 ({req.inquiry_type})
                                  </strong>
                                  {parsed.structuredLines.length > 0 && (
                                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                      {parsed.structuredLines.map(
                                        (row, idx) => (
                                          <div
                                            key={row.label + idx}
                                            className="flex gap-2"
                                          >
                                            <dt className="font-bold text-[#4B5260] shrink-0">
                                              {row.label}:
                                            </dt>
                                            <dd className="font-semibold text-[#0E1A2B]">
                                              {row.value}
                                            </dd>
                                          </div>
                                        )
                                      )}
                                    </dl>
                                  )}
                                  {parsed.bulkItems.length > 0 && (
                                    <div className="pt-1.5 border-t border-[#E4E0D8]">
                                      <span className="text-[11.5px] font-bold text-[#D9531E] block mb-1">
                                        📦 요청 장비 및 희망 수량 목록
                                      </span>
                                      <ul className="space-y-1 text-[12.5px] font-medium text-[#0E1A2B]">
                                        {parsed.bulkItems.map((it, idx) => (
                                          <li
                                            key={idx}
                                            className="bg-white px-2.5 py-1 rounded border border-[#E4E0D8]"
                                          >
                                            • {it}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {parsed.customerContent && (
                                <div className="rounded bg-[#FAF9F7] p-3.5 text-[13.5px] text-[#1F2530] whitespace-pre-wrap leading-relaxed border border-[#EEEBE5]">
                                  <span className="block text-[11px] font-bold text-[#6B7280] mb-1">
                                    ✍️ 고객 작성 본문
                                  </span>
                                  {parsed.customerContent}
                                </div>
                              )}

                              {(parsed.aiSummaryLines.length > 0 ||
                                parsed.missingAndQuestions.length > 0) && (
                                <div className="rounded border border-amber-200 bg-amber-50/70 p-3 text-[12px] text-amber-950 space-y-1">
                                  <strong className="block text-amber-900">
                                    🤖 AI 사진 판독 참고 요약 (고객 확정 사실과 구분하여 확인하세요)
                                  </strong>
                                  {parsed.aiSummaryLines.map((line, idx) => (
                                    <p key={idx}>• {line}</p>
                                  ))}
                                  {parsed.missingAndQuestions.map((q, idx) => (
                                    <p
                                      key={idx}
                                      className="font-semibold text-[#B5431A]"
                                    >
                                      ⚠️ {q}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })()}

                      {imgs.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {imgs.map((url, idx) => (
                            <a
                              key={url + idx}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-16 w-16 overflow-hidden rounded border border-[#DDD9D1] bg-[#EFECE6]"
                              title="클릭하여 원본 사진 보기"
                            >
                              <SafeImg
                                src={url}
                                alt="첨부 이미지"
                                className="h-full w-full object-cover"
                              />
                            </a>
                          ))}
                        </div>
                      )}

                      {req.admin_reply && activeReplyId !== req.id && (
                        <div className="mt-3 rounded border border-[#FADCD0] bg-[#FFF5F0] p-3 text-[13px] text-[#4B5260]">
                          <strong className="text-[#B5431A] block mb-1">
                            등록된 관리자 답변:
                          </strong>
                          <p className="whitespace-pre-wrap">{req.admin_reply}</p>
                        </div>
                      )}

                      {activeReplyId === req.id && (
                        <div className="mt-3 space-y-2 border-t border-[#EEEBE5] pt-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11.5px] font-bold text-[#6B7280] mr-1">
                              빠른 답변 템플릿:
                            </span>
                            {ADMIN_REPLY_TEMPLATES.map((tpl) => (
                              <button
                                key={tpl.label}
                                type="button"
                                onClick={() => setReplyDraft(tpl.text)}
                                className="rounded border border-[#DDD9D1] bg-[#FAF9F7] px-2.5 py-1 text-[11.5px] font-semibold text-[#0E1A2B] hover:border-[#0E1A2B]"
                              >
                                + {tpl.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows={3}
                            value={replyDraft}
                            onChange={(e) => setReplyDraft(e.target.value)}
                            placeholder="고객에게 안내할 답변 내용을 입력하세요."
                            className="hb-input text-[13.5px]"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setActiveReplyId(null)}
                              className="hb-btn-outline h-9 px-4 text-[12.5px]"
                            >
                              취소
                            </button>
                            <button
                              type="button"
                              disabled={busyActionId === `inq-reply-${req.id}`}
                              onClick={() => handleSaveInquiryReply(req.id)}
                              className="hb-btn-primary h-9 px-5 text-[12.5px]"
                            >
                              답변 저장 및 답변완료 처리
                            </button>
                          </div>
                        </div>
                      )}

                      {tgLog && (
                        <div className="mt-2 text-[12px] text-[#6B7280]">
                          최근 텔레그램 발송 상태:{" "}
                          <strong>{tgLog.statusLabel}</strong> — {tgLog.message}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* 3. 탭별 본문: PRODUCTS (AI 상품 등록·수정 및 재고 상태 관리) */}
        {activeTab === "products" && (
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            <section className="rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-6 lg:col-span-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <h2 className="text-[17px] font-bold text-[#0E1A2B]">
                  {editingProductId ? "상품 정보 수정" : "신규 상품 등록 (AI 보조)"}
                </h2>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="text-[12px] font-bold text-[#D9531E] underline"
                  >
                    신규 등록으로 전환
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-[13.5px]">
                {/* 수정 모드 시 기존 사진 관리 UI */}
                {editingProductId && editingExistingImages.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="hb-label">
                        기존 등록 사진 ({editingExistingImages.length}장)
                      </span>
                      <span className="text-[11px] font-semibold text-[#D9531E]">
                        1번 사진이 대표 이미지입니다
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {editingExistingImages.map((imgUrl, idx) => (
                        <div
                          key={imgUrl + idx}
                          className="relative aspect-square rounded border border-[#DDD9D1] overflow-hidden bg-[#EFECE6]"
                        >
                          <SafeImg
                            src={imgUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          {idx === 0 ? (
                            <span className="absolute left-1 top-1 rounded-sm bg-[#D9531E] px-1.5 py-0.5 text-[10px] font-bold text-white">
                              대표
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setEditingExistingImages((prev) => {
                                  const next = [...prev];
                                  const [picked] = next.splice(idx, 1);
                                  return [picked, ...next];
                                })
                              }
                              className="absolute left-1 top-1 rounded-sm bg-[#0E1A2B]/85 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-[#D9531E]"
                            >
                              대표 지정
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setEditingExistingImages((prev) =>
                                prev.filter((_, i) => i !== idx)
                              )
                            }
                            aria-label="기존 사진 제거"
                            className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600"
                          >
                            <Icon d={ICON.close} className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="hb-label">
                    {editingProductId ? "추가할 상품 사진" : "상품 사진 (최대 3장)"}
                  </label>
                  <div className="mt-1 mb-2 flex items-center justify-between rounded border border-[#E4E0D8] bg-[#FAF9F7] p-2.5 text-[12px]">
                    <label className="flex items-center gap-2 font-semibold text-[#0E1A2B] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useSearchSpecs}
                        onChange={(e) => setUseSearchSpecs(e.target.checked)}
                        className="h-4 w-4 accent-[#0E1A2B]"
                      />
                      <span>모델명 인터넷 검색 사양 참조</span>
                    </label>
                    {prodFiles.length > 0 && (
                      <button
                        type="button"
                        disabled={analyzingProduct}
                        onClick={() => runGeminiProductAnalysis(prodFiles)}
                        className="font-bold text-[#D9531E] underline"
                      >
                        AI 재분석
                      </button>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={analyzingProduct}
                    onChange={handleProductFileChange}
                    className="w-full text-[12px]"
                  />
                  <p className="mt-1 text-[11px] font-semibold text-[#646E7E]">
                    업로드 즉시 쇼룸 스튜디오 톤업(밝기 +20%·대비 +9%)이 자동 적용됩니다.
                    더 밝게 하고 싶은 사진은 썸네일의 스파클 버튼을 눌러 한 단계 더 올릴 수 있습니다.
                  </p>

                  {analyzingProduct && (
                    <p className="mt-2 rounded bg-[#FFF5F0] p-2.5 text-[12px] font-bold text-[#D9531E] animate-pulse">
                      AI가 사진 판독 및 사양 초안을 작성 중입니다...
                    </p>
                  )}

                  {prodPreviews.length > 0 && (
                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                      {prodPreviews.map((src, index) => (
                        <div
                          key={src}
                          className="flex flex-col overflow-hidden rounded border border-[#DDD9D1] bg-[#FAF9F7]"
                        >
                          <div className="relative aspect-square bg-[#EFECE6]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={`신규 사진 ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                            {editingExistingImages.length === 0 &&
                            index === 0 ? (
                              <span className="absolute top-1 left-1 rounded-sm bg-[#D9531E] px-1.5 py-0.5 text-[10px] font-bold text-white">
                                대표
                              </span>
                            ) : (
                              editingExistingImages.length === 0 && (
                                <button
                                  type="button"
                                  onClick={() => makePrimaryProdFile(index)}
                                  className="absolute top-1 left-1 rounded-sm bg-[#0E1A2B]/85 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-[#D9531E]"
                                >
                                  대표 지정
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              onClick={() => removeProdFile(index)}
                              aria-label="사진 삭제"
                              className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white hover:bg-red-600"
                            >
                              <Icon d={ICON.close} className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                enhanceProdFile(index, PRODUCT_IMAGE_TONE_EXTRA)
                              }
                              title="한 단계 더 밝게 (밝기 +12%, 대비 +4%)"
                              aria-label="한 단계 더 밝게 보정"
                              className="absolute bottom-1 right-8 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white hover:bg-[#D9531E] transition-colors"
                            >
                              <Icon d={ICON.sparkles} className="w-3.5 h-3.5 text-[#FF8A50]" />
                            </button>
                            <button
                              type="button"
                              onClick={() => rotateProdFile(index, 90)}
                              title="시계방향 90도 회전"
                              aria-label="시계방향 90도 회전"
                              className="absolute bottom-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-black/75 text-white hover:bg-[#D9531E]"
                            >
                              <Icon d={ICON.rotate} className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 divide-x divide-[#E4E0D8] border-t border-[#E4E0D8] bg-white text-[10.5px] font-bold text-[#4B5260]">
                            <button
                              type="button"
                              disabled={index === 0}
                              onClick={() => moveProdFile(index, index - 1)}
                              className="py-1 hover:bg-[#F6F5F2] disabled:opacity-30"
                            >
                              ← 앞
                            </button>
                            <button
                              type="button"
                              disabled={index === prodPreviews.length - 1}
                              onClick={() => moveProdFile(index, index + 1)}
                              className="py-1 hover:bg-[#F6F5F2] disabled:opacity-30"
                            >
                              뒤 →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI 3계층 판독 결과 리포트 */}
                {(aiPhotoObserved.length > 0 ||
                  aiSearchSpecs.length > 0 ||
                  aiWarnings.length > 0) && (
                  <div className="rounded border border-[#E4E0D8] bg-[#FAF9F7] p-3 text-[12px] space-y-2">
                    {aiPhotoObserved.length > 0 && (
                      <div>
                        <strong className="text-[#0E1A2B]">
                          1) 이미지 직접 판독 정보:
                        </strong>
                        <ul className="list-disc pl-4 text-[#4B5260]">
                          {aiPhotoObserved.map((x, i) => (
                            <li key={i}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiSearchSpecs.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between">
                          <strong className="text-[#0E1A2B]">
                            2) 검색으로 확인한 참고 제원:
                          </strong>
                          <button
                            type="button"
                            onClick={appendSearchSpecsToAdminDesc}
                            className="text-[11px] font-bold text-[#D9531E] underline"
                          >
                            + 설명란에 반영
                          </button>
                        </div>
                        <ul className="list-disc pl-4 text-[#4B5260]">
                          {aiSearchSpecs.map((x, i) => (
                            <li key={i}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiSourceNote && (
                      <p className="text-[#B5431A] font-semibold">
                        ℹ️ {aiSourceNote}
                      </p>
                    )}
                    {aiWarnings.length > 0 && (
                      <div className="rounded bg-amber-50 border border-amber-200 p-2 text-amber-900">
                        <strong>⚠️ 담당자 확인 필요 항목:</strong>
                        <ul className="list-disc pl-4">
                          {aiWarnings.map((w, i) => (
                            <li key={i}>{w}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {aiSources.length > 0 && (
                      <div className="text-[11px]">
                        근거 출처:{" "}
                        {aiSources.map((u, i) => (
                          <a
                            key={i}
                            href={u}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mr-2 text-blue-700 underline"
                          >
                            [출처 {i + 1}]
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="hb-label">표준 카테고리</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="hb-input mt-1 py-2 text-[13px] font-semibold"
                    >
                      {PRODUCT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="hb-label">판매 상태</label>
                    <select
                      value={prodStatus}
                      onChange={(e) => setProdStatus(e.target.value)}
                      className="hb-input mt-1 py-2 text-[13px] font-semibold"
                    >
                      {PRODUCT_STATUS_LIST.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="hb-label">상품명 *</label>
                  <input
                    type="text"
                    required
                    value={prodTitle}
                    onChange={(e) => setProdTitle(e.target.value)}
                    className="hb-input mt-1 py-2.5"
                    placeholder="예: 캐리어 벽걸이 냉난방기 9평형"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="hb-label">모델명 (확인 시)</label>
                    <input
                      type="text"
                      value={prodModel}
                      onChange={(e) => setProdModel(e.target.value)}
                      className="hb-input mt-1 py-2 font-mono text-[13px]"
                    />
                  </div>
                  <div>
                    <label className="hb-label">가격 (원, 비우면 상담)</label>
                    <input
                      type="number"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="hb-input mt-1 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="hb-label">상태 등급</label>
                  <select
                    value={prodGrade}
                    onChange={(e) => setProdGrade(e.target.value)}
                    className="hb-input mt-1 py-2 text-[13px] font-semibold"
                  >
                    {PRODUCT_CONDITION_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="hb-label">
                    AI 작성 설명 초안 (검토 및 편집 후 저장)
                  </label>
                  <textarea
                    rows={6}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="hb-input mt-1 font-mono text-[12.5px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingProduct || analyzingProduct}
                  className="hb-btn-primary h-11 w-full text-[14px]"
                >
                  {savingProduct
                    ? "저장 처리 중..."
                    : editingProductId
                    ? "상품 수정내용 승인 및 저장"
                    : "검토 완료 후 상품 등록하기"}
                </button>
              </form>
            </section>

            {/* 우측: 등록된 상품 목록 및 명시적 상태 변경 */}
            <section className="rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-6 lg:col-span-7 space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E2DC] pb-3">
                <h2 className="text-[17px] font-bold text-[#0E1A2B]">
                  재고 목록 ({filteredProducts.length}건)
                </h2>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={prodCategoryFilter}
                    onChange={(e) => setProdCategoryFilter(e.target.value)}
                    className="h-9 rounded border border-[#DDD9D1] px-2 text-[12.5px]"
                  >
                    <option value="전체">전체 카테고리</option>
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={prodStatusFilter}
                    onChange={(e) => setProdStatusFilter(e.target.value)}
                    className="h-9 rounded border border-[#DDD9D1] px-2 text-[12.5px]"
                  >
                    <option value="전체">전체 상태</option>
                    {PRODUCT_STATUS_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    <option value="stale30">
                      ⚡ 30일+ 장기 판매중 점검 ({metrics.staleSellingProducts}건)
                    </option>
                  </select>
                  <input
                    type="search"
                    value={prodKeyword}
                    onChange={(e) => setProdKeyword(e.target.value)}
                    placeholder="상품명·사양 검색"
                    className="h-9 rounded border border-[#DDD9D1] px-2.5 text-[12.5px]"
                  />
                </div>
              </div>

              {metrics.staleSellingProducts > 0 && prodStatusFilter !== "stale30" && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-[12.5px] text-amber-900">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-800">
                      ⚡ 30일 이상 등록된 장기 판매 중 매물이 {metrics.staleSellingProducts}건 있습니다.
                    </span>
                    <span className="text-amber-700 hidden sm:inline">
                      가격 인하 또는 당근마켓/블로그 홍보를 권장합니다.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProdStatusFilter("stale30")}
                    className="rounded bg-amber-700 px-2.5 py-1 text-[11.5px] font-bold text-white hover:bg-amber-800 transition-colors shrink-0"
                  >
                    장기 재고 모아보기
                  </button>
                </div>
              )}

              {prodStatusFilter === "stale30" && (
                <div className="flex items-center justify-between rounded-lg border border-amber-400 bg-amber-100 px-3.5 py-2 text-[12.5px] text-amber-900">
                  <span className="font-bold">
                    ⚡ 30일+ 장기 판매 중 점검 모드 ({filteredProducts.length}건 표시 중)
                  </span>
                  <button
                    type="button"
                    onClick={() => setProdStatusFilter("전체")}
                    className="text-[12px] font-bold text-amber-900 underline hover:text-black"
                  >
                    전체 상태 보기
                  </button>
                </div>
              )}

              <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
                {filteredProducts.map((product) => {
                  const imgs = splitImages(product.image_url);
                  const catLabel = normalizeProductCategory(product.category);
                  const statValue = normalizeProductStatus(product.status);

                  return (
                    <div
                      key={product.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#E5E2DC] p-3 hover:border-[#0E1A2B]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[#FAF9F7] border border-[#E5E2DC]">
                          <SafeImg
                            src={imgs[0]}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-bold text-[#6B7280]">
                              {catLabel} · 조회 {product.views || 0}
                            </span>
                            {statValue === "판매중" &&
                              getDaysSinceCreated(product.created_at) >= 30 && (
                                <span className="rounded bg-amber-50 border border-amber-300 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-800">
                                  등록 +{getDaysSinceCreated(product.created_at)}일 · 재고점검 권장
                                </span>
                              )}
                          </div>
                          <h3 className="truncate text-[14px] font-bold text-[#0E1A2B]">
                            {product.title}
                          </h3>
                          <p className="text-[13px] font-bold text-[#D9531E]">
                            {formatProductPrice(product.price, catLabel)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                generatePromoPostText(product)
                              );
                              toast.success(
                                "당근마켓·네이버카페·블로그 홍보글이 복사되었습니다!"
                              );
                            } catch {
                              toast.error("복사에 실패했습니다.");
                            }
                          }}
                          className="h-9 rounded border border-[#FADCD0] bg-[#FFF5F0] px-2.5 text-[12px] font-bold text-[#D9531E] hover:bg-[#D9531E] hover:text-white transition-colors"
                          title="당근마켓·네이버카페·블로그 업로드용 홍보 원고 복사"
                        >
                          📋 홍보글 복사
                        </button>
                        <select
                          aria-label={`${product.title} 판매 상태 선택`}
                          value={statValue}
                          disabled={busyActionId === `prod-status-${product.id}`}
                          onChange={(e) =>
                            handleExplicitProductStatusChange(
                              product.id,
                              e.target.value
                            )
                          }
                          className="h-9 rounded border border-[#DDD9D1] bg-white px-2 text-[12px] font-bold text-[#0E1A2B]"
                        >
                          {PRODUCT_STATUS_LIST.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => startEditProduct(product)}
                          className="h-9 rounded border border-[#DDD9D1] bg-[#FAF9F7] px-3 text-[12px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B]"
                        >
                          편집
                        </button>
                        <button
                          type="button"
                          disabled={busyActionId === `prod-del-${product.id}`}
                          onClick={() => handleDeleteProduct(product)}
                          className="h-9 rounded border border-red-200 bg-red-50 px-3 text-[12px] font-bold text-red-600 hover:bg-red-100"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 4. 탭별 본문: DELIVERY */}
        {activeTab === "delivery" && (
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            <section className="rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-6 lg:col-span-5 space-y-4 shadow-2xs">
              <h2 className="text-[17px] font-bold text-[#0E1A2B]">
                배송·설치 현장 사례 등록 (AI 제목 보조)
              </h2>
              <p className="text-[12.5px] text-[#6B7280]">
                사진에서 확인되는 제품 유형과 설치 상황에 근거해 제목 초안을 생성합니다. 확인 후 수정하여 게시하세요.
              </p>

              <form onSubmit={handleSaveDeliveryCase} className="space-y-4">
                <div>
                  <label className="hb-label">현장 사진 선택 (최대 5장)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={analyzingDelivery}
                    onChange={handleDeliveryFilesChange}
                    className="mt-1 w-full text-[12px]"
                  />
                </div>

                {(delivObserved.length > 0 || delivReviewNotes.length > 0) && (
                  <div className="rounded-lg border border-[#E5E2DC] bg-[#FAF9F7] p-3 text-[12px] space-y-1.5">
                    {delivObserved.length > 0 && (
                      <p>
                        <strong>📷 판독된 요소:</strong>{" "}
                        {delivObserved.join(", ")}
                      </p>
                    )}
                    {delivReviewNotes.map((n, i) => (
                      <p key={i} className="text-amber-800 font-semibold">
                        ⚠️ {n}
                      </p>
                    ))}
                  </div>
                )}

                <div>
                  <label className="hb-label">
                    배송·설치 사례 제목 (수정 가능) *
                  </label>
                  <input
                    type="text"
                    required
                    value={delivTitle}
                    onChange={(e) => setDelivTitle(e.target.value)}
                    placeholder="사진 첨부 시 AI가 초안을 작성합니다"
                    className="hb-input mt-1"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingDelivery || analyzingDelivery}
                  className="hb-btn-primary h-11 w-full text-[14px]"
                >
                  {savingDelivery ? "등록 중..." : "제목 확인 완료 및 게시하기"}
                </button>
              </form>
            </section>

            <section className="rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-6 lg:col-span-7 space-y-4 shadow-2xs">
              <h2 className="text-[17px] font-bold text-[#0E1A2B]">
                등록된 배송·설치 사례 ({deliveryCases.length}건)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {deliveryCases.map((item) => {
                  const imgs = splitImages(item.image_url);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg border border-[#E5E2DC] p-3"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[#EFECE6]">
                        <SafeImg
                          src={imgs[0]}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-bold text-[#0E1A2B]">
                          {item.title}
                        </p>
                        <p className="text-[11.5px] text-[#8A8478]">
                          {new Date(item.created_at).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteDeliveryCase(item.id, item.title)
                        }
                        className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-[11.5px] font-bold text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* 5. 탭별 본문: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <section className="rounded-xl border border-[#E5E2DC] bg-white p-5 sm:p-6 space-y-5 shadow-2xs">
            <div>
              <h2 className="text-[18px] font-bold text-[#0E1A2B]">
                외부 알림(Telegram / 알림톡) 발송 상태 관리 및 재시도
              </h2>
              <p className="mt-1 text-[13px] text-[#6B7280]">
                환경변수 미설정이나 외부 서버 오류 시 거짓 성공으로 표시하지 않고,{" "}
                <strong>
                  [발송 대기 / 발송 성공 / 설정 미완료 / 외부 서비스 오류 / 재시도 필요]
                </strong>{" "}
                5가지 상태로 정확히 구분합니다.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px] border-t border-[#E5E2DC]">
                <thead className="bg-[#FAF9F7] text-[#6B7280] border-b border-[#E5E2DC]">
                  <tr>
                    <th className="py-3 px-4">접수일시 / 고객명</th>
                    <th className="py-3 px-4">구분 / 제목</th>
                    <th className="py-3 px-4">Telegram 알림 상태</th>
                    <th className="py-3 px-4">알림톡 연동 상태</th>
                    <th className="py-3 px-4 text-right">수동 발송 / 재시도</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EEEBE5]">
                  {inquiries
                    .filter((i) => !i.is_notice)
                    .slice(0, 15)
                    .map((inq) => {
                      const tg = notificationLogs[`telegram:${inq.id}`];
                      const alim = notificationLogs[`alimtalk:${inq.id}`];
                      return (
                        <tr key={inq.id}>
                          <td className="py-3 px-4">
                            <strong className="text-[#0E1A2B]">{inq.name}</strong>
                            <span className="block text-[11.5px] text-[#8A8478]">
                              {new Date(inq.created_at).toLocaleDateString("ko-KR")}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11.5px] font-bold text-[#D9531E] block">
                              {inq.inquiry_type}
                            </span>
                            <span className="truncate block max-w-xs">
                              {inq.category}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {tg ? (
                              <div>
                                <span
                                  className={`inline-block rounded px-2 py-0.5 text-[11px] font-bold ${
                                    tg.sent
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-900"
                                  }`}
                                >
                                  {tg.statusLabel}
                                </span>
                                <p className="mt-1 text-[11.5px] text-[#6B7280]">
                                  {tg.message}
                                </p>
                              </div>
                            ) : (
                              <span className="text-[12px] text-[#8A8478]">
                                발송 대기 / 이력 미조회
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {alim ? (
                              <div>
                                <span className="inline-block rounded bg-neutral-200 px-2 py-0.5 text-[11px] font-bold text-neutral-700">
                                  {alim.statusLabel}
                                </span>
                                <p className="mt-1 text-[11.5px] text-[#6B7280]">
                                  {alim.message}
                                </p>
                              </div>
                            ) : (
                              <span className="inline-block rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                                연동 준비중 (Telegram 활성)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              disabled={busyActionId === `notify-telegram-${inq.id}`}
                              onClick={() =>
                                handleManualNotificationDispatch("telegram", inq)
                              }
                              className="rounded bg-[#0E1A2B] px-3 py-1.5 text-[12px] font-bold text-white hover:bg-[#1C2D47] disabled:opacity-50"
                            >
                              Telegram 재발송
                            </button>
                            <button
                              type="button"
                              disabled={busyActionId === `notify-alimtalk-${inq.id}`}
                              onClick={() =>
                                handleManualNotificationDispatch("alimtalk", inq)
                              }
                              className="rounded border border-[#DDD9D1] bg-white px-3 py-1.5 text-[12px] font-bold text-[#4B5260] hover:bg-[#FAF9F7] disabled:opacity-50"
                            >
                              알림톡 상태 점검
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}