"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import {
  STORE, telHref, formatPhone, isValidPhone, maskName,
  compressImage, validateImageFiles, MAX_PHOTOS,
} from "../../lib/site";
import {
  Icon, ICON, SafeImg, Modal, SiteHeader, SiteFooter, MobileCtaBar, AdminLoginModal,
} from "../../lib/ui";

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
const TABS = ["전체", "구매문의", "내 물건팔기", "기타문의"] as const;
type Tab = (typeof TABS)[number];

const isSell = (t?: string | null) => t === "내 물건 팔기" || t === "내 물건팔기" || t === "매입문의";
const isBuy = (t?: string | null) => t === "구매 문의" || t === "구매문의";
const typeLabel = (t?: string | null) => (isSell(t) ? "내 물건팔기" : isBuy(t) ? "구매문의" : t || "기타문의");
const typeStyle = (t?: string | null) =>
  isSell(t) ? "bg-[#e8f3fc] text-[#026bb4]" : isBuy(t) ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600";

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() === new Date().getFullYear() ? `${mm}-${dd}` : `${String(d.getFullYear()).slice(2)}-${mm}-${dd}`;
};

const field = "w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#0b4b8b] focus:ring-2 focus:ring-[#0b4b8b]/15 transition";

function StatusBadge({ status, notice }: { status: string | null; notice?: boolean }) {
  if (notice) return <span className="text-slate-300">-</span>;
  const done = status === "답변완료";
  return (
    <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap ${done ? "bg-[#0b4b8b] text-white" : "bg-slate-100 text-slate-500"}`}>
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
    구매문의: regularList.filter((i) => isBuy(i.inquiry_type)).length,
    내물건팔기: regularList.filter((i) => isSell(i.inquiry_type)).length,
    기타문의: regularList.filter((i) => !isBuy(i.inquiry_type) && !isSell(i.inquiry_type)).length,
  }), [regularList]);
  const countOf = (tab: Tab) => (tab === "내 물건팔기" ? tabCounts.내물건팔기 : tabCounts[tab]);

  const filteredList = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return regularList.filter((item) => {
      const tabOk =
        activeTab === "전체" ||
        (activeTab === "구매문의" && isBuy(item.inquiry_type)) ||
        (activeTab === "내 물건팔기" && isSell(item.inquiry_type)) ||
        (activeTab === "기타문의" && !isBuy(item.inquiry_type) && !isSell(item.inquiry_type));
      return tabOk && (!q || (item.category || "").toLowerCase().includes(q));
    });
  }, [regularList, activeTab, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const currentItems = filteredList.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  const showNotices = noticeList.length > 0 && !keyword.trim();

  const goPage = (p: number) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ───── 열람 / 비밀번호 ─────
     주의: 비밀번호 비교가 브라우저에서 이루어집니다. 서버 측 검증으로 옮기는 것을 권장합니다. (적용 안내 참고) */
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
      toast.success("관리자 로그인에 성공했습니다.");
      setIsAdminAuthModalOpen(false);
      setAdminEmail("");
      setAdminPassword("");
    } catch {
      toast.error("로그인 실패: 이메일이나 비밀번호를 확인해 주세요.");
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

  /* ───── 글쓰기 ───── */
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
      toast.error(`사진은 최대 ${MAX_PHOTOS}장까지 등록 가능합니다.`);
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
      if (!isValidPhone(phone)) { toast.error("연락처를 올바르게 입력해 주세요. (예: 010-0000-0000)"); return; }
      if (password.trim().length < 4) { toast.error("조회용 비밀번호는 4자 이상 입력해 주세요."); return; }
      if (!agreed) { toast.error("개인정보 수집 및 이용에 동의해 주세요."); return; }
    }

    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const blob = await compressImage(file);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const { error: uploadError } = await supabase.storage.from("inquiries").upload(fileName, blob, { contentType: "image/jpeg" });
        if (uploadError) throw new Error(`이미지 업로드 실패 (${uploadError.message})`);
        const { data } = supabase.storage.from("inquiries").getPublicUrl(fileName);
        if (data?.publicUrl) uploadedUrls.push(data.publicUrl);
      }

      const { error: insertError } = await supabase.from("purchase_requests").insert({
        name: isNotice ? name || STORE.name : name,
        phone: isNotice ? phone || STORE.tel : phone,
        password: isNotice ? "0000" : password,
        inquiry_type: isNotice ? "공지사항" : inquiryType,
        category: title,
        region: "대전/기타",
        description: content,
        images: uploadedUrls,
        is_notice: isNotice,
        status: isNotice ? "공지" : "접수",
      });
      if (insertError) throw insertError;

      if (!isNotice) {
        fetch("/api/telegram", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, type: inquiryType, title }),
        }).catch((err) => console.error("텔레그램 전송 요청 실패:", err));
      }

      toast.success(isNotice ? "공지사항이 등록되었습니다." : "문의가 성공적으로 접수되었습니다!");
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
    if (!confirm("정말 이 글을 삭제하시겠습니까? (삭제된 글은 복구할 수 없습니다)")) return;
    const id = selectedItem.id;
    try {
      setInquiries((prev) => prev.filter((i) => i.id !== id));
      setIsDetailOpen(false);
      const { error } = await supabase.from("purchase_requests").delete().eq("id", id);
      if (error) throw error;
      toast.success("게시글이 삭제되었습니다.");
    } catch (err: any) {
      toast.error("삭제 실패: " + err.message);
      loadData();
    }
  };

  /* 공지는 관리자만 수정/삭제, 일반 글은 비밀번호로 열람한 작성자 또는 관리자 */
  const canManage = !!selectedItem && (isAdmin || !selectedItem.is_notice);

  /* ───── 행 렌더링 공통 ───── */
  const rowTitle = (item: Inquiry) => item.category || item.description || "문의드립니다.";
  const hasImages = (item: Inquiry) => !!item.images && item.images.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      <SiteHeader>
        {isAdmin && (
          <button type="button" onClick={handleAdminLogout} title="클릭하여 관리자 모드 종료" className="bg-red-500/15 text-red-300 border border-red-400/30 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-red-500/25 transition whitespace-nowrap">
            관리자 모드 ON
          </button>
        )}
        <a href="/" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-200 hover:text-white border border-slate-600 hover:bg-slate-800 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition whitespace-nowrap">
          <Icon d={ICON.home} /> <span className="hidden sm:inline">메인 홈으로</span><span className="sm:hidden">홈</span>
        </a>
        <button type="button" onClick={handleOpenWrite} className="hidden sm:inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-slate-900 text-sm font-extrabold px-4 py-2.5 rounded-xl transition shadow-md whitespace-nowrap">
          <Icon d={ICON.edit} /> 글쓰기
        </button>
      </SiteHeader>

      {/* 타이틀 밴드 */}
      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-10 text-center">
          <p className="text-xs font-black tracking-widest text-[#0b4b8b] uppercase mb-2">Q&amp;A Board</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">문의 게시판</h1>
          <p className="text-sm sm:text-base text-slate-500 break-keep max-w-xl mx-auto">
            작성하신 문의는 조회용 비밀번호를 입력해야 확인할 수 있습니다. 급하신 경우 전화나 카톡으로 문의해 주세요.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            <a href={telHref(STORE.tel)} className="inline-flex items-center gap-1.5 bg-[#0b4b8b] hover:bg-[#093c70] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm">
              <Icon d={ICON.phone} /> {STORE.tel}
            </a>
            <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-[#FEE500] hover:bg-[#f5dc00] text-slate-900 text-sm font-bold px-4 py-2.5 rounded-xl transition shadow-sm">
              <Icon d={ICON.chat} /> 카톡 상담
            </a>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-8 sm:py-10 flex-1 w-full">
        {/* 탭 + 검색 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" role="tablist" aria-label="문의 구분">
            {TABS.map((tab) => {
              const active = activeTab === tab;
              return (
                <button key={tab} type="button" role="tab" aria-selected={active} onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border shrink-0 ${active ? "bg-[#0b4b8b] text-white border-[#0b4b8b] shadow-sm" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                  {tab}<span className={`ml-1.5 text-xs ${active ? "text-blue-200" : "text-slate-400"}`}>{countOf(tab)}</span>
                </button>
              );
            })}
          </div>
          <div className="relative sm:w-64">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Icon d={ICON.search} /></span>
            <input type="search" value={keyword} onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }} placeholder="제목 검색" aria-label="제목 검색"
              className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-[#0b4b8b] focus:ring-2 focus:ring-[#0b4b8b]/15 transition" />
          </div>
        </div>

        <div className="flex items-center justify-between mb-3 text-sm text-slate-500">
          <p>총 <strong className="text-slate-900">{filteredList.length}</strong>건{showNotices && <span className="text-slate-400"> (공지 {noticeList.length}건 별도)</span>}</p>
          <button type="button" onClick={handleOpenWrite} className="inline-flex items-center gap-1.5 bg-[#0b4b8b] hover:bg-[#093c70] text-white font-bold px-4 py-2 rounded-lg text-sm transition shadow-sm whitespace-nowrap">
            <Icon d={ICON.edit} /> 글쓰기
          </button>
        </div>

        {/* 데스크톱: 테이블 */}
        <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm text-center">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold border-b border-slate-200">
              <tr className="h-12">
                <th className="w-20">번호</th><th className="w-28">구분</th><th className="text-left px-4">제목</th>
                <th className="w-28">답변여부</th><th className="w-24">작성자</th><th className="w-24">날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="animate-pulse h-14">
                    <td><div className="h-4 bg-slate-200 rounded w-6 mx-auto" /></td>
                    <td><div className="h-6 bg-slate-200 rounded-md w-16 mx-auto" /></td>
                    <td className="px-4"><div className="h-4 bg-slate-200 rounded w-2/3" /></td>
                    <td><div className="h-5 bg-slate-200 rounded w-12 mx-auto" /></td>
                    <td><div className="h-4 bg-slate-200 rounded w-10 mx-auto" /></td>
                    <td><div className="h-4 bg-slate-200 rounded w-10 mx-auto" /></td>
                  </tr>
                ))
              ) : (
                <>
                  {showNotices && noticeList.map((notice) => (
                    <tr key={notice.id} onClick={() => handleItemClick(notice)} className="bg-amber-50/50 hover:bg-amber-50 transition h-14 cursor-pointer">
                      <td><span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">공지</span></td>
                      <td><span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-700 border border-red-100">공지사항</span></td>
                      <td className="px-4 text-left">
                        <button type="button" className="flex items-center gap-1.5 font-black text-slate-900 text-left max-w-full">
                          <Icon d={ICON.bell} className="w-4 h-4 text-red-500 shrink-0" />
                          <span className="truncate">{notice.category}</span>
                          {hasImages(notice) && <Icon d={ICON.image} className="w-4 h-4 text-slate-400 shrink-0" />}
                        </button>
                      </td>
                      <td><StatusBadge status={null} notice /></td>
                      <td className="font-bold text-red-700">{notice.name}</td>
                      <td className="text-slate-500">{formatDate(notice.created_at)}</td>
                    </tr>
                  ))}
                  {currentItems.map((item, index) => (
                    <tr key={item.id} onClick={() => handleItemClick(item)} className="hover:bg-slate-50 transition h-14 cursor-pointer">
                      <td className="text-slate-400">{filteredList.length - ((safePage - 1) * ITEMS_PER_PAGE + index)}</td>
                      <td><span className={`inline-block px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${typeStyle(item.inquiry_type)}`}>{typeLabel(item.inquiry_type)}</span></td>
                      <td className="px-4 text-left">
                        <button type="button" className="flex items-center gap-1.5 font-medium text-slate-800 hover:text-[#0b4b8b] text-left max-w-full">
                          {!isAdmin && <Icon d={ICON.lock} className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                          <span className="truncate">{rowTitle(item)}</span>
                          {hasImages(item) && <Icon d={ICON.image} className="w-4 h-4 text-slate-400 shrink-0" />}
                        </button>
                      </td>
                      <td><StatusBadge status={item.status} /></td>
                      <td className="text-slate-600">{maskName(item.name)}</td>
                      <td className="text-slate-500">{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* 모바일: 카드 리스트 */}
        <ul className="md:hidden space-y-2.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <li key={`msk-${i}`} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />)
          ) : (
            <>
              {showNotices && noticeList.map((notice) => (
                <li key={notice.id}>
                  <button type="button" onClick={() => handleItemClick(notice)} className="w-full text-left bg-amber-50/60 border border-amber-200 rounded-2xl p-4 hover:bg-amber-50 transition">
                    <div className="flex items-center justify-between mb-2">
                      <span className="bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">공지</span>
                      <span className="text-[11px] text-slate-400">{formatDate(notice.created_at)}</span>
                    </div>
                    <p className="font-black text-slate-900 text-sm line-clamp-2 flex items-start gap-1.5"><Icon d={ICON.bell} className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />{notice.category}</p>
                  </button>
                </li>
              ))}
              {currentItems.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => handleItemClick(item)} className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4 hover:border-[#0b4b8b] transition shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold ${typeStyle(item.inquiry_type)}`}>{typeLabel(item.inquiry_type)}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="font-bold text-slate-900 text-sm line-clamp-2 flex items-start gap-1.5 mb-2">
                      {!isAdmin && <Icon d={ICON.lock} className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />}
                      <span>{rowTitle(item)}</span>
                      {hasImages(item) && <Icon d={ICON.image} className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
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
          <div className="mt-4 py-14 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-700 font-bold mb-3">문의 목록을 불러오지 못했습니다.</p>
            <button type="button" onClick={loadData} className="px-5 py-2.5 rounded-xl bg-[#0b4b8b] text-white font-bold text-sm hover:bg-[#093c70]">다시 시도</button>
          </div>
        )}
        {!isLoading && !loadError && currentItems.length === 0 && (
          <div className="mt-4 py-16 text-center bg-white rounded-2xl border border-slate-200 text-sm">
            <p className="text-slate-500 font-medium mb-1">{keyword.trim() ? "검색 결과가 없습니다." : "등록된 문의 내역이 없습니다."}</p>
            <p className="text-slate-400">첫 문의를 남겨주시면 빠르게 확인하고 연락드립니다.</p>
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && !isLoading && (
          <nav className="flex items-center justify-center gap-1.5 mt-8" aria-label="페이지 이동">
            <button type="button" onClick={() => goPage(Math.max(safePage - 1, 1))} disabled={safePage === 1} aria-label="이전 페이지"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <Icon d={ICON.left} />
            </button>
            {pageWindow(safePage, totalPages).map((p, i) =>
              p === "…" ? <span key={`e${i}`} className="w-6 text-center text-slate-400">…</span> : (
                <button key={p} type="button" onClick={() => goPage(p)} aria-current={safePage === p ? "page" : undefined}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold transition ${safePage === p ? "bg-[#0b4b8b] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {p}
                </button>
              )
            )}
            <button type="button" onClick={() => goPage(Math.min(safePage + 1, totalPages))} disabled={safePage === totalPages} aria-label="다음 페이지"
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <Icon d={ICON.right} />
            </button>
          </nav>
        )}
      </main>

      <SiteFooter isAdmin={isAdmin} onAdminClick={() => (isAdmin ? handleAdminLogout() : setIsAdminAuthModalOpen(true))} />
      <MobileCtaBar />

      {/* ───── 비밀번호 확인 ───── */}
      {isPwModalOpen && selectedItem && (
        <Modal label="비밀글 열람" onClose={() => setIsPwModalOpen(false)} sheet={false} panelClassName="max-w-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500"><Icon d={ICON.lock} className="w-5 h-5" /></div>
            <h3 className="font-bold text-slate-900 text-base mb-1">비밀글 열람</h3>
            <p className="text-xs text-slate-500 mb-5">작성 시 등록하신 조회 비밀번호를 입력해 주세요.</p>
            <form onSubmit={handleVerifyPassword} className="space-y-3 text-left">
              <input type={showVerifyPassword ? "text" : "password"} value={inputPw} onChange={(e) => setInputPw(e.target.value)} placeholder="비밀번호 입력" required autoFocus autoComplete="off"
                className="w-full border border-slate-300 rounded-xl p-3 text-sm text-center outline-none focus:border-[#0b4b8b] focus:ring-2 focus:ring-[#0b4b8b]/15" />
              <label className="flex items-center gap-1.5 justify-center text-xs text-slate-600 cursor-pointer select-none">
                <input type="checkbox" checked={showVerifyPassword} onChange={(e) => setShowVerifyPassword(e.target.checked)} className="w-4 h-4 rounded accent-[#0b4b8b]" /> 문자 표시
              </label>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsPwModalOpen(false)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50">취소</button>
                <button type="submit" className="w-1/2 py-2.5 rounded-xl bg-[#0b4b8b] text-white font-bold text-xs hover:bg-[#093c70] transition">확인</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ───── 상세 ───── */}
      {isDetailOpen && selectedItem && (
        <Modal label={`${selectedItem.category || "문의"} 상세`} onClose={() => setIsDetailOpen(false)} panelClassName="sm:max-w-xl">
          <div className="bg-white max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200">
            <div className={`px-6 py-4 flex items-center justify-between sticky top-0 z-10 text-white ${selectedItem.is_notice ? "bg-red-600" : "bg-[#0b4b8b]"}`}>
              <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded">{selectedItem.is_notice ? "공지사항" : typeLabel(selectedItem.inquiry_type)}</span>
              <button type="button" onClick={() => setIsDetailOpen(false)} aria-label="닫기" className="text-white/80 hover:text-white"><Icon d={ICON.close} className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black text-slate-900 mb-2 break-words">{selectedItem.category || "문의 내용"}</h2>
                <div className="flex flex-wrap gap-y-1 gap-x-4 text-slate-500 text-xs">
                  <span>작성자: <strong className="text-slate-800">{isAdmin || selectedItem.is_notice ? selectedItem.name : maskName(selectedItem.name)}</strong></span>
                  {isAdmin && selectedItem.phone && (
                    <span>연락처: <a href={telHref(selectedItem.phone)} className="font-bold text-blue-600 hover:underline">{selectedItem.phone}</a></span>
                  )}
                  <span>등록일: {new Date(selectedItem.created_at).toLocaleDateString("ko-KR")}</span>
                  {!selectedItem.is_notice && <span>상태: <strong className="text-blue-600">{selectedItem.status || "접수"}</strong></span>}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[100px] border border-slate-100 break-words">
                {selectedItem.description || "등록된 상세 내용이 없습니다."}
              </div>

              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5"><Icon d={ICON.image} className="w-4 h-4 text-slate-500" /> 첨부 사진 ({selectedItem.images.length}장)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedItem.images.map((imgUrl, idx) => (
                      <button key={imgUrl + idx} type="button" onClick={() => setEnlargedImage(imgUrl)} aria-label={`첨부사진 ${idx + 1} 크게 보기`}
                        className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group relative">
                        <SafeImg src={imgUrl} alt={`첨부사진 ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.admin_reply && !isAdmin && (
                <div className="bg-[#f0f6ff] rounded-2xl p-5 border border-blue-100 mt-4">
                  <h3 className="font-black text-[#0b4b8b] flex items-center gap-2 mb-3">
                    <span className="bg-[#0b4b8b] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">A</span>
                    {STORE.name} 답변입니다.
                  </h3>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pl-8 break-words">{selectedItem.admin_reply}</div>
                </div>
              )}

              {!selectedItem.is_notice && isAdmin && (
                <>
                  <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 mt-6">
                    <h3 className="font-black text-slate-800 mb-3 text-sm">관리자 답변 달기</h3>
                    <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} rows={4} placeholder="고객에게 남길 답변을 작성해 주세요."
                      className="w-full border border-slate-300 p-3 rounded-xl bg-white text-sm outline-none resize-y focus:border-[#0b4b8b] focus:ring-2 focus:ring-[#0b4b8b]/15 transition leading-relaxed mb-3" />
                    <div className="flex justify-end">
                      <button type="button" onClick={handleReplySubmit} disabled={isReplying} className="bg-[#0b4b8b] text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-[#093c70] transition shadow-sm disabled:opacity-50">
                        {isReplying ? "등록 중..." : "답변 저장 (상태 자동 업데이트)"}
                      </button>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-700">수동 상태 변경</span>
                    <div className="flex gap-2">
                      {["접수", "답변완료"].map((s) => (
                        <button key={s} type="button" onClick={() => handleStatusUpdate(selectedItem.id, s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedItem.status === s ? "bg-[#0b4b8b] text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <div className="flex gap-2">
                  {canManage && (
                    <>
                      <button type="button" onClick={handleOpenEdit} className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition">수정</button>
                      <button type="button" onClick={handleDelete} className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition border border-red-200">삭제</button>
                    </>
                  )}
                </div>
                <button type="button" onClick={() => setIsDetailOpen(false)} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition">닫기</button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ───── 수정 ───── */}
      {isEditOpen && selectedItem && (
        <Modal label="게시글 수정" onClose={() => setIsEditOpen(false)} z="z-[60]" sheet={false} panelClassName="max-w-lg" closeOnBackdrop={false}>
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">게시글 수정</h3>
              <button type="button" onClick={() => setIsEditOpen(false)} aria-label="닫기" className="text-white/80 hover:text-white"><Icon d={ICON.close} className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-sm">
              {!selectedItem.is_notice && (
                <fieldset>
                  <legend className="block font-bold text-slate-700 mb-1">문의 구분</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {["내 물건 팔기", "구매 문의", "기타 문의"].map((type) => (
                      <button type="button" key={type} onClick={() => setEditInquiryType(type)} aria-pressed={editInquiryType === type}
                        className={`py-2 rounded-lg font-bold border transition text-xs sm:text-sm ${editInquiryType === type ? "border-[#0b4b8b] bg-[#0b4b8b] text-white" : "border-slate-300 bg-white text-slate-600"}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <div>
                <label htmlFor="ed-title" className="block font-bold text-slate-700 mb-1">제목</label>
                <input id="ed-title" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required className={field} />
              </div>
              <div>
                <label htmlFor="ed-content" className="block font-bold text-slate-700 mb-1">상세 내용</label>
                <textarea id="ed-content" rows={5} value={editContent} onChange={(e) => setEditContent(e.target.value)} className={`${field} resize-none`} />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-bold">취소</button>
                <button type="submit" disabled={editUpdating} className="px-5 py-2 bg-[#0b4b8b] text-white rounded-lg font-bold hover:bg-[#093c70] disabled:opacity-50">{editUpdating ? "수정 중..." : "수정 완료"}</button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ───── 사진 확대 ───── */}
      {enlargedImage && (
        <Modal label="사진 확대" onClose={() => setEnlargedImage(null)} z="z-[100]" sheet={false} overlayClassName="bg-black/85" panelClassName="max-w-4xl">
          <div onClick={() => setEnlargedImage(null)} className="cursor-zoom-out">
            <div className="relative w-full h-[78vh]">
              <SafeImg src={enlargedImage} alt="확대 사진" eager className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl" />
            </div>
            <p className="text-center text-white/80 text-xs mt-4">화면을 누르거나 ESC 키를 누르면 닫힙니다.</p>
          </div>
        </Modal>
      )}

      {/* ───── 글쓰기 ───── */}
      {isWriteOpen && (
        <Modal label={isNotice ? "공지사항 등록" : "문의글 작성"} onClose={closeWrite} panelClassName="sm:max-w-lg" closeOnBackdrop={false} closeOnEsc={false}>
          <div className="bg-white max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-xl border border-slate-200">
            <div className={`px-6 py-4 flex items-center justify-between sticky top-0 z-10 text-white ${isNotice ? "bg-red-600" : "bg-[#0b4b8b]"}`}>
              <h3 className="font-bold text-base">{isNotice ? "관리자 공지사항 등록" : "문의글 작성하기"}</h3>
              <button type="button" onClick={closeWrite} aria-label="닫기" className="text-white/80 hover:text-white"><Icon d={ICON.close} className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleWriteSubmit} className="p-6 space-y-4 text-sm">
              {isAdmin && (
                <label className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between cursor-pointer">
                  <span>
                    <span className="font-extrabold text-red-800 block text-xs">최상단 고정 공지사항</span>
                    <span className="text-[11px] text-red-600">체크 시 모든 탭 상단에 자물쇠 없이 고정됩니다.</span>
                  </span>
                  <input type="checkbox" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)} className="w-5 h-5 accent-red-600" />
                </label>
              )}

              {!isNotice && (
                <fieldset>
                  <legend className="block font-bold text-slate-700 mb-1">문의 구분 *</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {["내 물건 팔기", "구매 문의", "기타 문의"].map((type) => (
                      <button type="button" key={type} onClick={() => setInquiryType(type)} aria-pressed={inquiryType === type}
                        className={`py-2.5 rounded-lg font-bold border transition text-xs sm:text-sm ${inquiryType === type ? "border-[#0b4b8b] bg-[#0b4b8b] text-white" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}>
                        {type}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="w-name" className="block font-bold text-slate-700 mb-1">작성자 {isNotice ? "(공지표시명)" : "*"}</label>
                  <input id="w-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={isNotice ? STORE.name : "성함을 입력하세요"} required={!isNotice} autoComplete="name" className={field} />
                </div>
                <div>
                  <label htmlFor="w-phone" className="block font-bold text-slate-700 mb-1">연락처 {isNotice ? "(안내용)" : "*"}</label>
                  <input id="w-phone" type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder={isNotice ? STORE.tel : "010-0000-0000"} required={!isNotice} autoComplete="tel" className={field} />
                </div>
              </div>

              {!isNotice && (
                <div>
                  <label htmlFor="w-pw" className="block font-bold text-slate-700 mb-1">조회용 비밀번호 *</label>
                  <input id="w-pw" type={showWritePassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="4자 이상 (숫자 4자리 권장)" required minLength={4} autoComplete="new-password" className={field} />
                  <label className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600 cursor-pointer select-none">
                    <input type="checkbox" checked={showWritePassword} onChange={(e) => setShowWritePassword(e.target.checked)} className="w-4 h-4 rounded accent-[#0b4b8b]" /> 문자 표시
                  </label>
                </div>
              )}

              <div>
                <label htmlFor="w-title" className="block font-bold text-slate-700 mb-1">{isNotice ? "공지 제목 *" : "제목 (제품명/수량) *"}</label>
                <input id="w-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={field}
                  placeholder={isNotice ? "예: [공지] 매장 휴무 안내" : "예: 양문형 냉장고 매각 견적 요청드립니다."} />
              </div>

              <div>
                <label htmlFor="w-content" className="block font-bold text-slate-700 mb-1">{isNotice ? "공지 상세 내용 *" : "상세 문의 내용"}</label>
                <textarea id="w-content" rows={4} value={content} onChange={(e) => setContent(e.target.value)} className={`${field} resize-none`}
                  placeholder={isNotice ? "공지하실 내용을 작성해 주세요." : "제품 상태, 지역, 방문 희망 일정 등을 자세히 적어주세요."} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="w-files" className="font-bold text-slate-700">사진 첨부 (선택, 최대 {MAX_PHOTOS}장)</label>
                  <span className="text-[11px] text-blue-600 font-medium">자동 압축 등록</span>
                </div>
                <input id="w-files" type="file" accept="image/*" multiple onChange={handleFileChange} disabled={selectedFiles.length >= MAX_PHOTOS}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer disabled:opacity-50" />
                {filePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {filePreviews.map((preview, index) => (
                      <div key={preview} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt={`첨부 사진 ${index + 1} 미리보기`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleRemoveFile(index)} aria-label={`${index + 1}번 사진 삭제`} className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition">
                          <Icon d={ICON.close} className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isNotice && (
                <label className="flex items-center gap-2 pt-1 text-slate-600 text-xs cursor-pointer">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="rounded accent-[#0b4b8b]" />
                  <span><a href="/privacy" target="_blank" className="underline font-bold text-[#0b4b8b]">개인정보 수집 및 이용</a>에 동의합니다. *</span>
                </label>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={closeWrite} className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold">취소</button>
                <button type="submit" disabled={submitting || (!isNotice && !agreed)}
                  className={`px-6 py-2.5 rounded-lg text-white font-bold transition shadow-sm ${submitting || (!isNotice && !agreed) ? "bg-slate-400 cursor-not-allowed" : isNotice ? "bg-red-600 hover:bg-red-700" : "bg-[#0b4b8b] hover:bg-[#093c70]"}`}>
                  {submitting ? "등록 처리 중..." : isNotice ? "공지사항 등록" : "문의 접수"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {isAdminAuthModalOpen && (
        <AdminLoginModal email={adminEmail} password={adminPassword} loading={isLoggingIn}
          onEmail={setAdminEmail} onPassword={setAdminPassword} onSubmit={handleAdminAuth} onClose={() => setIsAdminAuthModalOpen(false)} />
      )}
    </div>
  );
}
// ===== 파일 끝 =====
