"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  supabase,
  isAuthorizedAdminUser,
  getAdminAuthHeaders,
} from "../../lib/supabase";
import toast from "react-hot-toast";
import {
  STORE,
  telHref,
  maskName,
  isSellInquiry,
  isBuyInquiry,
  isBulkBizInquiry,
  getInquiryTypeLabel,
  INQUIRY_ADMIN_STATUS_OPTIONS,
  type InquiryTypeValue,
} from "../../lib/site";
import {
  Icon,
  ICON,
  SafeImg,
  Modal,
  SiteHeader,
  SiteFooter,
  MobileCtaBar,
} from "../../lib/ui";
import {
  UnifiedInquiryForm,
  type LinkedProductContext,
} from "../../components/inquiry/unified-inquiry-form";

interface Inquiry {
  id: string;
  name: string | null;
  masked_name?: string;
  phone: string | null;
  inquiry_type: string | null;
  category: string | null;
  model?: string | null;
  condition_grade?: string | null;
  region?: string | null;
  description: string | null;
  images: string[] | null;
  has_images?: boolean;
  is_notice: boolean | null;
  status: string | null;
  admin_reply: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;
const TABS = [
  "전체",
  "구매 문의",
  "내 물건 팔기",
  "대량·업소용 상담",
  "기타 문의",
] as const;
type Tab = (typeof TABS)[number];

const REPLY_TEMPLATES = [
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

const typeStyle = (t?: string | null) =>
  isSellInquiry(t)
    ? "bg-[#FBE9E1] text-[#B5431A]"
    : isBulkBizInquiry(t)
    ? "bg-amber-100 text-amber-900"
    : isBuyInquiry(t)
    ? "bg-[#E8ECF2] text-[#0E1A2B]"
    : "bg-[#F0EDE7] text-[#4B5260]";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() === new Date().getFullYear()
    ? `${mm}-${dd}`
    : `${String(d.getFullYear()).slice(2)}-${mm}-${dd}`;
};

function StatusBadge({
  status,
  notice,
}: {
  status: string | null;
  notice?: boolean;
}) {
  if (notice) return <span className="text-neutral-400">-</span>;
  const s = status || "접수";
  const matched = INQUIRY_ADMIN_STATUS_OPTIONS.find((o) => o.value === s);
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-[4px] text-[11px] font-bold whitespace-nowrap ${
        matched ? matched.badgeClass : "bg-[#F0EDE7] text-[#4B5260]"
      }`}
    >
      {s}
    </span>
  );
}

function pageWindow(current: number, total: number) {
  const pages: (number | "…")[] = [];
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || Math.abs(p - current) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return pages;
}

export default function InquiryBoardPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("전체");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);

  /* 글쓰기 모달 및 상품 상세 연동 프리필 상태 */
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [writeDefaultType, setWriteDefaultType] =
    useState<InquiryTypeValue>("내 물건 팔기");
  const [linkedProduct, setLinkedProduct] =
    useState<LinkedProductContext | null>(null);

  /* 상세 / 비밀번호 검증 / 수정 */
  const [selectedItem, setSelectedItem] = useState<Inquiry | null>(null);
  const [verifiedPassword, setVerifiedPassword] = useState("");
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const [isVerifyingPw, setIsVerifyingPw] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [inputPw, setInputPw] = useState("");
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editInquiryType, setEditInquiryType] = useState("");
  const [editUpdating, setEditUpdating] = useState(false);

  /* 관리자 */
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const loadData = useCallback(async () => {
    await Promise.resolve();
    setIsLoading(true);
    setLoadError(false);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/inquiries", { headers });
      if (!res.ok) throw new Error("목록 조회 실패");
      const json = await res.json();
      setInquiries((json.inquiries || []) as Inquiry[]);
    } catch (error) {
      console.error(error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAdmin(isAuthorizedAdminUser(session?.user));
    };
    checkSession();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        setIsAdmin(isAuthorizedAdminUser(session?.user));
        void loadData();
      }
    );
    queueMicrotask(() => {
      void loadData();
    });
    return () => authListener.subscription.unsubscribe();
  }, [loadData]);

  /* 상품 상세 페이지(/gallery 또는 /[id])에서 넘어온 쿼리 파라미터 자동 프리필 */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (
      params.get("write") === "1" ||
      params.get("bundle") === "1" ||
      params.get("title")
    ) {
      queueMicrotask(() => {
        const isBundle = params.get("bundle") === "1";
        const qType = params.get("type");
        const qTitle = params.get("title") || "";
        const qModel = params.get("model") || "";
        const qCategory = params.get("category") || "";
        const qProductId = params.get("productId") || "";

        if (
          qType === "구매 문의" ||
          qType === "내 물건 팔기" ||
          qType === "대량·업소용 상담"
        ) {
          setWriteDefaultType(qType);
        } else {
          setWriteDefaultType(isBundle ? "대량·업소용 상담" : "구매 문의");
        }

        if (isBundle || qTitle || qModel || qProductId) {
          setLinkedProduct({
            productId: qProductId || undefined,
            productTitle: qTitle || undefined,
            modelName: qModel || undefined,
            category: qCategory || undefined,
            useBundle: isBundle,
          });
        }
        setIsWriteOpen(true);
      });
    }
  }, []);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && enlargedImage) {
        setEnlargedImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enlargedImage]);

  const noticeList = useMemo(
    () => inquiries.filter((i) => i.is_notice),
    [inquiries]
  );
  const regularList = useMemo(
    () => inquiries.filter((i) => !i.is_notice),
    [inquiries]
  );

  const tabCounts = useMemo(
    () => ({
      전체: regularList.length,
      "구매 문의": regularList.filter((i) => isBuyInquiry(i.inquiry_type))
        .length,
      "내 물건 팔기": regularList.filter((i) => isSellInquiry(i.inquiry_type))
        .length,
      "대량·업소용 상담": regularList.filter((i) =>
        isBulkBizInquiry(i.inquiry_type)
      ).length,
      "기타 문의": regularList.filter(
        (i) =>
          !isBuyInquiry(i.inquiry_type) &&
          !isSellInquiry(i.inquiry_type) &&
          !isBulkBizInquiry(i.inquiry_type)
      ).length,
    }),
    [regularList]
  );

  const filteredList = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return regularList.filter((item) => {
      const tabOk =
        activeTab === "전체" ||
        (activeTab === "구매 문의" && isBuyInquiry(item.inquiry_type)) ||
        (activeTab === "내 물건 팔기" && isSellInquiry(item.inquiry_type)) ||
        (activeTab === "대량·업소용 상담" &&
          isBulkBizInquiry(item.inquiry_type)) ||
        (activeTab === "기타 문의" &&
          !isBuyInquiry(item.inquiry_type) &&
          !isSellInquiry(item.inquiry_type) &&
          !isBulkBizInquiry(item.inquiry_type));
      return tabOk && (!q || (item.category || "").toLowerCase().includes(q));
    });
  }, [regularList, activeTab, keyword]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredList.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const currentItems = filteredList.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );
  const showNotices =
    noticeList.length > 0 && !keyword.trim() && activeTab === "전체";

  const goPage = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenWrite = () => {
    setLinkedProduct(null);
    setWriteDefaultType("내 물건 팔기");
    setIsWriteOpen(true);
  };

  const handleItemClick = async (item: Inquiry) => {
    setSelectedItem(item);
    setInputPw("");
    setVerifiedPassword("");
    setShowVerifyPassword(false);

    if (item.is_notice) {
      setReplyContent(item.admin_reply || "");
      setIsDetailOpen(true);
      return;
    }

    if (isAdmin) {
      try {
        const headers = await getAdminAuthHeaders();
        const res = await fetch(`/api/inquiries/${item.id}`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        if (res.ok) {
          const json = await res.json();
          setSelectedItem(json.inquiry);
          setReplyContent(json.inquiry.admin_reply || "");
          setIsDetailOpen(true);
          return;
        }
      } catch {
        // 폴백
      }
    }

    setIsPwModalOpen(true);
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setIsVerifyingPw(true);
    try {
      const res = await fetch(`/api/inquiries/${selectedItem.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: inputPw.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.inquiry) {
        toast.error(json.error || "비밀번호가 일치하지 않습니다.");
        return;
      }
      setSelectedItem(json.inquiry);
      setVerifiedPassword(inputPw.trim());
      setReplyContent(json.inquiry.admin_reply || "");
      setIsPwModalOpen(false);
      setIsDetailOpen(true);
    } catch {
      toast.error("비밀번호 확인 중 오류가 발생했습니다.");
    } finally {
      setIsVerifyingPw(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!selectedItem) return;
    if (!replyContent.trim()) {
      toast.error("답변 내용을 입력해 주세요.");
      return;
    }
    setIsReplying(true);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/inquiries/${selectedItem.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "답변완료",
          admin_reply: replyContent.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "답변 등록 실패");

      toast.success("답변이 성공적으로 등록되었습니다.");
      setSelectedItem({
        ...selectedItem,
        status: "답변완료",
        admin_reply: replyContent.trim(),
      });
      await loadData();
    } catch (error: unknown) {
      toast.error(
        "답변 등록 실패: " +
          (error instanceof Error ? error.message : "알 수 없는 오류")
      );
    } finally {
      setIsReplying(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "상태 변경 실패");

      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
      );
      setSelectedItem((prev) =>
        prev ? { ...prev, status: newStatus } : prev
      );
      toast.success(`진행 상태가 '${newStatus}'(으)로 변경되었습니다.`);
    } catch (err: unknown) {
      toast.error(
        "상태 업데이트 실패: " +
          (err instanceof Error ? err.message : "알 수 없는 오류")
      );
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });
      if (error) throw error;
      if (!isAuthorizedAdminUser(data.user)) {
        await supabase.auth.signOut();
        toast.error("관리자 권한이 없는 계정입니다.");
        return;
      }
      toast.success("관리자로 로그인했습니다.");
      setIsAdminAuthModalOpen(false);
      setAdminEmail("");
      setAdminPassword("");
    } catch {
      toast.error("이메일 또는 비밀번호를 확인해 주세요.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminLogout = async () => {
    if (confirm("관리자 모드를 종료하시겠습니까?")) {
      await supabase.auth.signOut();
      toast.success("관리자 모드가 종료되었습니다.");
    }
  };

  const handleOpenEdit = () => {
    if (!selectedItem) return;
    setEditTitle(selectedItem.category || "");
    setEditContent(selectedItem.description || "");
    setEditInquiryType(selectedItem.inquiry_type || "내 물건 팔기");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setEditUpdating(true);
    const nextType = selectedItem.is_notice ? "공지사항" : editInquiryType;

    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/inquiries/${selectedItem.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          password: verifiedPassword,
          category: editTitle.trim(),
          description: editContent.trim(),
          inquiry_type: nextType,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "수정 실패");

      toast.success("성공적으로 수정되었습니다.");
      setSelectedItem({
        ...selectedItem,
        category: editTitle.trim(),
        description: editContent.trim(),
        inquiry_type: nextType,
      });
      setIsEditOpen(false);
      loadData();
    } catch (err: unknown) {
      toast.error(
        "수정 실패: " +
          (err instanceof Error ? err.message : "알 수 없는 오류")
      );
    } finally {
      setEditUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!confirm("정말 이 글을 삭제하시겠습니까? (복구 불가능)")) return;
    const id = selectedItem.id;
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ password: verifiedPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "삭제 실패");

      setInquiries((prev) => prev.filter((i) => i.id !== id));
      setIsDetailOpen(false);
      toast.success("삭제했습니다.");
    } catch (err: unknown) {
      toast.error(
        (err instanceof Error && err.message) || "삭제하지 못했습니다."
      );
      loadData();
    }
  };

  const canManage = !!selectedItem && (isAdmin || !selectedItem.is_notice);
  const rowTitle = (item: Inquiry) => item.category || "문의드립니다.";
  const hasImages = (item: Inquiry) =>
    Boolean(item.has_images || (item.images && item.images.length > 0));

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#1F2530] font-sans flex flex-col">
      <SiteHeader>
        {isAdmin && (
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center rounded-md border border-[#DDD9D1] bg-[#FAF9F7] px-3 h-10 text-[12px] font-bold text-[#0E1A2B] hover:border-[#0E1A2B]"
          >
            통합 관리자 대시보드
          </Link>
        )}
        <button
          type="button"
          onClick={handleOpenWrite}
          className="hb-btn-primary h-10 px-4 text-[13px]"
        >
          문의 글쓰기
        </button>
      </SiteHeader>

      {/* 상단 게시판 헤더 */}
      <section className="bg-white border-b border-[#E4E0D8]">
        <div className="hb-container py-9 sm:py-13">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="hb-eyebrow">Q&amp;A &amp; Buyback Board</span>
                <span className="text-[11px] text-[#CFCAC0]">|</span>
                <span className="text-[12px] font-semibold text-[#6B7280]">
                  비밀번호 보호 안전 열람
                </span>
              </div>
              <h1 className="text-[26px] sm:text-[34px] font-extrabold text-[#0E1A2B] tracking-[-0.025em] leading-[1.2]">
                고객 문의 · 매입 신청 게시판
              </h1>
              <p className="mt-2 text-[14px] sm:text-[15px] text-[#4B5260] leading-relaxed max-w-2xl break-keep">
                남겨주신 구매 상담과 매입 신청은 개인정보 보호를 위해 설정하신 비밀번호로 안전하게 열람할 수 있습니다. 빠른 상담은 대표전화로 연락해 주세요.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenWrite}
                className="hb-btn-accent h-11 px-5 text-[13.5px]"
              >
                <Icon d={ICON.plus} className="w-4 h-4" />
                <span>문의 · 매입 신청 작성</span>
              </button>
              <a
                href={telHref(STORE.tel)}
                className="hb-btn-outline h-11 px-4 text-[13px] tabular-nums"
              >
                <Icon d={ICON.phone} className="w-3.5 h-3.5 text-[#D9531E]" />
                <span>전화 {STORE.tel}</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="hb-container py-7 sm:py-12 flex-1 w-full">
        {/* 필터 탭 및 제목 검색 바 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-5">
          <div
            className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 md:pb-0"
            role="tablist"
            aria-label="문의 구분 필터"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setActiveTab(tab);
                    setCurrentPage(1);
                  }}
                  className={`px-3 sm:px-3.5 py-2 rounded text-[12.5px] sm:text-[13px] font-bold whitespace-nowrap border transition-colors shrink-0 ${
                    active
                      ? "bg-[#0E1A2B] text-white border-[#0E1A2B] shadow-2xs"
                      : "bg-white text-[#4B5260] border-[#DDD9D1] hover:border-[#0E1A2B]/40 hover:bg-[#F6F5F2]"
                  }`}
                >
                  {tab}
                  <span
                    className={`ml-1.5 text-[11px] sm:text-[11.5px] tabular-nums ${
                      active ? "text-[#FF8A50]" : "text-[#8A8478]"
                    }`}
                  >
                    {tabCounts[tab] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1 md:flex-none">
              <input
                type="search"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="제목·품목 검색"
                aria-label="제목 검색"
                className="h-10 w-full md:w-[230px] rounded border border-[#DDD9D1] bg-white px-3 pl-9 pr-8 text-[13.5px] text-[#0E1A2B] placeholder:text-[#8A8478] focus:border-[#0E1A2B] focus:outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8478] pointer-events-none">
                <Icon d={ICON.search} className="w-4 h-4" />
              </span>
              {keyword.trim() !== "" && (
                <button
                  type="button"
                  onClick={() => {
                    setKeyword("");
                    setCurrentPage(1);
                  }}
                  aria-label="검색어 지우기"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A8478] hover:text-[#0E1A2B]"
                >
                  <Icon d={ICON.close} className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpenWrite}
              className="hb-btn-primary h-10 px-4 text-[13px] whitespace-nowrap"
            >
              <Icon d={ICON.plus} className="w-4 h-4" />
              <span>글쓰기</span>
            </button>
          </div>
        </div>

        {/* 데스크톱 테이블 */}
        <div className="hidden md:block overflow-hidden rounded-md border border-[#E4E0D8] bg-white shadow-card">
          <table className="w-full text-[13.5px] text-center text-[#1F2530]">
            <thead className="bg-[#FAF9F7] text-[#6B7280] text-[12.5px] font-bold border-b border-[#E4E0D8]">
              <tr className="h-12">
                <th className="w-20">번호</th>
                <th className="w-32">구분</th>
                <th className="text-left px-5">제목</th>
                <th className="w-28">진행상태</th>
                <th className="w-28">작성자</th>
                <th className="w-28">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEBE5]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="h-14 animate-pulse">
                    <td colSpan={6} className="px-5">
                      <div className="h-4 bg-[#EFECE6] rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {showNotices &&
                    noticeList.map((notice) => (
                      <tr
                        key={notice.id}
                        onClick={() => handleItemClick(notice)}
                        className="bg-[#FEF5F2] hover:bg-[#FDECE4] transition-colors h-14 cursor-pointer"
                      >
                        <td>
                          <span className="bg-[#D9531E] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
                            공지
                          </span>
                        </td>
                        <td>
                          <span className="inline-block px-2.5 py-1 rounded text-[12px] font-bold text-[#B5431A]">
                            공지사항
                          </span>
                        </td>
                        <td className="px-5 text-left font-bold text-[#0E1A2B]">
                          <div className="flex items-center gap-2">
                            <Icon
                              d={ICON.bell}
                              className="w-4 h-4 text-[#D9531E] shrink-0"
                            />
                            <span className="truncate">{notice.category}</span>
                            {hasImages(notice) && (
                              <Icon
                                d={ICON.image}
                                className="w-4 h-4 text-[#D9531E] shrink-0"
                              />
                            )}
                          </div>
                        </td>
                        <td>
                          <StatusBadge status={null} notice />
                        </td>
                        <td className="font-bold text-[#D9531E]">
                          {notice.name}
                        </td>
                        <td className="text-[#8A8478] tabular-nums">
                          {formatDate(notice.created_at)}
                        </td>
                      </tr>
                    ))}
                  {currentItems.map((item, index) => (
                    <tr
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="hover:bg-[#FAF9F7] transition-colors h-14 cursor-pointer"
                    >
                      <td className="text-[#8A8478] tabular-nums">
                        {filteredList.length -
                          ((safePage - 1) * ITEMS_PER_PAGE + index)}
                      </td>
                      <td>
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-[11.5px] font-bold whitespace-nowrap ${typeStyle(
                            item.inquiry_type
                          )}`}
                        >
                          {getInquiryTypeLabel(item.inquiry_type)}
                        </span>
                      </td>
                      <td className="px-5 text-left">
                        <div className="flex items-center gap-2 font-semibold text-[#0E1A2B]">
                          {!isAdmin && (
                            <Icon
                              d={ICON.lock}
                              className="w-3.5 h-3.5 text-[#8A8478] shrink-0"
                            />
                          )}
                          <span className="truncate">{rowTitle(item)}</span>
                          {hasImages(item) && (
                            <Icon
                              d={ICON.image}
                              className="w-4 h-4 text-[#8A8478] shrink-0"
                            />
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="text-[#4B5260] font-medium">
                        {item.masked_name || maskName(item.name)}
                      </td>
                      <td className="text-[#8A8478] text-[12.5px] tabular-nums">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* 모바일 리스트 (누락되었던 공지사항 noticeList 복구 완료) */}
        <ul className="md:hidden space-y-2.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <li
                key={`msk-${i}`}
                className="h-24 bg-white rounded-md border border-[#E4E0D8] animate-pulse"
              />
            ))
          ) : (
            <>
              {showNotices &&
                noticeList.map((notice) => (
                  <li key={notice.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(notice)}
                      className="w-full text-left bg-[#FEF5F2] border border-[#FADCD0] rounded-md p-4 hover:bg-[#FDECE4] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="bg-[#D9531E] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
                          공지사항
                        </span>
                        <span className="text-[11.5px] text-[#8A8478] tabular-nums">
                          {formatDate(notice.created_at)}
                        </span>
                      </div>
                      <p className="font-bold text-[#0E1A2B] text-[14.5px] line-clamp-2 flex items-center gap-1.5">
                        <Icon
                          d={ICON.bell}
                          className="w-4 h-4 text-[#D9531E] shrink-0"
                        />
                        <span>{notice.category}</span>
                      </p>
                    </button>
                  </li>
                ))}
              {currentItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="w-full text-left bg-white border border-[#E4E0D8] rounded-md p-4 hover:border-[#0E1A2B] transition-colors shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${typeStyle(
                          item.inquiry_type
                        )}`}
                      >
                        {getInquiryTypeLabel(item.inquiry_type)}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="font-bold text-[#0E1A2B] text-[14.5px] line-clamp-2 flex items-center gap-1.5">
                      {!isAdmin && (
                        <Icon
                          d={ICON.lock}
                          className="w-3.5 h-3.5 text-[#8A8478] shrink-0"
                        />
                      )}
                      <span>{rowTitle(item)}</span>
                      {hasImages(item) && (
                        <Icon
                          d={ICON.image}
                          className="w-4 h-4 text-[#8A8478] shrink-0"
                        />
                      )}
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-[#F2EFE9] flex items-center justify-between text-[12px] text-[#8A8478]">
                      <span className="font-medium text-[#4B5260]">
                        {item.masked_name || maskName(item.name)}
                      </span>
                      <span className="tabular-nums">
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>

        {/* 에러 및 빈 목록 상태 안내 복구 */}
        {!isLoading && loadError && (
          <div className="mt-6 py-14 text-center bg-white rounded-md border border-[#E4E0D8]">
            <p className="text-[#0E1A2B] font-bold mb-4">
              문의 목록을 불러오지 못했습니다.
            </p>
            <button
              type="button"
              onClick={loadData}
              className="hb-btn-primary h-10 px-5 text-[13.5px]"
            >
              다시 시도
            </button>
          </div>
        )}

        {!isLoading &&
          !loadError &&
          currentItems.length === 0 &&
          (!showNotices || noticeList.length === 0) && (
            <div className="mt-6 py-16 text-center bg-white rounded-md border border-[#E4E0D8] text-[14px]">
              <p className="text-[#0E1A2B] font-bold mb-1 text-[16px]">
                {keyword.trim()
                  ? "검색 조건에 맞는 문의글이 없습니다."
                  : "아직 등록된 문의 내역이 없습니다."}
              </p>
              <p className="text-[#6B7280]">
                궁금하신 점이나 매입 견적 문의를 남겨주시면 빠르게 안내해 드립니다.
              </p>
              <button
                type="button"
                onClick={handleOpenWrite}
                className="hb-btn-primary mt-5 h-10 px-5 text-[13.5px]"
              >
                첫 문의 · 매입 신청 남기기
              </button>
            </div>
          )}

        {totalPages > 1 && !isLoading && (
          <nav
            className="flex justify-center items-center gap-1.5 mt-8"
            aria-label="페이지 이동"
          >
            <button
              type="button"
              onClick={() => goPage(Math.max(safePage - 1, 1))}
              disabled={safePage === 1}
              aria-label="이전 페이지"
              className="w-9 h-9 flex items-center justify-center rounded border border-[#DDD9D1] bg-white text-[#4B5260] disabled:opacity-30"
            >
              <Icon d={ICON.left} className="w-4 h-4" />
            </button>
            {pageWindow(safePage, totalPages).map((p, i) =>
              p === "…" ? (
                <span key={`e${i}`} className="w-6 text-center text-[#8A8478]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  type="button"
                  onClick={() => goPage(p)}
                  className={`w-9 h-9 rounded text-[13.5px] font-semibold ${
                    safePage === p
                      ? "bg-[#0E1A2B] text-white"
                      : "border border-[#DDD9D1] bg-white text-[#4B5260]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              type="button"
              onClick={() => goPage(Math.min(safePage + 1, totalPages))}
              disabled={safePage === totalPages}
              aria-label="다음 페이지"
              className="w-9 h-9 flex items-center justify-center rounded border border-[#DDD9D1] bg-white text-[#4B5260] disabled:opacity-30"
            >
              <Icon d={ICON.right} className="w-4 h-4" />
            </button>
          </nav>
        )}
      </main>

      <SiteFooter
        isAdmin={isAdmin}
        onAdminClick={() =>
          isAdmin ? handleAdminLogout() : setIsAdminAuthModalOpen(true)
        }
      />
      <MobileCtaBar onInquiryClick={handleOpenWrite} />

      {/* 글쓰기 모달 */}
      {isWriteOpen && (
        <Modal
          label="문의 및 매입 신청 작성"
          onClose={() => setIsWriteOpen(false)}
          panelClassName="max-w-2xl"
        >
          <div className="bg-white max-h-[92vh] overflow-y-auto rounded-lg shadow-2xl border border-[#E4E0D8] w-full">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E0D8] sticky top-0 bg-white z-10">
              <h2 className="text-[18px] font-bold text-[#0E1A2B]">
                문의 · 매입 신청 작성
              </h2>
              <button
                type="button"
                onClick={() => setIsWriteOpen(false)}
                className="grid h-8 w-8 place-items-center text-[#6B7280] hover:text-[#0E1A2B]"
                aria-label="닫기"
              >
                <Icon d={ICON.close} className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <UnifiedInquiryForm
                defaultType={writeDefaultType}
                linkedProduct={linkedProduct}
                isAdmin={isAdmin}
                allowNoticeToggle={isAdmin}
                onSuccess={() => {
                  loadData();
                }}
                onCancel={() => setIsWriteOpen(false)}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* 비밀번호 확인 모달 (비밀번호 표시 체크박스 복구 완료) */}
      {isPwModalOpen && (
        <Modal
          label="비밀글 열람"
          onClose={() => setIsPwModalOpen(false)}
          panelClassName="max-w-sm"
        >
          <div className="bg-white rounded-lg shadow-xl border border-[#E4E0D8] p-6 sm:p-8 text-center w-full">
            <h3 className="font-bold text-[#0E1A2B] text-[18px] mb-1.5">
              비밀글 열람
            </h3>
            <p className="text-[13px] text-[#6B7280] mb-5">
              작성 시 설정하신 조회용 비밀번호를 입력해 주세요.
            </p>
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div>
                <input
                  type={showVerifyPassword ? "text" : "password"}
                  value={inputPw}
                  onChange={(e) => setInputPw(e.target.value)}
                  placeholder="비밀번호 입력"
                  required
                  autoFocus
                  className="hb-input text-center tracking-widest"
                />
                <label className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[#6B7280] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showVerifyPassword}
                    onChange={(e) => setShowVerifyPassword(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#0E1A2B]"
                  />
                  <span>비밀번호 문자 표시</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPwModalOpen(false)}
                  className="hb-btn-outline w-1/2 h-11 text-[14px]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPw}
                  className="hb-btn-primary w-1/2 h-11 text-[14px]"
                >
                  {isVerifyingPw ? "확인 중..." : "확인"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* 상세 보기 모달 (관리자 빠른 답변 템플릿 추가) */}
      {isDetailOpen && selectedItem && (
        <Modal
          label="문의 상세"
          onClose={() => setIsDetailOpen(false)}
          panelClassName="max-w-2xl"
        >
          <div className="bg-white rounded-lg shadow-2xl border border-[#E4E0D8] max-h-[90vh] flex flex-col w-full overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between bg-[#0E1A2B] text-white">
              <span className="text-[12px] font-bold bg-white/15 px-2.5 py-1 rounded-sm">
                {getInquiryTypeLabel(selectedItem.inquiry_type)}
              </span>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                aria-label="닫기"
              >
                <Icon d={ICON.close} className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-[14.5px]">
              <div className="border-b border-[#E4E0D8] pb-4">
                <h2 className="text-[20px] font-bold text-[#0E1A2B] mb-2">
                  {selectedItem.category}
                </h2>
                <div className="flex flex-wrap gap-4 text-[13px] text-[#6B7280]">
                  <span>
                    작성자:{" "}
                    <strong className="text-[#0E1A2B]">
                      {isAdmin || selectedItem.is_notice
                        ? selectedItem.name
                        : maskName(selectedItem.name)}
                    </strong>
                  </span>
                  {isAdmin && selectedItem.phone && (
                    <span>
                      연락처:{" "}
                      <a
                        href={telHref(selectedItem.phone)}
                        className="font-bold text-[#0E1A2B] underline"
                      >
                        {selectedItem.phone}
                      </a>
                    </span>
                  )}
                  <span>
                    진행상태:{" "}
                    <strong className="text-[#D9531E]">
                      {selectedItem.status || "접수"}
                    </strong>
                  </span>
                </div>
              </div>

              {selectedItem.description && (
                <div className="bg-[#FAF9F7] p-4 rounded-md border border-[#E4E0D8] whitespace-pre-wrap leading-relaxed">
                  {selectedItem.description}
                </div>
              )}

              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="grid grid-cols-3 gap-2.5">
                  {selectedItem.images.map((imgUrl, idx) => (
                    <button
                      key={imgUrl + idx}
                      type="button"
                      onClick={() => setEnlargedImage(imgUrl)}
                      className="aspect-square rounded overflow-hidden border border-[#E4E0D8] bg-[#EFECE6]"
                    >
                      <SafeImg
                        src={imgUrl}
                        alt={`첨부사진 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {selectedItem.admin_reply && (
                <div className="bg-[#FEF5F2] rounded-md p-5 border border-[#FDECE4]">
                  <h3 className="font-bold text-[#0E1A2B] text-[14px] mb-2">
                    {STORE.name} 공식 답변
                  </h3>
                  <p className="text-[14px] text-[#4B5260] whitespace-pre-wrap leading-relaxed">
                    {selectedItem.admin_reply}
                  </p>
                </div>
              )}

              {!selectedItem.is_notice && isAdmin && (
                <div className="bg-[#FAF9F7] rounded-md p-4 border border-[#E4E0D8] space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-[13px] font-bold text-[#0E1A2B]">
                      진행 상태 명시적 변경
                    </label>
                    <select
                      value={selectedItem.status || "접수"}
                      onChange={(e) =>
                        handleStatusUpdate(selectedItem.id, e.target.value)
                      }
                      className="rounded border border-[#DDD9D1] bg-white px-3 py-1.5 text-[13px] font-bold text-[#0E1A2B]"
                    >
                      {INQUIRY_ADMIN_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label} — {opt.desc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 자주 쓰는 답변 템플릿 버튼 */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11.5px] font-bold text-[#6B7280] mr-1">
                      빠른 답변 템플릿:
                    </span>
                    {REPLY_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => setReplyContent(tpl.text)}
                        className="rounded border border-[#DDD9D1] bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#0E1A2B] hover:border-[#0E1A2B]"
                      >
                        + {tpl.label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={3}
                    placeholder="고객에게 남길 답변 내용을 입력해 주세요."
                    className="hb-input text-[13.5px]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleReplySubmit}
                      disabled={isReplying}
                      className="hb-btn-primary h-10 px-5 text-[13px]"
                    >
                      {isReplying ? "저장 중..." : "답변 저장 및 답변완료 처리"}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#E4E0D8]">
                <div className="flex gap-2">
                  {canManage && (
                    <>
                      <button
                        type="button"
                        onClick={handleOpenEdit}
                        className="hb-btn-outline h-10 px-4 text-[13px]"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="rounded border border-red-200 bg-red-50 px-4 h-10 text-[13px] font-bold text-red-600"
                      >
                        삭제
                      </button>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="hb-btn-primary h-10 px-6 text-[13px]"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 게시글 수정 모달 */}
      {isEditOpen && (
        <Modal
          label="게시글 수정"
          onClose={() => setIsEditOpen(false)}
          panelClassName="max-w-lg"
        >
          <form
            onSubmit={handleEditSubmit}
            className="bg-white rounded-lg p-6 shadow-2xl border border-[#E4E0D8] space-y-4"
          >
            <h3 className="text-[18px] font-bold text-[#0E1A2B]">
              게시글 수정
            </h3>
            <div>
              <label className="hb-label">제목</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="hb-input mt-1"
              />
            </div>
            <div>
              <label className="hb-label">내용</label>
              <textarea
                rows={5}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                required
                className="hb-input mt-1"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="hb-btn-outline h-10 px-5 text-[13.5px]"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={editUpdating}
                className="hb-btn-primary h-10 px-6 text-[13.5px]"
              >
                {editUpdating ? "수정 중..." : "수정 완료"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4"
        >
          <SafeImg
            src={enlargedImage}
            alt="확대 이미지"
            eager
            className="max-w-full max-h-[88vh] object-contain"
          />
        </div>
      )}

      {isAdminAuthModalOpen && (
        <Modal
          label="관리자 로그인"
          onClose={() => setIsAdminAuthModalOpen(false)}
          panelClassName="max-w-sm"
        >
          <form
            onSubmit={handleAdminAuth}
            className="bg-white rounded-lg p-6 shadow-2xl border border-[#E4E0D8] space-y-4"
          >
            <h3 className="text-[18px] font-bold text-[#0E1A2B]">
              관리자 로그인
            </h3>
            <input
              type="email"
              required
              placeholder="관리자 이메일"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="hb-input"
            />
            <input
              type="password"
              required
              placeholder="비밀번호"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="hb-input"
            />
            <button
              type="submit"
              disabled={isLoggingIn}
              className="hb-btn-primary h-11 w-full text-[14px]"
            >
              {isLoggingIn ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
