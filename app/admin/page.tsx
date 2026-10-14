"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  supabase,
  isAuthorizedAdminUser,
  getAdminAuthHeaders,
} from "../../lib/supabase";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS,
  PRODUCT_STATUS_LIST,
  PRODUCT_CONDITION_GRADES,
  INQUIRY_ADMIN_STATUS_OPTIONS,
  STORAGE_BUCKETS,
  isPriorityInquiryStatus,
  isProductSold,
  normalizeProductStatus,
  normalizeProductCategory,
  formatProductPrice,
  splitImages,
  compressImage,
  validateImageFiles,
  extractInquiryImages,
  extractStorageFilesByBucket,
  type NotificationDispatchResult,
  telHref,
} from "../../lib/site";
import { Icon, ICON, SafeImg } from "../../lib/ui";

type AdminTab = "overview" | "inquiries" | "products" | "delivery" | "notifications";

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
  const [products, setProducts] = useState<any[]>([]);
  const [deliveryCases, setDeliveryCases] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  /* 문의/매입 필터 상태 */
  const [inqTypeFilter, setInqTypeFilter] = useState<string>("전체");
  const [inqStatusFilter, setInqStatusFilter] = useState<string>("priority"); // 기본: 미처리 신규 우선
  const [inqKeyword, setInqKeyword] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  /* 상품 검색·필터 및 등록/수정 폼 상태 */
  const [prodCategoryFilter, setProdCategoryFilter] = useState<string>("전체");
  const [prodStatusFilter, setProdStatusFilter] = useState<string>("전체");
  const [prodKeyword, setProdKeyword] = useState("");

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
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
        .order("created_at", { ascending: false });

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

  /* ───── 기본 운영 지표 계산 ───── */
  const metrics = useMemo(() => {
    const regularInquiries = inquiries.filter((i) => !i.is_notice);
    const priorityCount = regularInquiries.filter((i) =>
      isPriorityInquiryStatus(i.status)
    ).length;
    const buybackCount = regularInquiries.filter((i) =>
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

    return {
      totalInquiries: regularInquiries.length,
      priorityCount,
      buybackCount,
      totalProducts: products.length,
      sellingProducts,
      reservedProducts,
      soldProducts,
      deliveryCount: deliveryCases.length,
    };
  }, [inquiries, products, deliveryCases]);

  /* ───── 문의/매입 필터링 (신규 미처리 우선 정렬) ───── */
  const filteredInquiries = useMemo(() => {
    const q = inqKeyword.trim().toLowerCase();
    return inquiries
      .filter((i) => !i.is_notice)
      .filter((i) => {
        if (inqTypeFilter !== "전체" && i.inquiry_type !== inqTypeFilter) {
          return false;
        }
        if (inqStatusFilter === "priority") {
          return isPriorityInquiryStatus(i.status);
        }
        if (inqStatusFilter !== "전체" && (i.status || "접수") !== inqStatusFilter) {
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
    const q = prodKeyword.trim().toLowerCase();
    return products.filter((p) => {
      const cat = normalizeProductCategory(p.category);
      const stat = normalizeProductStatus(p.status);
      if (prodCategoryFilter !== "전체" && cat !== prodCategoryFilter)
        return false;
      if (prodStatusFilter !== "전체" && stat !== prodStatusFilter) return false;
      if (q) {
        const hay = `${p.title || ""} ${p.description || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
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
    } catch (err: any) {
      toast.error(err.message || "상태 변경에 실패했습니다.");
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
    } catch (err: any) {
      toast.error(err.message || "답변 등록 중 오류가 발생했습니다.");
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

  /* ───── 알림 수동 재발송 (Telegram / 알림톡 상태 확인) ───── */
  const handleManualNotificationDispatch = async (
    channel: "telegram" | "alimtalk",
    inq: { id: string; name: string; phone: string; inquiry_type: string; category: string }
  ) => {
    const actionKey = `notify-${channel}-${inq.id}`;
    if (busyActionId) return;
    setBusyActionId(actionKey);

    try {
      const endpoint = channel === "telegram" ? "/api/telegram" : "/api/alimtalk";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  /* ───── Gemini AI 상품 사진 분석 (3계층 분리) ───── */
  const runGeminiProductAnalysis = async (filesToAnalyze: File[]) => {
    if (filesToAnalyze.length === 0 || analyzingProduct) return;
    setAnalyzingProduct(true);
    const toastId = toast.loading("Gemini AI가 사진을 판독하고 초안을 작성 중입니다...");

    try {
      const formData = new FormData();
      formData.append("category", prodCategory);
      formData.append("searchSpecs", useSearchSpecs ? "true" : "false");

      for (const f of filesToAnalyze.slice(0, 3)) {
        const blob = await compressImage(f);
        formData.append("files", new File([blob], f.name, { type: "image/jpeg" }));
      }

      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/analyze-product", {
        method: "POST",
        headers,
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI 분석 실패");

      if (data.category) setProdCategory(normalizeProductCategory(data.category));
      if (data.title) setProdTitle(data.title);
      if (data.modelNumber) setProdModel(data.modelNumber);
      if (data.specDetails) setProdDesc(data.specDetails);

      setAiPhotoObserved(Array.isArray(data.photoObserved) ? data.photoObserved : []);
      setAiSearchSpecs(
        Array.isArray(data.searchDerivedSpecs) ? data.searchDerivedSpecs : []
      );
      setAiWarnings(Array.isArray(data.needsReview) ? data.needsReview : []);
      setAiSourceNote(data.sourceVerificationNote || "");
      setAiSources(Array.isArray(data.sourceUrls) ? data.sourceUrls : []);

      toast.success("AI 초안이 작성되었습니다. 확인 후 저장해 주세요.", {
        id: toastId,
      });
    } catch (err: any) {
      toast.error(err.message || "AI 분석에 실패했습니다.", { id: toastId });
    } finally {
      setAnalyzingProduct(false);
    }
  };

  const handleProductFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files);
    e.target.value = "";
    const { ok, error } = validateImageFiles(picked, 3 - prodFiles.length);
    if (error) toast.error(error);
    if (ok.length === 0) return;

    const merged = [...prodFiles, ...ok];
    setProdFiles(merged);
    setProdPreviews((prev) => [...prev, ...ok.map((f) => URL.createObjectURL(f))]);

    if (prodFiles.length === 0 && ok.length > 0 && !editingProductId) {
      runGeminiProductAnalysis(ok);
    }
  };

  const resetProductForm = () => {
    prodPreviews.forEach((u) => URL.revokeObjectURL(u));
    setEditingProductId(null);
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

  const startEditProduct = (product: any) => {
    resetProductForm();
    setEditingProductId(product.id);
    setProdTitle(product.title || "");
    setProdCategory(normalizeProductCategory(product.category));
    setProdPrice(product.price && product.price > 0 ? String(product.price) : "");
    setProdGrade(product.condition_grade || PRODUCT_CONDITION_GRADES[1]);
    setProdStatus(normalizeProductStatus(product.status));
    setProdDesc(product.description || "");
    setActiveTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingProduct) return;
    if (!prodTitle.trim()) {
      toast.error("상품명을 입력해 주세요.");
      return;
    }

    setSavingProduct(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of prodFiles) {
        const blob = await compressImage(file);
        const fileName = `product_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .upload(fileName, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        uploadedUrls.push(
          supabase.storage
            .from(STORAGE_BUCKETS.inquiries)
            .getPublicUrl(fileName).data.publicUrl
        );
      }

      const numericPrice = prodPrice
        ? Number(prodPrice.replace(/[^0-9]/g, ""))
        : 0;

      let finalDesc = prodDesc.trim();
      if (prodModel.trim() && !finalDesc.includes("모델명")) {
        finalDesc = `• 모델명: ${prodModel.trim()}\n` + finalDesc;
      }

      if (editingProductId) {
        const patch: Record<string, any> = {
          title: prodTitle.trim(),
          price: numericPrice,
          category: normalizeProductCategory(prodCategory),
          condition_grade: prodGrade,
          status: normalizeProductStatus(prodStatus),
          description: finalDesc,
        };
        if (uploadedUrls.length > 0) {
          patch.image_url = uploadedUrls.join(",");
        }

        const { error } = await supabase
          .from("products")
          .update(patch)
          .eq("id", editingProductId);
        if (error) throw error;
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
    } catch (err: any) {
      toast.error("상품 저장 실패: " + err.message);
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

  const handleDeleteProduct = async (product: any) => {
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
        const { inquiries: inqBucketFiles } = extractStorageFilesByBucket(imgs);
        if (inqBucketFiles.length > 0) {
          await supabase.storage
            .from(STORAGE_BUCKETS.inquiries)
            .remove(inqBucketFiles);
        }
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
      const urls: string[] = [];
      for (const f of delivFiles) {
        const blob = await compressImage(f, 1600, 0.82);
        const fileName = `delivery_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .upload(fileName, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        urls.push(
          supabase.storage
            .from(STORAGE_BUCKETS.inquiries)
            .getPublicUrl(fileName).data.publicUrl
        );
      }

      const { error } = await supabase.from("products").insert({
        title: delivTitle.trim(),
        category: "배송인증",
        image_url: urls.join(","),
        price: 0,
        status: "판매중",
      });
      if (error) throw error;

      delivPreviews.forEach((u) => URL.revokeObjectURL(u));
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
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setDeliveryCases((prev) => prev.filter((d) => d.id !== id));
      toast.success("삭제되었습니다.");
    } catch {
      toast.error("삭제하지 못했습니다.");
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] text-[14px] font-semibold text-[#4B5260]">
        관리자 권한을 확인하고 있습니다...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] p-4 font-sans">
        <div className="bg-white p-8 rounded-lg shadow-md border border-[#E4E0D8] w-full max-w-sm">
          <h1 className="text-[20px] font-bold text-[#0E1A2B] text-center">
            한밭중고전자 통합 관리자
          </h1>
          <p className="mt-1 text-[13px] text-[#6B7280] text-center mb-6">
            인가된 관리자 계정으로 로그인해야 접근할 수 있습니다.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="hb-label">관리자 이메일</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
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
          <div className="mt-5 text-center">
            <Link href="/" className="text-[12.5px] text-[#6B7280] underline">
              ← 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F5F2] font-sans text-[#1F2530] pb-20">
      {/* 상단 관리자 헤더 */}
      <header className="sticky top-0 z-40 bg-[#0E1A2B] text-white border-b border-white/10">
        <div className="hb-container py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#D9531E] px-2 py-0.5 text-[11px] font-bold">
                ADMIN
              </span>
              <h1 className="text-[18px] sm:text-[20px] font-bold">
                한밭중고전자 통합 운영 대시보드
              </h1>
            </div>
            <p className="text-[12px] text-white/65 mt-0.5">
              접속 계정: {adminUserEmail}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchAllAdminData}
              disabled={loadingData}
              className="rounded border border-white/25 bg-white/10 px-3 py-1.5 text-[12.5px] font-semibold hover:bg-white/20"
            >
              {loadingData ? "갱신 중..." : "데이터 새로고침"}
            </button>
            <Link
              href="/"
              className="rounded border border-white/25 bg-white/10 px-3 py-1.5 text-[12.5px] font-semibold hover:bg-white/20"
            >
              사이트 보기
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded bg-red-600 px-3 py-1.5 text-[12.5px] font-bold text-white hover:bg-red-700"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* 탭 내비게이션 */}
        <div className="hb-container flex gap-1 overflow-x-auto border-t border-white/10 pt-2">
          {(
            [
              {
                id: "overview",
                label: `운영 요약 · 신규 접수 (${metrics.priorityCount})`,
              },
              {
                id: "inquiries",
                label: `문의 · 매입 관리 (${metrics.totalInquiries})`,
              },
              {
                id: "products",
                label: `상품 등록 · 재고 (${metrics.totalProducts})`,
              },
              {
                id: "delivery",
                label: `배송·설치 사례 (${metrics.deliveryCount})`,
              },
              {
                id: "notifications",
                label: "알림 발송 상태 · 재시도",
              },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-[13px] font-bold whitespace-nowrap rounded-t transition-colors ${
                activeTab === t.id
                  ? "bg-[#F6F5F2] text-[#0E1A2B]"
                  : "text-white/75 hover:text-white hover:bg-white/5"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="hb-container py-8 space-y-8">
        {/* 1. 기본 운영 지표 카드 (항상 상단 노출) */}
        <section
          aria-label="운영 지표 요약"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3.5"
        >
          <div className="rounded-md border border-[#FADCD0] bg-[#FFF5F0] p-4">
            <span className="text-[12px] font-bold text-[#B5431A]">
              우선 확인 필요 (접수·검토중)
            </span>
            <p className="mt-1 text-[26px] font-bold text-[#D9531E]">
              {metrics.priorityCount}건
            </p>
          </div>
          <div className="rounded-md border border-[#E4E0D8] bg-white p-4">
            <span className="text-[12px] font-bold text-[#6B7280]">
              전체 문의 · 매입 신청
            </span>
            <p className="mt-1 text-[26px] font-bold text-[#0E1A2B]">
              {metrics.totalInquiries}건{" "}
              <span className="text-[13px] font-medium text-[#6B7280]">
                (매입 {metrics.buybackCount})
              </span>
            </p>
          </div>
          <div className="rounded-md border border-[#E4E0D8] bg-white p-4">
            <span className="text-[12px] font-bold text-[#6B7280]">
              현재 판매중 / 예약중 재고
            </span>
            <p className="mt-1 text-[26px] font-bold text-[#0E1A2B]">
              {metrics.sellingProducts}건{" "}
              <span className="text-[13px] font-medium text-amber-700">
                (예약 {metrics.reservedProducts})
              </span>
            </p>
          </div>
          <div className="rounded-md border border-[#E4E0D8] bg-white p-4">
            <span className="text-[12px] font-bold text-[#6B7280]">
              판매완료 / 배송사례
            </span>
            <p className="mt-1 text-[26px] font-bold text-[#4B5260]">
              {metrics.soldProducts}건{" "}
              <span className="text-[13px] font-medium text-[#6B7280]">
                (사례 {metrics.deliveryCount})
              </span>
            </p>
          </div>
        </section>

        {/* 2. 탭별 본문: OVERVIEW 또는 INQUIRIES */}
        {(activeTab === "overview" || activeTab === "inquiries") && (
          <section className="rounded-md border border-[#E4E0D8] bg-white p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E0D8] pb-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#0E1A2B]">
                  고객 문의 및 매입 신청 통합 관리
                </h2>
                <p className="text-[13px] text-[#6B7280]">
                  신규 접수 건을 우선 확인하고, 진행 상태를 명시적으로 선택하여 변경하거나 답변을 등록하세요.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={inqStatusFilter}
                  onChange={(e) => setInqStatusFilter(e.target.value)}
                  className="h-9 rounded border border-[#DDD9D1] bg-white px-2.5 text-[13px] font-bold text-[#0E1A2B]"
                >
                  <option value="priority">⚡ 미처리 신규(접수·검토중)만</option>
                  <option value="전체">전체 상태 보기</option>
                  {INQUIRY_ADMIN_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label} 상태만
                    </option>
                  ))}
                </select>

                <select
                  value={inqTypeFilter}
                  onChange={(e) => setInqTypeFilter(e.target.value)}
                  className="h-9 rounded border border-[#DDD9D1] bg-white px-2.5 text-[13px] font-semibold text-[#4B5260]"
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
                  className="h-9 rounded border border-[#DDD9D1] px-3 text-[13px]"
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
                      className={`rounded-md border p-4 sm:p-5 transition-colors ${
                        isPriority
                          ? "border-[#D9531E]/50 bg-[#FFFDFB]"
                          : "border-[#E4E0D8] bg-white"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {isPriority && (
                              <span className="rounded-sm bg-[#D9531E] px-2 py-0.5 text-[11px] font-bold text-white">
                                우선 확인
                              </span>
                            )}
                            <span className="rounded-sm bg-[#0E1A2B] px-2.5 py-0.5 text-[11px] font-bold text-white">
                              {req.status || "접수"}
                            </span>
                            <span className="rounded-sm bg-[#F2F0EC] px-2 py-0.5 text-[11.5px] font-bold text-[#4B5260]">
                              {req.inquiry_type || "문의"}
                            </span>
                            <span className="text-[12px] text-[#8A8478]">
                              {new Date(req.created_at).toLocaleString("ko-KR")}
                            </span>
                          </div>

                          <h3 className="text-[16px] font-bold text-[#0E1A2B] pt-1">
                            {req.category}
                          </h3>

                          <p className="text-[13.5px] text-[#4B5260]">
                            접수자: <strong>{req.name}</strong>{" "}
                            {req.phone && (
                              <a
                                href={telHref(req.phone)}
                                className="ml-2 font-bold text-[#D9531E] underline"
                              >
                                📞 {req.phone}
                              </a>
                            )}
                            {req.region && (
                              <span className="ml-3 text-[#6B7280]">
                                📍 지역: {req.region}
                              </span>
                            )}
                          </p>
                        </div>

                        {/* 명시적 상태 선택 드롭다운 (단순 순환 버튼 대체) */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <label className="text-[12px] font-bold text-[#6B7280]">
                            상태 변경:
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
                            disabled={busyActionId === `inq-del-${req.id}`}
                            onClick={() =>
                              handleDeleteInquiry(req.id, req.category)
                            }
                            className="h-9 rounded border border-red-200 bg-red-50 px-3 text-[12px] font-bold text-red-600 hover:bg-red-100"
                          >
                            삭제
                          </button>
                        </div>
                      </div>

                      {req.description && (
                        <div className="mt-3 rounded bg-[#FAF9F7] p-3.5 text-[13.5px] text-[#1F2530] whitespace-pre-wrap leading-relaxed border border-[#EEEBE5]">
                          {req.description}
                        </div>
                      )}

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
            {/* 좌측: AI 보조 상품 등록/수정 폼 */}
            <section className="rounded-md border border-[#E4E0D8] bg-white p-5 sm:p-6 lg:col-span-5 space-y-4">
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
                <div>
                  <label className="hb-label">상품 사진 (최대 3장)</label>
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

                  {analyzingProduct && (
                    <p className="mt-2 rounded bg-[#FFF5F0] p-2.5 text-[12px] font-bold text-[#D9531E] animate-pulse">
                      Gemini 3.8 Flash가 사진 판독 및 사양 초안을 작성 중입니다...
                    </p>
                  )}

                  {prodPreviews.length > 0 && (
                    <div className="mt-2.5 grid grid-cols-3 gap-2">
                      {prodPreviews.map((src, i) => (
                        <div
                          key={src}
                          className="relative aspect-square rounded border border-[#DDD9D1] overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            className="h-full w-full object-cover"
                          />
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
                        <strong className="text-[#0E1A2B]">
                          2) 검색으로 확인한 참고 제원:
                        </strong>
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
            <section className="rounded-md border border-[#E4E0D8] bg-white p-5 sm:p-6 lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E0D8] pb-3">
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

              <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
                {filteredProducts.map((product) => {
                  const imgs = splitImages(product.image_url);
                  const catLabel = normalizeProductCategory(product.category);
                  const statValue = normalizeProductStatus(product.status);

                  return (
                    <div
                      key={product.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded border border-[#E4E0D8] p-3 hover:border-[#0E1A2B]/40"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded bg-[#EFECE6] border border-[#E4E0D8]">
                          <SafeImg
                            src={imgs[0]}
                            alt={product.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold text-[#6B7280]">
                            {catLabel} · 조회 {product.views || 0}
                          </span>
                          <h3 className="truncate text-[14px] font-bold text-[#0E1A2B]">
                            {product.title}
                          </h3>
                          <p className="text-[13px] font-bold text-[#D9531E]">
                            {formatProductPrice(product.price, catLabel)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
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
                          className="h-8 rounded border border-[#DDD9D1] bg-white px-2 text-[12px] font-bold text-[#0E1A2B]"
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
                          className="h-8 rounded border border-[#DDD9D1] bg-[#FAF9F7] px-2.5 text-[12px] font-bold text-[#0E1A2B]"
                        >
                          편집
                        </button>
                        <button
                          type="button"
                          disabled={busyActionId === `prod-del-${product.id}`}
                          onClick={() => handleDeleteProduct(product)}
                          className="h-8 rounded border border-red-200 bg-red-50 px-2.5 text-[12px] font-bold text-red-600"
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

        {/* 4. 탭별 본문: DELIVERY (배송·설치 사례 AI 보조 등록 및 관리) */}
        {activeTab === "delivery" && (
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            <section className="rounded-md border border-[#E4E0D8] bg-white p-5 sm:p-6 lg:col-span-5 space-y-4">
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
                  <div className="rounded border border-[#E4E0D8] bg-[#FAF9F7] p-3 text-[12px] space-y-1.5">
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

            <section className="rounded-md border border-[#E4E0D8] bg-white p-5 sm:p-6 lg:col-span-7 space-y-4">
              <h2 className="text-[17px] font-bold text-[#0E1A2B]">
                등록된 배송·설치 사례 ({deliveryCases.length}건)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {deliveryCases.map((item) => {
                  const imgs = splitImages(item.image_url);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded border border-[#E4E0D8] p-3"
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

        {/* 5. 탭별 본문: NOTIFICATIONS (알림 발송 결과 5대 상태 확인 및 수동 재시도) */}
        {activeTab === "notifications" && (
          <section className="rounded-md border border-[#E4E0D8] bg-white p-5 sm:p-6 space-y-5">
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
              <table className="w-full text-left text-[13.5px] border-t border-[#E4E0D8]">
                <thead className="bg-[#FAF9F7] text-[#6B7280] border-b border-[#E4E0D8]">
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
                              <span className="text-[12px] text-[#8A8478]">
                                설정 미완료 (대행사 미연결)
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
