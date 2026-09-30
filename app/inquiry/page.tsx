"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import {
  STORE, telHref, formatPhone, isValidPhone, maskName, splitImages,
  compressImage, validateImageFiles, MAX_PHOTOS,
} from "../../lib/site";
import {
  Icon, ICON, SafeImg, Modal, SiteHeader, SiteFooter, MobileCtaBar,
} from "../../lib/ui";

/* ════════════════════════════════════════════════════════════
   1. 타입 및 상수
   ════════════════════════════════════════════════════════════ */
interface Inquiry {
  id: string;
  name: string | null;
  phone: string | null;
  password: string | null;
  inquiry_type: string | null;
  category: string | null;
  description: string | null;
  images: string[] | null;
  is_notice: boolean | null;
  status: string | null;
  admin_reply: string | null;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;
const TABS = ["전체", "구매 문의", "내 물건 팔기", "기타 문의"] as const;
type Tab = (typeof TABS)[number];

const isSell = (t?: string | null) => t === "내 물건 팔기" || t === "내 물건팔기" || t === "매입문의";
const isBuy = (t?: string | null) => t === "구매 문의" || t === "구매문의";
const typeLabel = (t?: string | null) => (isSell(t) ? "내 물건 팔기" : isBuy(t) ? "구매 문의" : t || "기타 문의");

// 💡 새로운 프리미엄 뱃지 스타일
const typeStyle = (t?: string | null) =>
  isSell(t) ? "bg-[#FBE9E1] text-[#B5431A]" : isBuy(t) ? "bg-[#E8ECF2] text-[#0E1A2B]" : "bg-[#F0EDE7] text-[#4B5260]";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() === new Date().getFullYear() ? `${mm}-${dd}` : `${String(d.getFullYear()).slice(2)}-${mm}-${dd}`;
};

// 💡 공용 디자인 토큰
const BTN = "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
const BTN_ACCENT = `${BTN} bg-[#D9531E] text-white hover:bg-[#BF4715] focus-visible:ring-[#D9531E]`;
const BTN_NAVY = `${BTN} bg-[#0E1A2B] text-white hover:bg-[#22324A] focus-visible:ring-[#0E1A2B]`;
const BTN_LINE = `${BTN} border border-[#0E1A2B]/15 bg-white text-[#0E1A2B] hover:border-[#0E1A2B]/60 focus-visible:ring-[#0E1A2B]`;
const BTN_KAKAO = `${BTN} bg-[#FEE500] text-[#191600] hover:bg-[#F2D900] focus-visible:ring-[#191600]`;
const INPUT = "w-full rounded-md border border-[#DDD9D1] bg-white px-3.5 py-3 text-[15px] text-[#0E1A2B] placeholder:text-neutral-400 transition-colors focus:border-[#0E1A2B] focus:outline-none focus:ring-1 focus:ring-[#0E1A2B]";
const LABEL = "mb-1.5 block text-[13px] font-semibold text-[#0E1A2B]";

