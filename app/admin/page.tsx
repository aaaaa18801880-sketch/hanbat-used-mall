// 파일 경로: app/admin/page.tsx
"use client";

/**
 * 한밭중고전자 통합 운영 대시보드 오케스트레이터.
 * - CRUD 변이 및 스토리지 관리: lib/product-ops.ts (내부적으로 compressAndUploadProductImages · removeStorageImagesSafe 사용)
 * - 문의 관리 탭(AdminInquiriesTab): 텔레그램 재발송 활성 및 미연동 '알림톡 연동 준비중'(cursor-not-allowed) 비활성화 정책 위임
 * - 상품 목록 탭(AdminProductList): staleSellingProducts 지표 기반 'stale30'(value="stale30") 30일+ 장기 재고 점검 및 카테고리 오분류 일괄 보정 위임
 */

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
  normalizeProductStatus,
  normalizeProductCategory,
  splitImages,
  compressImage,
  enhanceImageFile,
  PRODUCT_IMAGE_TONE_PRESET,
  sanitizeOldManufactureYear,
  validateImageFiles,
  MAX_PHOTOS,
  extractModelName,
  type NotificationDispatchResult,
  revokeObjectUrls,
} from "../../lib/site";
import {
  createProductRecord,
  updateProductRecord,
  updateProductStatus,
  bulkUpdateProductCategories,
  deleteProductRecord,
  createDeliveryCaseRecord,
  deleteDeliveryCaseRecord,
} from "../../lib/product-ops";
import {
  auditProductCategories,
  type ProductCategoryMismatch,
} from "../../lib/product-category-audit";
import {
  applySmartCropToImageFile,
  formatSmartCropToastSummary,
  parseAnalyzedImageCrops,
  type PhotoCropState,
} from "../../lib/image-smart-crop";
import {
  computeAdminMetrics,
  filterAdminInquiries,
  filterAdminProducts,
} from "../../lib/admin-metrics";
import {
  type AdminTab,
  type AdminProductRow,
  type AdminDeliveryRow,
  type AdminInquiryRow,
} from "../../components/admin/admin-types";
import { AdminLoginCard } from "../../components/admin/admin-login-card";
import { AdminMetricsGrid } from "../../components/admin/admin-metrics-grid";
import { AdminInquiriesTab } from "../../components/admin/admin-inquiries-tab";
import { AdminProductForm } from "../../components/admin/admin-product-form";
import { AdminProductList } from "../../components/admin/admin-product-list";
import { AdminSmartCropModal } from "../../components/admin/admin-smart-crop-modal";
import { AdminDeliveryTab } from "../../components/admin/admin-delivery-tab";
import { AdminNotificationsTab } from "../../components/admin/admin-notifications-tab";

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
  const [smartCropProduct, setSmartCropProduct] =
    useState<AdminProductRow | null>(null);

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingExistingImages, setEditingExistingImages] = useState<string[]>([]);
  const [prodTitle, setProdTitle] = useState("");
  const [prodModel, setProdModel] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodCategory, setProdCategory] = useState<string>(PRODUCT_CATEGORIES[0]);
  const [prodGrade, setProdGrade] = useState<string>("");
  const [prodStatus, setProdStatus] = useState<string>(PRODUCT_STATUS.SELLING);
  const [prodDesc, setProdDesc] = useState("");
  const [prodFiles, setProdFiles] = useState<File[]>([]);
  const [prodPreviews, setProdPreviews] = useState<string[]>([]);
  const [prodCropStates, setProdCropStates] = useState<
    Array<PhotoCropState | null>
  >([]);
  const [savingProduct, setSavingProduct] = useState(false);

  /* Gemini AI 상품 분석 3계층 상태 */
  const [useSearchSpecs, setUseSearchSpecs] = useState(false);
  const [autoSmartCrop, setAutoSmartCrop] = useState(true);
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

  /* Blob 미리보기 Ref (동기 업데이트 + 언마운트 시점 일괄 해제) */
  const prodFilesRef = useRef<File[]>([]);
  const prodPreviewsRef = useRef<string[]>([]);
  const prodCropStatesRef = useRef<Array<PhotoCropState | null>>([]);
  const delivPreviewsRef = useRef<string[]>([]);

  const updateProdCropStates = useCallback(
    (
      updater:
        | Array<PhotoCropState | null>
        | ((prev: Array<PhotoCropState | null>) => Array<PhotoCropState | null>)
    ) => {
      const next =
        typeof updater === "function"
          ? updater(prodCropStatesRef.current)
          : updater;
      prodCropStatesRef.current = next;
      setProdCropStates(next);
    },
    []
  );

  const updateProdPreviews = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      const next =
        typeof updater === "function" ? updater(prodPreviewsRef.current) : updater;
      prodPreviewsRef.current = next;
      setProdPreviews(next);
    },
    []
  );

  const updateDelivPreviews = useCallback(
    (updater: string[] | ((prev: string[]) => string[])) => {
      const next =
        typeof updater === "function" ? updater(delivPreviewsRef.current) : updater;
      delivPreviewsRef.current = next;
      setDelivPreviews(next);
    },
    []
  );

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

  // 관리자 컴포넌트 실제 언마운트 시에만 메모리에 잔류하는 모든 Blob Object URL 일괄 해제
  useEffect(() => {
    return () => {
      revokeObjectUrls(prodPreviewsRef.current);
      revokeObjectUrls(delivPreviewsRef.current);
    };
  }, []);

  /* ───── 파생 지표 및 필터링 목록 ───── */
  const metrics = useMemo(
    () => computeAdminMetrics(inquiries, products, deliveryCases),
    [inquiries, products, deliveryCases]
  );

  const categoryMismatches = useMemo(
    () => auditProductCategories(products),
    [products]
  );

  const filteredInquiries = useMemo(
    () =>
      filterAdminInquiries(inquiries, {
        statusFilter: inqStatusFilter,
        typeFilter: inqTypeFilter,
        keyword: inqKeyword,
      }),
    [inquiries, inqTypeFilter, inqStatusFilter, inqKeyword]
  );

  const filteredProducts = useMemo(
    () =>
      filterAdminProducts(products, {
        categoryFilter: prodCategoryFilter,
        statusFilter: prodStatusFilter,
        keyword: prodKeyword,
      }),
    [products, prodCategoryFilter, prodStatusFilter, prodKeyword]
  );

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
    inq: {
      id: string;
      name: string;
      phone: string;
      inquiry_type: string;
      category: string;
    }
  ) => {
    const actionKey = `notify-${channel}-${inq.id}`;
    if (busyActionId) return;
    setBusyActionId(actionKey);

    try {
      const headers = await getAdminAuthHeaders();
      const endpoint =
        channel === "telegram" ? "/api/telegram" : "/api/alimtalk";
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
        toast.success(
          `[${channel.toUpperCase()}] ${json.statusLabel}: ${json.message}`
        );
      } else {
        toast.error(
          `[${channel.toUpperCase()}] ${json.statusLabel}: ${json.message}`
        );
      }
    } catch {
      toast.error("알림 요청 중 네트워크 오류가 발생했습니다.");
    } finally {
      setBusyActionId(null);
    }
  };

  /* ───── Gemini AI 상품 사진 분석 (3계층 분리 + 5년 경과 연식 블라인드 + 자동 회전) ───── */
  const adminUserRotatedRef = useRef<Set<number>>(new Set());

  const enhanceProdFile = async (
    index: number,
    options: {
      degrees?: number;
      brightness?: number;
      contrast?: number;
      saturate?: number;
    } = {},
    isAuto = false
  ) => {
    const targetFile = prodFilesRef.current[index];
    if (!targetFile) return;

    const isRotateAction = Boolean(options.degrees);
    try {
      const enhanced = await enhanceImageFile(targetFile, options);
      const nextFiles = [...prodFilesRef.current];
      if (index < nextFiles.length) {
        nextFiles[index] = enhanced;
        prodFilesRef.current = nextFiles;
        setProdFiles(nextFiles);
      }

      // 크롭 상태가 연결된 사진에 수동 회전·밝기 보정을 적용하면 원본/크롭본 모두 동기화
      const existingCrop = prodCropStatesRef.current[index];
      if (existingCrop) {
        const otherFile = existingCrop.active
          ? existingCrop.originalFile
          : existingCrop.croppedFile;
        let enhancedOther = otherFile;
        try {
          enhancedOther = await enhanceImageFile(otherFile, options);
        } catch {
          // keep fallback
        }
        updateProdCropStates((prev) => {
          const next = [...prev];
          if (index < next.length && next[index]) {
            next[index] = existingCrop.active
              ? { ...existingCrop, croppedFile: enhanced, originalFile: enhancedOther }
              : { ...existingCrop, originalFile: enhanced, croppedFile: enhancedOther };
          }
          return next;
        });
      }

      const prevUrl = prodPreviewsRef.current[index];
      if (prevUrl) revokeObjectUrls([prevUrl]);
      const nextPreviewUrl = URL.createObjectURL(enhanced);
      updateProdPreviews((prev) => {
        const next = [...prev];
        if (index < next.length) next[index] = nextPreviewUrl;
        return next;
      });

      if (!isAuto) {
        adminUserRotatedRef.current.add(index);
        toast.success(
          isRotateAction
            ? `${index + 1}번 사진이 90° 회전되었습니다.`
            : `${index + 1}번 사진을 한 단계 더 밝게 보정했습니다.`
        );
      }
    } catch {
      if (!isAuto) {
        toast.error(
          isRotateAction
            ? "사진 회전에 실패했습니다."
            : "사진 보정에 실패했습니다."
        );
      }
    }
  };

  const toggleProdFileCrop = (index: number) => {
    const cropState = prodCropStatesRef.current[index];
    if (!cropState) return;

    const nextActive = !cropState.active;
    const nextFile = nextActive ? cropState.croppedFile : cropState.originalFile;

    const nextFiles = [...prodFilesRef.current];
    if (index < nextFiles.length) {
      nextFiles[index] = nextFile;
      prodFilesRef.current = nextFiles;
      setProdFiles(nextFiles);
    }

    const prevUrl = prodPreviewsRef.current[index];
    if (prevUrl) revokeObjectUrls([prevUrl]);
    const nextPreviewUrl = URL.createObjectURL(nextFile);
    updateProdPreviews((prev) => {
      const next = [...prev];
      if (index < next.length) next[index] = nextPreviewUrl;
      return next;
    });

    updateProdCropStates((prev) => {
      const next = [...prev];
      if (index < next.length && next[index]) {
        next[index] = { ...cropState, active: nextActive };
      }
      return next;
    });

    toast.success(
      nextActive
        ? `${index + 1}번 사진에 AI 자동 크롭을 다시 적용했습니다.`
        : `${index + 1}번 사진을 크롭 전 원본으로 복구했습니다.`
    );
  };

  const removeProdFile = (index: number) => {
    const prevUrl = prodPreviewsRef.current[index];
    if (prevUrl) revokeObjectUrls([prevUrl]);
    const nextFiles = prodFilesRef.current.filter((_, i) => i !== index);
    prodFilesRef.current = nextFiles;
    setProdFiles(nextFiles);
    updateProdPreviews((prev) => prev.filter((_, i) => i !== index));
    updateProdCropStates((prev) => prev.filter((_, i) => i !== index));
  };

  const moveProdFile = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= prodFilesRef.current.length) return;
    const nextFiles = [...prodFilesRef.current];
    const [moved] = nextFiles.splice(fromIdx, 1);
    nextFiles.splice(toIdx, 0, moved);
    prodFilesRef.current = nextFiles;
    setProdFiles(nextFiles);
    updateProdPreviews((prev) => {
      const next = [...prev];
      const [movedUrl] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, movedUrl);
      return next;
    });
    updateProdCropStates((prev) => {
      const next = [...prev];
      const [movedCrop] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, movedCrop ?? null);
      return next;
    });
  };

  const makePrimaryProdFile = (targetIdx: number) => {
    if (targetIdx <= 0 || targetIdx >= prodFilesRef.current.length) return;
    const nextFiles = [...prodFilesRef.current];
    const [picked] = nextFiles.splice(targetIdx, 1);
    const reordered = [picked, ...nextFiles];
    prodFilesRef.current = reordered;
    setProdFiles(reordered);
    updateProdPreviews((prev) => {
      const next = [...prev];
      const [pickedUrl] = next.splice(targetIdx, 1);
      return [pickedUrl, ...next];
    });
    updateProdCropStates((prev) => {
      const next = [...prev];
      const [pickedCrop] = next.splice(targetIdx, 1);
      return [pickedCrop ?? null, ...next];
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

      const baseFilesForAnalysis = filesToAnalyze
        .slice(0, MAX_PHOTOS)
        .map((f, idx) => prodCropStatesRef.current[idx]?.originalFile ?? f);

      for (const f of baseFilesForAnalysis) {
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
      const rawText = await res.text();
      let data: Record<string, any> = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new Error(
          res.status === 504 || /error occurred|timeout/i.test(rawText)
            ? "서버 분석 시간이 초과되었습니다. '인터넷 검색 사양 참조' 체크를 끄고 다시 시도해 주세요."
            : "서버 응답을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
        );
      }
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

      const appliedRotationDegByIndex = new Map<number, number>();
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
            if (deg > 0 && deg < 360) {
              await enhanceProdFile(idx, { degrees: deg }, true);
              appliedRotationDegByIndex.set(idx, deg);
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

      if (autoSmartCrop && Array.isArray(data.imageCrops)) {
        const parsedCrops = parseAnalyzedImageCrops(data.imageCrops);
        const appliedRoles: Array<"product" | "nameplate"> = [];

        for (const crop of parsedCrops) {
          const idx = crop.index - 1;
          if (idx < 0 || idx >= prodFilesRef.current.length) continue;

          const baseFile =
            prodCropStatesRef.current[idx]?.originalFile ??
            prodFilesRef.current[idx];
          if (!baseFile) continue;

          try {
            const deg = appliedRotationDegByIndex.get(idx) ?? 0;
            const croppedResult = await applySmartCropToImageFile(
              baseFile,
              crop,
              deg
            );
            if (!croppedResult) continue;

            const nextFiles = [...prodFilesRef.current];
            nextFiles[idx] = croppedResult.file;
            prodFilesRef.current = nextFiles;
            setProdFiles(nextFiles);

            const prevUrl = prodPreviewsRef.current[idx];
            if (prevUrl) revokeObjectUrls([prevUrl]);
            const nextPreviewUrl = URL.createObjectURL(croppedResult.file);
            updateProdPreviews((prev) => {
              const next = [...prev];
              if (idx < next.length) next[idx] = nextPreviewUrl;
              return next;
            });

            updateProdCropStates((prev) => {
              const next = [...prev];
              while (next.length <= idx) next.push(null);
              next[idx] = {
                role: croppedResult.plan.role,
                active: true,
                croppedFile: croppedResult.file,
                originalFile: baseFile,
                paddedSquare: Boolean(croppedResult.plan.padBackground),
              };
              return next;
            });

            appliedRoles.push(croppedResult.plan.role);
          } catch {
            // 개별 사진 크롭 실패 시 원본 유지
          }
        }

        const cropSummary = formatSmartCropToastSummary(appliedRoles);
        if (cropSummary) {
          toast.success(cropSummary);
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
    const remaining =
      MAX_PHOTOS - (editingExistingImages.length + prodFilesRef.current.length);
    if (remaining <= 0) {
      toast.error(`상품 사진은 최대 ${MAX_PHOTOS}장까지 등록할 수 있습니다.`);
      return;
    }
    const { ok, error } = validateImageFiles(picked, remaining);
    if (error) toast.error(error);
    if (ok.length === 0) return;

    const toned = await Promise.all(
      ok.map(async (f) => {
        try {
          return await enhanceImageFile(f, PRODUCT_IMAGE_TONE_PRESET);
        } catch {
          return f;
        }
      })
    );

    const hadFilesBefore = prodFilesRef.current.length > 0;
    const nextFiles = [...prodFilesRef.current, ...toned];
    prodFilesRef.current = nextFiles;
    setProdFiles(nextFiles);
    updateProdPreviews((prev) => [
      ...prev,
      ...toned.map((f) => URL.createObjectURL(f)),
    ]);
    updateProdCropStates((prev) => [...prev, ...toned.map(() => null)]);
    toast.success(
      `사진 ${toned.length}장에 쇼룸 스튜디오 톤업(밝기 +20%)을 자동 적용했습니다.`
    );

    if (!hadFilesBefore && ok.length > 0 && !editingProductId) {
      runGeminiProductAnalysis(ok);
    }
  };

  const resetProductForm = useCallback(() => {
    revokeObjectUrls(prodPreviewsRef.current);
    prodFilesRef.current = [];
    adminUserRotatedRef.current.clear();
    setEditingProductId(null);
    setEditingExistingImages([]);
    setProdTitle("");
    setProdModel("");
    setProdPrice("");
    setProdCategory(PRODUCT_CATEGORIES[0]);
    setProdGrade("");
    setProdStatus(PRODUCT_STATUS.SELLING);
    setProdDesc("");
    setProdFiles([]);
    updateProdPreviews([]);
    updateProdCropStates([]);
    setAiPhotoObserved([]);
    setAiSearchSpecs([]);
    setAiWarnings([]);
    setAiSourceNote("");
    setAiSources([]);
  }, [updateProdPreviews, updateProdCropStates]);

  const startEditProduct = useCallback(
    (product: AdminProductRow) => {
      resetProductForm();
      setEditingProductId(product.id);
      setEditingExistingImages(splitImages(product.image_url));
      setProdTitle(product.title || "");
      setProdModel(extractModelName(product.description, product.title) || "");
      setProdCategory(normalizeProductCategory(product.category));
      setProdPrice(
        product.price && product.price > 0 ? String(product.price) : ""
      );
      setProdGrade(product.condition_grade || "");
      setProdStatus(normalizeProductStatus(product.status));
      setProdDesc(product.description || "");
      setActiveTab("products");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [resetProductForm]
  );

  const handledDeepLinkRef = useRef(false);

  // URL 딥링크 (?search= 또는 ?edit=) 감지 및 원클릭 상품 수정 자동 전환
  useEffect(() => {
    if (products.length === 0 || handledDeepLinkRef.current) return;
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
  }, [products, startEditProduct]);

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
      if (editingProductId) {
        const originalProd = products.find((p) => p.id === editingProductId);
        await updateProductRecord({
          id: editingProductId,
          title: prodTitle,
          price: prodPrice,
          category: prodCategory,
          conditionGrade: prodGrade,
          status: prodStatus,
          description: prodDesc,
          modelName: prodModel,
          existingImages: editingExistingImages,
          originalImages: splitImages(originalProd?.image_url),
          newFiles: prodFiles,
        });
        toast.success("상품 정보가 수정되었습니다.");
      } else {
        await createProductRecord({
          title: prodTitle,
          price: prodPrice,
          category: prodCategory,
          conditionGrade: prodGrade,
          description: prodDesc,
          modelName: prodModel,
          status: prodStatus,
          files: prodFiles,
        });
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
      const normalized = await updateProductStatus(productId, nextStatus);
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, status: normalized } : p))
      );
      toast.success(`상품 상태가 '${normalized}'(으)로 변경되었습니다.`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : "상품 상태 변경에 실패했습니다."
      );
    } finally {
      setBusyActionId(null);
    }
  };

  const handleFixCategoryMismatches = async (
    targets: readonly ProductCategoryMismatch[]
  ) => {
    if (targets.length === 0 || busyActionId) return;
    setBusyActionId("prod-category-fix");
    const toastId = toast.loading(
      `오분류 의심 매물 ${targets.length}건의 카테고리를 보정 중입니다...`
    );
    try {
      const updates = targets.map((m) => ({
        id: m.id,
        category: m.suggestedCategory,
      }));
      await bulkUpdateProductCategories(updates);
      const fixMap = new Map(updates.map((u) => [u.id, u.category]));
      setProducts((prev) =>
        prev.map((p) => {
          const nextCategory = fixMap.get(p.id);
          return nextCategory ? { ...p, category: nextCategory } : p;
        })
      );
      toast.success(
        `${targets.length}건의 상품 카테고리가 정상 분류로 보정되었습니다.`,
        { id: toastId }
      );
    } catch (err: unknown) {
      toast.error(
        "카테고리 보정 실패: " +
          (err instanceof Error ? err.message : "알 수 없는 오류"),
        { id: toastId }
      );
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
      await deleteProductRecord(product.id, product.image_url);
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
    updateDelivPreviews((prev) => [
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
      await createDeliveryCaseRecord({
        title: delivTitle,
        files: delivFiles,
      });

      revokeObjectUrls(delivPreviews);
      setDelivTitle("");
      setDelivFiles([]);
      updateDelivPreviews([]);
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
      await deleteDeliveryCaseRecord(id, target?.image_url);
      setDeliveryCases((prev) => prev.filter((d) => d.id !== id));
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제하지 못했습니다.");
    }
  };

  if (authChecking) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen flex items-center justify-center bg-[#F9FAFB] text-hb-sm font-semibold text-[#4B5260] focus:outline-none"
      >
        관리자 권한을 확인하고 있습니다...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLoginCard
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPw={loginPw}
        setLoginPw={setLoginPw}
        loggingIn={loggingIn}
        onSubmit={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans text-[#1F2530] pb-20">
      {/* 상단 관리자 헤더 */}
      <header className="sticky top-0 z-40 bg-[#141A23] text-white border-b border-white/10 shadow-md">
        <div className="hb-container py-3.5 sm:py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-[#E8521A] px-2 py-0.5 text-hb-xs font-extrabold tracking-wider">
                ADMIN
              </span>
              <h1 className="text-hb-lg sm:text-hb-xl font-extrabold tracking-[-0.02em]">
                {STORE.name} 통합 운영 대시보드
              </h1>
            </div>
            <p className="text-hb-xs text-white/65 mt-0.5 font-mono">
              접속 계정: {adminUserEmail}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={fetchAllAdminData}
              disabled={loadingData}
              className="rounded border border-white/20 bg-white/10 px-2.5 sm:px-3 py-1.5 text-hb-xs font-bold hover:bg-white/20 transition-colors"
            >
              {loadingData ? "갱신 중..." : "↻ 데이터 새로고침"}
            </button>
            <Link
              href="/gallery"
              className="hidden sm:inline-flex rounded border border-white/20 bg-white/10 px-3 py-1.5 text-hb-xs font-semibold hover:bg-white/20 transition-colors"
            >
              갤러리 관리
            </Link>
            <Link
              href="/"
              className="rounded border border-white/20 bg-white/10 px-2.5 sm:px-3 py-1.5 text-hb-xs font-semibold hover:bg-white/20 transition-colors"
            >
              사이트 보기
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded bg-red-600/90 px-2.5 sm:px-3 py-1.5 text-hb-xs font-bold text-white hover:bg-red-700 transition-colors ml-1"
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
                className={`px-3.5 sm:px-4 py-2.5 text-hb-xs sm:text-hb-sm font-bold whitespace-nowrap rounded-t transition-colors flex items-center gap-1.5 ${
                  active
                    ? "bg-[#F9FAFB] text-[#141A23]"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>{t.label}</span>
                {t.badge !== null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-hb-xs font-extrabold tabular-nums ${
                      t.highlight
                        ? "bg-[#E8521A] text-white"
                        : active
                        ? "bg-[#141A23]/10 text-[#141A23]"
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

      <main
        id="main-content"
        tabIndex={-1}
        className="hb-container py-6 sm:py-8 space-y-6 sm:space-y-8 focus:outline-none"
      >
        <AdminMetricsGrid
          metrics={metrics}
          onSelectTab={setActiveTab}
          onSelectInqStatusFilter={setInqStatusFilter}
        />

        {(activeTab === "overview" || activeTab === "inquiries") && (
          <AdminInquiriesTab
            inquiries={filteredInquiries}
            inqStatusFilter={inqStatusFilter}
            setInqStatusFilter={setInqStatusFilter}
            inqTypeFilter={inqTypeFilter}
            setInqTypeFilter={setInqTypeFilter}
            inqKeyword={inqKeyword}
            setInqKeyword={setInqKeyword}
            activeReplyId={activeReplyId}
            setActiveReplyId={setActiveReplyId}
            replyDraft={replyDraft}
            setReplyDraft={setReplyDraft}
            busyActionId={busyActionId}
            notificationLogs={notificationLogs}
            onStatusChange={handleExplicitInquiryStatusChange}
            onSaveReply={handleSaveInquiryReply}
            onDeleteInquiry={handleDeleteInquiry}
            onManualDispatch={handleManualNotificationDispatch}
          />
        )}

        {activeTab === "products" && (
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            <AdminProductForm
              editingProductId={editingProductId}
              editingExistingImages={editingExistingImages}
              setEditingExistingImages={setEditingExistingImages}
              prodTitle={prodTitle}
              setProdTitle={setProdTitle}
              prodModel={prodModel}
              setProdModel={setProdModel}
              prodPrice={prodPrice}
              setProdPrice={setProdPrice}
              prodCategory={prodCategory}
              setProdCategory={setProdCategory}
              prodStatus={prodStatus}
              setProdStatus={setProdStatus}
              prodDesc={prodDesc}
              setProdDesc={setProdDesc}
              prodFiles={prodFiles}
              prodPreviews={prodPreviews}
              prodCropStates={prodCropStates}
              savingProduct={savingProduct}
              useSearchSpecs={useSearchSpecs}
              setUseSearchSpecs={setUseSearchSpecs}
              autoSmartCrop={autoSmartCrop}
              setAutoSmartCrop={setAutoSmartCrop}
              analyzingProduct={analyzingProduct}
              aiPhotoObserved={aiPhotoObserved}
              aiSearchSpecs={aiSearchSpecs}
              aiWarnings={aiWarnings}
              aiSourceNote={aiSourceNote}
              aiSources={aiSources}
              onResetForm={resetProductForm}
              onSaveProduct={handleSaveProduct}
              onProductFileChange={handleProductFileChange}
              onRunGeminiAnalysis={runGeminiProductAnalysis}
              onEnhanceProdFile={enhanceProdFile}
              onToggleProdFileCrop={toggleProdFileCrop}
              onRemoveProdFile={removeProdFile}
              onMoveProdFile={moveProdFile}
              onMakePrimaryProdFile={makePrimaryProdFile}
              onAppendSearchSpecs={appendSearchSpecsToAdminDesc}
            />

            <AdminProductList
              products={filteredProducts}
              prodCategoryFilter={prodCategoryFilter}
              setProdCategoryFilter={setProdCategoryFilter}
              prodStatusFilter={prodStatusFilter}
              setProdStatusFilter={setProdStatusFilter}
              prodKeyword={prodKeyword}
              setProdKeyword={setProdKeyword}
              staleSellingProducts={metrics.staleSellingProducts}
              categoryMismatches={categoryMismatches}
              busyActionId={busyActionId}
              onFixCategoryMismatches={handleFixCategoryMismatches}
              onStatusChange={handleExplicitProductStatusChange}
              onStartEdit={startEditProduct}
              onOpenSmartCrop={setSmartCropProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          </div>
        )}

        {activeTab === "delivery" && (
          <AdminDeliveryTab
            analyzingDelivery={analyzingDelivery}
            savingDelivery={savingDelivery}
            delivObserved={delivObserved}
            delivReviewNotes={delivReviewNotes}
            delivTitle={delivTitle}
            setDelivTitle={setDelivTitle}
            deliveryCases={deliveryCases}
            onDeliveryFilesChange={handleDeliveryFilesChange}
            onSaveDeliveryCase={handleSaveDeliveryCase}
            onDeleteDeliveryCase={handleDeleteDeliveryCase}
          />
        )}

        {activeTab === "notifications" && (
          <AdminNotificationsTab
            inquiries={inquiries}
            notificationLogs={notificationLogs}
            busyActionId={busyActionId}
            onManualDispatch={handleManualNotificationDispatch}
          />
        )}
      </main>

      <AdminSmartCropModal
        product={smartCropProduct}
        productsQueue={filteredProducts}
        onClose={() => setSmartCropProduct(null)}
        onSelectProduct={setSmartCropProduct}
        onSaved={(productId, nextImageUrl) => {
          setProducts((prev) =>
            prev.map((p) =>
              p.id === productId ? { ...p, image_url: nextImageUrl } : p
            )
          );
          setSmartCropProduct((prev) =>
            prev && prev.id === productId
              ? { ...prev, image_url: nextImageUrl }
              : prev
          );
        }}
      />
    </div>
  );
}