function StatusBadge({ status, notice }: { status: string | null; notice?: boolean }) {
  if (notice) return <span className="text-neutral-400">-</span>;
  const done = status === "답변완료";
  return (
    <span className={`inline-block px-2.5 py-1 rounded-[4px] text-[11px] font-bold whitespace-nowrap ${done ? "bg-[#0E1A2B] text-white" : "bg-[#F0EDE7] text-[#4B5260]"}`}>
      {status || "접수"}
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

/* ════════════════════════════════════════════════════════════
   2. 메인 게시판 컴포넌트
   ════════════════════════════════════════════════════════════ */
export default function InquiryBoardPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("전체");
  const [keyword, setKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);

  /* 글쓰기 */
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [inquiryType, setInquiryType] = useState("내 물건 팔기");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showWritePassword, setShowWritePassword] = useState(false);
  const [isNotice, setIsNotice] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /* 상세 / 비밀번호 / 수정 */
  const [selectedItem, setSelectedItem] = useState<Inquiry | null>(null);
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
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

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(false);
    const { data, error } = await supabase.from("purchase_requests").select("*").order("created_at", { ascending: false });
    if (error) { console.error(error); setLoadError(true); }
    else if (data) setInquiries(data as Inquiry[]);
    setIsLoading(false);
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkSession();
    const { data: authListener } = supabase.auth.onAuthStateChange((_e, session) => setIsAdmin(!!session));
    loadData();
    return () => authListener.subscription.unsubscribe();
  }, []);

  /* ───── 목록 계산 ───── */
  const noticeList = useMemo(() => inquiries.filter((i) => i.is_notice), [inquiries]);
  const regularList = useMemo(() => inquiries.filter((i) => !i.is_notice), [inquiries]);

  const tabCounts = useMemo(() => ({
    전체: regularList.length,
    "구매 문의": regularList.filter((i) => isBuy(i.inquiry_type)).length,
    "내 물건 팔기": regularList.filter((i) => isSell(i.inquiry_type)).length,
    "기타 문의": regularList.filter((i) => !isBuy(i.inquiry_type) && !isSell(i.inquiry_type)).length,
  }), [regularList]);
  const countOf = (tab: Tab) => (tab === "내 물건 팔기" ? tabCounts["내 물건 팔기"] : tabCounts[tab as keyof typeof tabCounts] || 0);

  const filteredList = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return regularList.filter((item) => {
      const tabOk =
        activeTab === "전체" ||
        (activeTab === "구매 문의" && isBuy(item.inquiry_type)) ||
        (activeTab === "내 물건 팔기" && isSell(item.inquiry_type)) ||
        (activeTab === "기타 문의" && !isBuy(item.inquiry_type) && !isSell(item.inquiry_type));
      return tabOk && (!q || (item.category || "").toLowerCase().includes(q));
    });
  }, [regularList, activeTab, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const currentItems = filteredList.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  const showNotices = noticeList.length > 0 && !keyword.trim() && activeTab === "전체";

  const goPage = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ───── 열람 / 비밀번호 ───── */
  const handleItemClick = (item: Inquiry) => {
    setSelectedItem(item);
    setInputPw("");
    setShowVerifyPassword(false);
    setReplyContent(item.admin_reply || "");
    if (item.is_notice || isAdmin) setIsDetailOpen(true);
    else setIsPwModalOpen(true);
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (selectedItem.password && selectedItem.password === inputPw.trim()) {
      setIsPwModalOpen(false);
      setIsDetailOpen(true);
    } else {
      toast.error("비밀번호가 일치하지 않습니다.");
    }
  };

  /* ───── 관리자: 답변 / 상태 ───── */
  const handleReplySubmit = async () => {
    if (!selectedItem) return;
    if (!replyContent.trim()) { toast.error("답변 내용을 입력해 주세요."); return; }
    setIsReplying(true);
    try {
      const { data, error } = await supabase.from("purchase_requests").update({ status: "답변완료", admin_reply: replyContent }).eq("id", selectedItem.id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Supabase 업데이트 권한(RLS)이 차단되어 있습니다.");
      toast.success("답변이 성공적으로 등록되었습니다.");
      setSelectedItem({ ...selectedItem, status: "답변완료", admin_reply: replyContent });
      await loadData();
    } catch (error: any) {
      toast.error("답변 등록 실패: " + error.message);
    } finally {
      setIsReplying(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { data, error } = await supabase.from("purchase_requests").update({ status: newStatus }).eq("id", id).select();
      if (error) throw error;
      if (!data || data.length === 0) throw new Error("Supabase 업데이트 권한(RLS)이 차단되어 있습니다.");
      setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i)));
      setSelectedItem((prev) => (prev ? { ...prev, status: newStatus } : prev));
      toast.success(`상태가 '${newStatus}'(으)로 변경되었습니다.`);
    } catch (err: any) {
      toast.error("상태 업데이트 실패: " + err.message);
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
      if (error) throw error;
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

  /* ───── 글쓰기 / 파일 업로드 ───── */
  const resetFiles = () => {
    filePreviews.forEach((u) => URL.revokeObjectURL(u));
    setSelectedFiles([]);
    setFilePreviews([]);
  };

  const handleOpenWrite = () => {
    setIsNotice(false);
    setInquiryType("내 물건 팔기");
    setShowWritePassword(false);
    setName(isAdmin ? STORE.name : "");
    setPhone(isAdmin ? STORE.tel : "");
    setPassword("");
    setTitle("");
    setContent("");
    resetFiles();
    setAgreed(false);
    setIsWriteOpen(true);
  };

  const closeWrite = () => {
    resetFiles();
    setIsWriteOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    const { ok, error } = validateImageFiles(picked);
    if (error) toast.error(error);
    if (selectedFiles.length + ok.length > MAX_PHOTOS) {
      toast.error(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있습니다.`);
      return;
    }
    setSelectedFiles([...selectedFiles, ...ok]);
    setFilePreviews((prev) => [...prev, ...ok.map((f) => URL.createObjectURL(f))]);
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(filePreviews[index]);
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setFilePreviews(filePreviews.filter((_, i) => i !== index));
  };

  const handleWriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("제목을 입력해 주세요."); return; }
    if (!isNotice) {
      if (!name.trim() || !phone.trim() || !password.trim()) { toast.error("성함, 연락처, 비밀번호를 모두 입력해 주세요."); return; }
      if (!isValidPhone(phone)) { toast.error("연락처를 정확히 입력해 주세요."); return; }
      if (password.trim().length < 4) { toast.error("조회용 비밀번호는 4자 이상 입력해 주세요."); return; }
      if (!agreed) { toast.error("개인정보 수집·이용에 동의해 주세요."); return; }
    }

    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const blob = await compressImage(file);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const { error: uploadError } = await supabase.storage.from("inquiries").upload(fileName, blob, { contentType: "image/jpeg" });
        if (uploadError) throw new Error(`이미지 업로드 실패`);
        const { data } = supabase.storage.from("inquiries").getPublicUrl(fileName);
        if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
      }

      const { error: insertError } = await supabase.from("purchase_requests").insert({
        name: isNotice ? name || STORE.name : name.trim(),
        phone: isNotice ? phone || STORE.tel : phone,
        password: isNotice ? "0000" : password,
        inquiry_type: isNotice ? "공지사항" : inquiryType,
        category: title.trim(),
        region: "대전/기타",
        description: content.trim(),
        images: uploadedUrls,
        is_notice: isNotice,
        status: isNotice ? "공지" : "접수",
      });
      if (insertError) throw insertError;

      if (!isNotice) {
        fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), phone, type: inquiryType, title: title.trim() }),
        }).catch((err) => console.error("알림 전송 실패:", err));
      }

      toast.success(isNotice ? "공지사항이 등록되었습니다." : "문의가 정상적으로 접수되었습니다.");
      closeWrite();
      setCurrentPage(1);
      loadData();
    } catch (err: any) {
      toast.error("오류 발생: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ───── 수정 / 삭제 ───── */
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
    const patch = { category: editTitle, description: editContent, inquiry_type: nextType };
    try {
      setInquiries((prev) => prev.map((i) => (i.id === selectedItem.id ? { ...i, ...patch } : i)));
      const { error } = await supabase.from("purchase_requests").update(patch).eq("id", selectedItem.id);
      if (error) throw error;
      toast.success("성공적으로 수정되었습니다.");
      setSelectedItem({ ...selectedItem, ...patch });
      setIsEditOpen(false);
    } catch (err: any) {
      toast.error("수정 실패: " + err.message);
      loadData();
    } finally {
      setEditUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!confirm("정말 이 글을 삭제하시겠습니까? (복구 불가능)")) return;
    const id = selectedItem.id;
    try {
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      setIsDetailOpen(false);
      const { error } = await supabase.from("purchase_requests").delete().eq("id", id);
      if (error) throw error;
      toast.success("삭제했습니다.");
    } catch (err: any) {
      toast.error("삭제하지 못했습니다.");
      loadData();
    }
  };

  const canManage = !!selectedItem && (isAdmin || !selectedItem.is_notice);
  const rowTitle = (item: Inquiry) => item.category || item.description || "문의드립니다.";
  const hasImages = (item: Inquiry) => !!item.images && item.images.length > 0;

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#1F2530] font-sans flex flex-col">
      
      {/* 프리미엄 헤더 연동 */}
      <SiteHeader>
        {isAdmin && (
          <button type="button" onClick={handleAdminLogout} title="클릭하여 관리자 모드 종료" className="hidden sm:inline-flex bg-red-500/10 text-red-500 border border-red-500/20 text-[12px] font-bold px-3 py-1.5 rounded text-center transition hover:bg-red-500/20 whitespace-nowrap">
            관리자 모드 ON
          </button>
        )}
        <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className={`${BTN_KAKAO} hidden sm:inline-flex h-10 px-3.5 text-[14px]`}>
          <Icon d={ICON.chat} className="w-4 h-4" /> 카톡 상담
        </a>
        <button type="button" onClick={handleOpenWrite} className={`${BTN_NAVY} h-10 px-4 text-[14px]`}>
          문의 글쓰기
        </button>
      </SiteHeader>

      {/* 타이틀 밴드 */}
      <section className="bg-white border-b border-[#E4E0D8]">
        <div className="max-w-[1000px] mx-auto px-5 py-12 sm:py-16 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#D9531E] mb-3">Q&amp;A Board</p>
          <h1 className="text-[28px] sm:text-[36px] font-bold text-[#0E1A2B] mb-4 tracking-[-0.02em]">문의 게시판</h1>
          <p className="text-[15px] text-[#4B5260] leading-relaxed max-w-xl mx-auto break-keep">
            남겨주신 문의는 개인정보 보호를 위해 비밀번호를 입력해야 확인할 수 있습니다. 빠른 상담이 필요하신 경우 전화나 카카오톡을 이용해 주세요.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
            <a href={telHref(STORE.tel)} className={`${BTN_NAVY} h-[46px] px-6 text-[14px]`}>
              <Icon d={ICON.phone} className="w-4 h-4" /> {STORE.tel}
            </a>
            <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className={`${BTN_KAKAO} h-[46px] px-6 text-[14px]`}>
              <Icon d={ICON.chat} className="w-4 h-4" /> 카톡 상담
            </a>
          </div>
        </div>
      </section>

      {/* 메인 리스트 영역 */}
      <main className="max-w-[1100px] mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
        {/* 탭 & 검색 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1" role="tablist">
            {TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button key={tab} type="button" role="tab" aria-selected={active} onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded text-[14px] font-semibold whitespace-nowrap transition-colors border shrink-0 ${active ? "bg-[#0E1A2B] text-white border-[#0E1A2B]" : "bg-white text-[#4B5260] border-[#DDD9D1] hover:bg-[#F6F5F2]"}`}>
                  {tab}<span className={`ml-1.5 text-[12px] font-medium ${active ? "text-white/60" : "text-[#8A8478]"}`}>{countOf(tab)}</span>
                </button>
              );
            })}
          </div>
          <div className="relative w-full sm:w-64 shrink-0">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"><Icon d={ICON.search} className="w-4 h-4" /></span>
            <input type="search" value={keyword} onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }} placeholder="제목 검색" aria-label="제목 검색"
              className="w-full pl-10 pr-3 py-2.5 rounded border border-[#DDD9D1] bg-white text-[14px] text-[#0E1A2B] placeholder:text-neutral-400 outline-none focus:border-[#0E1A2B] focus:ring-1 focus:ring-[#0E1A2B] transition-colors" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 text-[13px] text-[#8A8478]">
          <p>총 <strong className="text-[#0E1A2B]">{filteredList.length}</strong>건{showNotices && <span> (공지 {noticeList.length}건 별도)</span>}</p>
        </div>

        {/* 데스크톱 테이블 */}
        <div className="hidden md:block overflow-hidden rounded-md border border-[#E4E0D8] bg-white shadow-sm">
          <table className="w-full text-[14px] text-center text-[#1F2530]">
            <thead className="bg-[#FAF9F7] text-[#8A8478] text-[13px] font-semibold border-b border-[#E4E0D8]">
              <tr className="h-12">
                <th className="w-20">번호</th><th className="w-28">구분</th><th className="text-left px-5">제목</th>
                <th className="w-28">답변상태</th><th className="w-24">작성자</th><th className="w-24">등록일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EEEBE5]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="h-14 animate-pulse">
                    <td><div className="h-3.5 bg-[#EFECE6] rounded w-6 mx-auto" /></td>
                    <td><div className="h-6 bg-[#EFECE6] rounded w-16 mx-auto" /></td>
                    <td className="px-5"><div className="h-4 bg-[#EFECE6] rounded w-2/3" /></td>
                    <td><div className="h-5 bg-[#EFECE6] rounded w-12 mx-auto" /></td>
                    <td><div className="h-3.5 bg-[#EFECE6] rounded w-10 mx-auto" /></td>
                    <td><div className="h-3.5 bg-[#EFECE6] rounded w-10 mx-auto" /></td>
                  </tr>
                ))
              ) : (
                <>
                  {showNotices && noticeList.map((notice) => (
                    <tr key={notice.id} onClick={() => handleItemClick(notice)} className="bg-[#FEF5F2] hover:bg-[#FDECE4] transition-colors h-14 cursor-pointer">
                      <td><span className="bg-[#D9531E] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">공지</span></td>
                      <td><span className="inline-block px-2.5 py-1 rounded text-[12px] font-semibold text-[#B5431A]">공지사항</span></td>
                      <td className="px-5 text-left">
                        <button type="button" className="flex items-center gap-2 font-bold text-[#0E1A2B] text-left max-w-full">
                          <Icon d={ICON.bell} className="w-4 h-4 text-[#D9531E] shrink-0" />
                          <span className="truncate">{notice.category}</span>
                          {hasImages(notice) && <Icon d={ICON.image} className="w-4 h-4 text-neutral-400 shrink-0" />}
                        </button>
                      </td>
                      <td><StatusBadge status={null} notice /></td>
                      <td className="font-semibold text-[#D9531E]">{notice.name}</td>
                      <td className="text-[#8A8478]">{formatDate(notice.created_at)}</td>
                    </tr>
                  ))}
                  {currentItems.map((item, index) => (
                    <tr key={item.id} onClick={() => handleItemClick(item)} className="hover:bg-[#FAF9F7] transition-colors h-14 cursor-pointer">
                      <td className="text-[#8A8478]">{filteredList.length - ((safePage - 1) * ITEMS_PER_PAGE + index)}</td>
                      <td><span className={`inline-block px-2.5 py-1 rounded text-[12px] font-semibold whitespace-nowrap ${typeStyle(item.inquiry_type)}`}>{typeLabel(item.inquiry_type)}</span></td>
                      <td className="px-5 text-left">
                        <button type="button" className="flex items-center gap-2 font-medium text-[#1F2530] hover:text-[#D9531E] transition-colors text-left max-w-full">
                          {!isAdmin && <Icon d={ICON.lock} className="w-3.5 h-3.5 text-[#8A8478] shrink-0" />}
                          <span className="truncate">{rowTitle(item)}</span>
                          {hasImages(item) && <Icon d={ICON.image} className="w-4 h-4 text-neutral-400 shrink-0" />}
                        </button>
                      </td>
                      <td><StatusBadge status={item.status} /></td>
                      <td className="text-[#4B5260]">{maskName(item.name)}</td>
                      <td className="text-[#8A8478] text-[13px]">{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* 모바일 리스트 */}
        <ul className="md:hidden space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <li key={`msk-${i}`} className="h-28 bg-white rounded-md border border-[#E4E0D8] animate-pulse" />)
          ) : (
            <>
              {showNotices && noticeList.map((notice) => (
                <li key={notice.id}>
                  <button type="button" onClick={() => handleItemClick(notice)} className="w-full text-left bg-[#FEF5F2] border border-[#FDECE4] rounded-md p-5 hover:bg-[#FDECE4] transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-[#D9531E] text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">공지</span>
                      <span className="text-[12px] text-[#8A8478]">{formatDate(notice.created_at)}</span>
                    </div>
                    <p className="font-bold text-[#0E1A2B] text-[15px] line-clamp-2 flex items-start gap-1.5"><Icon d={ICON.bell} className="w-4 h-4 text-[#D9531E] shrink-0 mt-0.5" />{notice.category}</p>
                  </button>
                </li>
              ))}
              {currentItems.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => handleItemClick(item)} className="w-full text-left bg-white border border-[#E4E0D8] rounded-md p-5 hover:border-[#0E1A2B] transition-colors shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2.5 py-1 rounded text-[11px] font-semibold ${typeStyle(item.inquiry_type)}`}>{typeLabel(item.inquiry_type)}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="font-semibold text-[#0E1A2B] text-[15px] line-clamp-2 flex items-start gap-1.5 mb-3">
                      {!isAdmin && <Icon d={ICON.lock} className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-1" />}
                      <span>{rowTitle(item)}</span>
                      {hasImages(item) && <Icon d={ICON.image} className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />}
                    </p>
                    <div className="flex items-center justify-between text-[12px] text-[#8A8478]">
                      <span>{maskName(item.name)}</span><span>{formatDate(item.created_at)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </>
          )}
        </ul>

        {/* 상태 메시지 */}
        {!isLoading && loadError && (
          <div className="mt-6 py-14 text-center bg-white rounded-md border border-[#E4E0D8]">
            <p className="text-[#0E1A2B] font-bold mb-4">문의 목록을 불러오지 못했습니다.</p>
            <button type="button" onClick={loadData} className={`${BTN_NAVY} h-10 px-5 text-[14px]`}>다시 시도</button>
          </div>
        )}
        {!isLoading && !loadError && currentItems.length === 0 && (
          <div className="mt-6 py-16 text-center bg-white rounded-md border border-[#E4E0D8] text-[14px]">
            <p className="text-[#4B5260] font-medium mb-1">{keyword.trim() ? "검색 결과가 없습니다." : "등록된 문의 내역이 없습니다."}</p>
            <p className="text-neutral-400">첫 문의를 남겨주시면 빠르게 확인하고 연락드립니다.</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && !isLoading && (
          <nav className="flex justify-center gap-1.5 mt-10" aria-label="페이지 이동">
            <button type="button" onClick={() => goPage(Math.max(safePage - 1, 1))} disabled={safePage === 1} aria-label="이전 페이지"
              className="w-9 h-9 flex items-center justify-center rounded border border-[#DDD9D1] bg-white text-[#4B5260] hover:bg-[#F6F5F2] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Icon d={ICON.left} className="w-4 h-4" />
            </button>
            {pageWindow(safePage, totalPages).map((p, i) =>
              p === "…" ? <span key={`e${i}`} className="w-6 flex items-center justify-center text-neutral-400">…</span> : (
                <button key={p} type="button" onClick={() => goPage(p)} aria-current={safePage === p ? "page" : undefined}
                  className={`w-9 h-9 flex items-center justify-center rounded text-[14px] font-semibold transition-colors ${safePage === p ? "bg-[#0E1A2B] text-white" : "border border-[#DDD9D1] bg-white text-[#4B5260] hover:bg-[#F6F5F2]"}`}>
                  {p}
                </button>
              )
            )}
            <button type="button" onClick={() => goPage(Math.min(safePage + 1, totalPages))} disabled={safePage === totalPages} aria-label="다음 페이지"
              className="w-9 h-9 flex items-center justify-center rounded border border-[#DDD9D1] bg-white text-[#4B5260] hover:bg-[#F6F5F2] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <Icon d={ICON.right} className="w-4 h-4" />
            </button>
          </nav>
        )}
      </main>

      <SiteFooter isAdmin={isAdmin} onAdminClick={() => (isAdmin ? handleAdminLogout() : setIsAdminAuthModalOpen(true))} />
      <MobileCtaBar />

      {/* ───── 비밀번호 확인 모달 ───── */}
      {isPwModalOpen && (
        <Modal label="비밀글 열람" onClose={() => setIsPwModalOpen(false)} sheet={false} panelClassName="max-w-sm">
          <div className="bg-white rounded-lg shadow-xl border border-[#E4E0D8] p-6 sm:p-8 text-center w-full">
            <div className="w-12 h-12 bg-[#F6F5F2] rounded-full flex items-center justify-center mx-auto mb-4 text-[#8A8478]"><Icon d={ICON.lock} className="w-5 h-5" /></div>
            <h3 className="font-bold text-[#0E1A2B] text-[18px] mb-1.5">비밀글 열람</h3>
            <p className="text-[13px] text-[#6B7280] mb-6">작성 시 등록하신 조회 비밀번호를 입력해 주세요.</p>
            <form onSubmit={handleVerifyPassword} className="space-y-4 text-left">
              <div>
                <input type={showVerifyPassword ? "text" : "password"} value={inputPw} onChange={(e) => setInputPw(e.target.value)} placeholder="비밀번호 입력" required autoFocus autoComplete="off"
                  className={`${INPUT} text-center tracking-widest`} />
                <label className="flex items-center justify-center gap-1.5 mt-2.5 text-[12px] text-[#6B7280] cursor-pointer select-none">
                  <input type="checkbox" checked={showVerifyPassword} onChange={(e) => setShowVerifyPassword(e.target.checked)} className="w-4 h-4 rounded accent-[#0E1A2B]" /> 비밀번호 표시
                </label>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsPwModalOpen(false)} className={`${BTN_LINE} w-1/2 h-12 text-[14px]`}>취소</button>
                <button type="submit" className={`${BTN_NAVY} w-1/2 h-12 text-[14px]`}>확인</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ───── 상세 내용 모달 ───── */}
      {isDetailOpen && selectedItem && (
        <Modal label={`${selectedItem.category || "문의"} 상세`} onClose={() => setIsDetailOpen(false)} panelClassName="sm:max-w-2xl">
          <div className="bg-white rounded-t-lg sm:rounded-lg shadow-2xl border border-[#E4E0D8] max-h-[92vh] flex flex-col w-full overflow-hidden">
            <div className={`px-6 py-5 flex items-center justify-between text-white ${selectedItem.is_notice ? "bg-[#D9531E]" : "bg-[#0E1A2B]"}`}>
              <span className="text-[12px] font-bold bg-white/20 px-2.5 py-1 rounded-sm">{selectedItem.is_notice ? "공지사항" : typeLabel(selectedItem.inquiry_type)}</span>
              <button type="button" onClick={() => setIsDetailOpen(false)} aria-label="닫기" className="text-white/80 hover:text-white transition-colors"><Icon d={ICON.close} className="w-6 h-6" /></button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-[15px] bg-white">
              <div className="border-b border-[#E4E0D8] pb-5">
                <h2 className="text-[20px] sm:text-[22px] font-bold text-[#0E1A2B] mb-3 break-words leading-snug">{selectedItem.category || "문의 내용"}</h2>
                <div className="flex flex-wrap gap-y-2 gap-x-5 text-[#8A8478] text-[13px]">
                  <span>작성자 <strong className="text-[#0E1A2B] font-semibold">{isAdmin || selectedItem.is_notice ? selectedItem.name : maskName(selectedItem.name)}</strong></span>
                  {isAdmin && selectedItem.phone && (
                    <span>연락처 <a href={telHref(selectedItem.phone)} className="font-semibold text-[#0E1A2B] underline">{selectedItem.phone}</a></span>
                  )}
                  <span>등록일 {new Date(selectedItem.created_at).toLocaleDateString("ko-KR")}</span>
                  {!selectedItem.is_notice && <span>진행상태 <strong className="text-[#D9531E] font-semibold">{selectedItem.status || "접수"}</strong></span>}
                </div>
              </div>

              <div className="bg-[#FAF9F7] p-5 sm:p-6 rounded-md text-[#4B5260] leading-[1.8] whitespace-pre-wrap min-h-[120px] border border-[#EEEBE5] break-words">
                {selectedItem.description || "등록된 상세 내용이 없습니다."}
              </div>

              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-bold text-[#0E1A2B] mb-3 flex items-center gap-1.5 text-[14px]"><Icon d={ICON.image} className="w-4 h-4 text-neutral-400" /> 첨부 사진 ({selectedItem.images.length}장)</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedItem.images.map((imgUrl, idx) => (
                      <button key={imgUrl + idx} type="button" onClick={() => setEnlargedImage(imgUrl)} aria-label={`첨부사진 ${idx + 1} 크게 보기`}
                        className="aspect-square bg-[#EFECE6] rounded-md overflow-hidden border border-[#E4E0D8] group relative">
                        <SafeImg src={imgUrl} alt={`첨부사진 ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.admin_reply && !isAdmin && (
                <div className="bg-[#FEF5F2] rounded-md p-6 border border-[#FDECE4] mt-2">
                  <h3 className="font-bold text-[#0E1A2B] flex items-center gap-2 mb-3 text-[15px]">
                    <span className="bg-[#0E1A2B] text-white w-6 h-6 rounded-full flex items-center justify-center text-[11px]">한밭</span>
                    {STORE.name} 답변
                  </h3>
                  <div className="text-[14px] text-[#4B5260] leading-relaxed whitespace-pre-wrap sm:pl-8 break-words">{selectedItem.admin_reply}</div>
                </div>
              )}

              {!selectedItem.is_notice && isAdmin && (
                <>
                  <div className="bg-[#FAF9F7] rounded-md p-5 sm:p-6 border border-[#E4E0D8] mt-6">
                    <h3 className="font-bold text-[#0E1A2B] mb-3 text-[14px]">관리자 답변 달기</h3>
                    <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={4} placeholder="고객에게 남길 답변을 작성해 주세요."
                      className={`${INPUT} resize-y leading-relaxed mb-4`} />
                    <div className="flex justify-end">
                      <button type="button" onClick={handleReplySubmit} disabled={isReplying} className={`${BTN_NAVY} px-6 h-11 text-[14px] disabled:opacity-50`}>
                        {isReplying ? "등록 중..." : "답변 저장 (상태 자동 변경)"}
                      </button>
                    </div>
                  </div>
                  <div className="bg-white border border-[#E4E0D8] rounded-md p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <span className="text-[13px] font-bold text-[#4B5260]">수동 상태 변경</span>
                    <div className="flex gap-2">
                      {["접수", "답변완료"].map((s) => (
                        <button key={s} type="button" onClick={() => handleStatusUpdate(selectedItem.id, s)}
                          className={`px-4 py-2 rounded text-[13px] font-semibold transition-colors ${selectedItem.status === s ? "bg-[#0E1A2B] text-white" : "bg-white border border-[#DDD9D1] text-[#4B5260] hover:bg-[#F6F5F2]"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-[#E4E0D8] mt-6">
                <div className="flex gap-2">
                  {canManage && (
                    <>
                      <button type="button" onClick={handleOpenEdit} className={`${BTN_LINE} px-4 h-10 text-[13px]`}>게시글 수정</button>
                      <button type="button" onClick={handleDelete} className={`${BTN} border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 px-4 h-10 text-[13px]`}>삭제</button>
                    </>
                  )}
                </div>
                <button type="button" onClick={() => setIsDetailOpen(false)} className={`${BTN_NAVY} px-6 h-10 text-[13px]`}>창 닫기</button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ───── 글쓰기 / 수정 모달창 ───── */}
      {(isWriteOpen || isEditOpen) && (
        <Modal label={isWriteOpen ? (isNotice ? "공지사항 등록" : "문의글 작성") : "게시글 수정"} onClose={isWriteOpen ? closeWrite : () => setIsEditOpen(false)} panelClassName="sm:max-w-xl">
          <div className="bg-white max-h-[92vh] overflow-y-auto rounded-t-lg sm:rounded-lg shadow-2xl w-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E0D8] sticky top-0 bg-white z-10">
              <h2 className="text-[18px] font-bold text-[#0E1A2B]">{isWriteOpen ? (isNotice ? "공지사항 등록" : "문의글 작성하기") : "게시글 수정"}</h2>
              <button type="button" onClick={isWriteOpen ? closeWrite : () => setIsEditOpen(false)} className="grid h-8 w-8 place-items-center text-neutral-500 hover:text-[#0E1A2B]" aria-label="닫기">
                <Icon d={ICON.close} className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={isWriteOpen ? handleWriteSubmit : handleEditSubmit} className="p-6 sm:p-8 space-y-6">
              {isWriteOpen && isAdmin && (
                <label className="bg-[#FEF5F2] border border-[#FDECE4] rounded-md p-4 flex items-center justify-between cursor-pointer group">
                  <span>
                    <span className="font-bold text-[#B5431A] block text-[14px]">최상단 고정 공지사항</span>
                    <span className="text-[12px] text-[#D9531E] mt-0.5 block">체크 시 모든 탭 상단에 고정 표시됩니다.</span>
                  </span>
                  <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} className="w-5 h-5 accent-[#D9531E] cursor-pointer" />
                </label>
              )}

              {(!isNotice || isEditOpen) && (
                <fieldset>
                  <legend className={LABEL}>문의 구분 *</legend>
                  <div className="grid grid-cols-3 gap-1.5 bg-[#F6F5F2] p-1.5 rounded-md">
                    {["내 물건 팔기", "구매 문의", "기타 문의"].map((type) => (
                      <button type="button" key={type} onClick={() => isEditOpen ? setEditInquiryType(type) : setInquiryType(type)} aria-pressed={(isEditOpen ? editInquiryType : inquiryType) === type}
                        className={`py-2.5 rounded font-semibold transition-colors text-[14px] ${((isEditOpen ? editInquiryType : inquiryType) === type) ? "bg-white text-[#0E1A2B] shadow-sm" : "text-[#6B7280] hover:text-[#0E1A2B]"}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              {isWriteOpen && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="w-name" className={LABEL}>작성자 {isNotice ? "(공지표시명)" : "*"}</label>
                      <input id="w-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={isNotice ? STORE.name : "성함을 입력하세요"} required={!isNotice} autoComplete="name" className={INPUT} />
                    </div>
                    <div>
                      <label htmlFor="w-phone" className={LABEL}>연락처 {isNotice ? "(안내용)" : "*"}</label>
                      <input id="w-phone" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder={isNotice ? STORE.tel : "010-0000-0000"} required={!isNotice} autoComplete="tel" className={INPUT} />
                    </div>
                  </div>

                  {!isNotice && (
                    <div>
                      <label htmlFor="w-pw" className={LABEL}>조회용 비밀번호 *</label>
                      <input id="w-pw" type={showWritePassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="게시글 열람용 (숫자 4자리 이상)" required minLength={4} autoComplete="new-password" className={INPUT} />
                      <label className="flex items-center gap-1.5 mt-2 text-[12px] text-slate-500 cursor-pointer select-none">
                        <input type="checkbox" checked={showWritePassword} onChange={(e) => setShowWritePassword(e.target.checked)} className="w-4 h-4 rounded accent-[#0E1A2B]" /> 문자 표시
                      </label>
                    </div>
                  )}
                </>
              )}

              <div>
                <label htmlFor="w-title" className={LABEL}>{isNotice ? "공지 제목 *" : "제목 *"}</label>
                <input id="w-title" type="text" value={isWriteOpen ? title : editTitle} onChange={(e) => isWriteOpen ? setTitle(e.target.value) : setEditTitle(e.target.value)} required className={INPUT}
                  placeholder={isNotice ? "예: 매장 휴무 안내" : "문의 제목을 입력해 주세요."} />
              </div>

              <div>
                <label htmlFor="w-content" className={LABEL}>{isNotice ? "상세 내용 *" : "문의 내용 *"}</label>
                <textarea id="w-content" rows={5} value={isWriteOpen ? content : editContent} onChange={(e) => isWriteOpen ? setContent(e.target.value) : setEditContent(e.target.value)} required className={`${INPUT} resize-y leading-relaxed`}
                  placeholder={isNotice ? "내용을 작성해 주세요." : "제품 상태, 방문 희망 일정 등을 자세히 적어주세요."} />
              </div>

              {isWriteOpen && (
                <div>
                  <p className={LABEL}>사진 <span className="font-normal text-[#8A8478]">(최대 {MAX_PHOTOS}장)</span></p>
                  <div className="flex flex-wrap gap-2">
                    {filePreviews.map((preview, index) => (
                      <div key={preview} className="relative aspect-square w-20 rounded overflow-hidden bg-[#EFECE6] border border-[#DDD9D1]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt={`첨부 사진 ${index + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleRemoveFile(index)} aria-label="사진 삭제" className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full w-5 h-5 flex items-center justify-center transition">
                          <Icon d={ICON.close} className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {selectedFiles.length < MAX_PHOTOS && (
                      <label className="flex aspect-square w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-[#CFCAC0] text-[11px] font-medium text-[#8A8478] transition-colors hover:border-[#0E1A2B] hover:text-[#0E1A2B]">
                        <Icon d={ICON.image} className="h-5 w-5" />
                        사진 추가
                        <input type="file" accept="image/*" multiple onChange={handleFileChange} className="sr-only" />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {isWriteOpen && !isNotice && (
                <label className="flex items-start gap-2.5 pt-2 text-[13px] leading-relaxed text-[#4B5260] cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#0E1A2B]" />
                  <span>
                    상담을 위해 이름·연락처·문의 내용을 수집하며, 상담 완료 후 관련 법령에 따라 처리합니다. <a href="/privacy" target="_blank" className="underline font-bold text-[#0E1A2B]">개인정보 수집·이용</a>에 동의합니다. *
                  </span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-6 border-t border-[#E4E0D8]">
                <button type="button" onClick={isWriteOpen ? closeWrite : () => setIsEditOpen(false)} className={`${BTN_LINE} px-6 h-12 text-[15px]`}>취소</button>
                <button type="submit" disabled={isWriteOpen ? (submitting || (!isNotice && !agreed)) : editUpdating}
                  className={`${isNotice ? BTN_ACCENT : BTN_NAVY} px-8 h-12 text-[15px] disabled:opacity-50`}>
                  {isWriteOpen ? (submitting ? "등록 중..." : isNotice ? "공지사항 등록" : "문의 접수완료") : (editUpdating ? "수정 중..." : "수정 완료")}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ───── 사진 크게 보기 ───── */}
      {enlargedImage && (
        <Modal label="사진 확대" onClose={() => setEnlargedImage(null)} overlayClassName="bg-black/90" sheet={false} panelClassName="max-w-4xl">
          <div onClick={() => setEnlargedImage(null)} className="cursor-zoom-out flex flex-col items-center">
            <div className="relative w-full max-w-4xl max-h-[85vh]">
              <SafeImg src={enlargedImage} alt="확대 사진" eager className="w-full h-full object-contain drop-shadow-2xl" />
            </div>
            <p className="text-center text-white/60 text-[13px] mt-6">화면을 누르거나 ESC 키를 누르면 닫힙니다.</p>
          </div>
        </Modal>
      )}

      {/* 관리자 로그인 */}
      {isAdminAuthModalOpen && (
        <Modal label="관리자 로그인" onClose={() => setIsAdminAuthModalOpen(false)} sheet={false} panelClassName="max-w-sm">
          <form onSubmit={handleAdminAuth} className="w-full rounded-lg bg-white p-6 sm:p-8 shadow-2xl border border-[#E4E0D8]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[#0E1A2B]">관리자 로그인</h2>
              <button type="button" onClick={() => setIsAdminAuthModalOpen(false)} className="grid h-9 w-9 place-items-center text-neutral-500 hover:text-[#0E1A2B]" aria-label="닫기">
                <Icon d={ICON.close} className="h-5 w-5" />
              </button>
            </div>
            <label className={LABEL} htmlFor="admin-email">이메일</label>
            <input id="admin-email" type="email" autoComplete="username" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={`${INPUT} mb-4`} />
            <label className={LABEL} htmlFor="admin-pw">비밀번호</label>
            <input id="admin-pw" type="password" autoComplete="current-password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={INPUT} />
            <button type="submit" disabled={isLoggingIn} className={`${BTN_NAVY} mt-6 h-12 w-full text-[15px] disabled:opacity-60`}>
              {isLoggingIn ? "로그인 중…" : "로그인"}
            </button>
          </form>
        </Modal>
      )}

    </div>
  );
}