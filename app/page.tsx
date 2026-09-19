"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const ReviewCard = ({ review, isAdmin, onDelete, onEnlarge }: any) => {
  const images = review.image_url ? review.image_url.split(',') : [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div onClick={() => onEnlarge(review, currentIndex)} className="group relative bg-slate-100 rounded-xl sm:rounded-2xl overflow-hidden aspect-square shadow-sm border border-slate-200 cursor-pointer">
      <img src={images[currentIndex]} alt={review.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      {images.length > 1 && (
        <div className="absolute inset-0 flex items-center justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
          <button onClick={handlePrev} className="bg-black/50 text-white w-7 h-7 rounded-full flex items-center justify-center pointer-events-auto hover:bg-[#0b4b8b] transition text-xs shadow-md">❮</button>
          <button onClick={handleNext} className="bg-black/50 text-white w-7 h-7 rounded-full flex items-center justify-center pointer-events-auto hover:bg-[#0b4b8b] transition text-xs shadow-md">❯</button>
        </div>
      )}
      {images.length > 1 && (
        <div className="absolute bottom-2 right-2 flex gap-1 z-20">
          {images.map((_, idx) => (
            <span key={idx} onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }} className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${currentIndex === idx ? "bg-white scale-125 shadow-sm" : "bg-white/50"}`} />
          ))}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 sm:p-4 pointer-events-none">
        <span className="text-white font-bold text-xs sm:text-sm drop-shadow-md line-clamp-2 leading-snug pr-6">{review.title}</span>
        <span className="text-white/70 text-[9px] sm:text-[10px] mt-1.5">{new Date(review.created_at).toLocaleDateString()}</span>
      </div>
      {isAdmin && (
        <button onClick={(e) => { e.stopPropagation(); onDelete(review.id); }} className="absolute top-2 right-2 bg-red-600/90 text-white w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700 hover:scale-110 transition z-30" title="사진 삭제">✕</button>
      )}
    </div>
  );
};

export default function Home() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);

  const bgImages = [
    '/main-bg.png', 
    '/main-bg2.png', 
    '/main-bg3.png'
  ];
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev === bgImages.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [inquiryType, setInquiryType] = useState("구매 문의"); 
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [hasElevator, setHasElevator] = useState("있음 (제품 적재 가능)");
  const [hasStairs, setHasStairs] = useState("없음 (1층 또는 엘리베이터 이동)");

  const [isReviewUploadOpen, setIsReviewUploadOpen] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewFiles, setReviewFiles] = useState<File[]>([]); 
  const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);
  const [uploadingReview, setUploadingReview] = useState(false);

  const [enlargedReview, setEnlargedReview] = useState<any | null>(null);
  const [enlargedIndex, setEnlargedIndex] = useState(0);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqData = [
    { q: "먼 지역(수도권·타 광역시)도 배송이나 설치가 가능한가요?", a: "가능합니다. 제품과 지역에 따라 전국 어디든 배송·설치 상담이 가능합니다. 실제로 구미, 포항, 경산, 안동, 경주는 물론 창원, 부산, 거제 등 여러 지역의 거래 사례가 있습니다." },
    { q: "구매 후 고장이 나면 어떻게 하나요?", a: "에어컨 및 냉난방기는 8개월, 그 외 제품은 4개월 무상 A/S를 보장합니다. (단, 계약 내용에 따라 보증 기간은 달라질 수 있습니다.)" },
    { q: "매입이 결정되면 대금 지급은 어떻게 이루어지나요?", a: "기사님이 현장에 방문하여 제품 상태를 최종 확인하고 수거가 완료되는 즉시, 지정해주신 계좌로 100% 전액 입금 처리해 드립니다." },
    { q: "영업시간과 매장 위치가 어떻게 되나요?", a: "영업시간은 09:00 ~ 19:00 (일요일 휴무)이며, 오프라인 매장은 대전광역시 중구 중촌동 144에 위치해 있습니다." }
  ];

  const fetchData = async () => {
    const { data: inqData } = await supabase.from("purchase_requests").select("*").order("created_at", { ascending: false });
    if (inqData) setInquiries(inqData);
    const { data: revData } = await supabase.from("products").select("*").eq("category", "배송인증").order("created_at", { ascending: false });
    if (revData) setReviews(revData);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("isAdmin") === "true") setIsAdmin(true);
    fetchData();
  }, []);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === "8179") {
      setIsAdmin(true);
      if (typeof window !== "undefined") sessionStorage.setItem("isAdmin", "true");
      setIsAdminAuthModalOpen(false); setAdminPinInput("");
      alert("관리자 모드가 활성화되었습니다.");
    } else alert("관리자 비밀번호가 일치하지 않습니다.");
  };

  const handleAdminLogout = () => {
    if (confirm("관리자 모드를 종료하시겠습니까?")) {
      setIsAdmin(false);
      if (typeof window !== "undefined") sessionStorage.removeItem("isAdmin");
      alert("관리자 모드가 종료되었습니다.");
      window.location.href = "/";
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image(); img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width, height = img.height;
          const maxDim = 1200;
          if (width > height) { if (width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; } } 
          else { if (height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext("2d"); ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(new Error("압축 실패")); }, "image/jpeg", 0.75);
        };
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 3) return alert("사진은 최대 3장까지 등록 가능합니다.");
    setSelectedFiles([...selectedFiles, ...files]);
    setFilePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setFilePreviews(filePreviews.filter((_, i) => i !== index));
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !name || !phone || !password) return alert("필수 항목(* 표시)을 모두 입력해 주세요.");
    if (!agreed) return alert("개인정보 처리방침에 동의해 주세요.");

    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of selectedFiles) {
        const compressedBlob = await compressImage(file);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const { error: uploadError } = await supabase.storage.from("inquiries").upload(fileName, compressedBlob, { contentType: "image/jpeg" });
        if (uploadError) throw new Error(`업로드 실패 (${uploadError.message})`);
        const { data: publicUrlData } = supabase.storage.from("inquiries").getPublicUrl(fileName);
        if (publicUrlData?.publicUrl) uploadedUrls.push(publicUrlData.publicUrl);
      }

      let finalDescription = description;
      if (inquiryType === "내 물건 팔기") {
        finalDescription = `[현장 조건]\n- 엘리베이터: ${hasElevator}\n- 계단 작업: ${hasStairs}\n\n[상세 내용]\n${description}`;
      }

      const { error } = await supabase.from("purchase_requests").insert({
        name, phone, password, inquiry_type: inquiryType,
        category: title, region: "대전/기타", description: finalDescription,
        images: uploadedUrls, is_notice: false, status: '접수'
      });

      if (error) throw error;
      alert("문의가 성공적으로 접수되었습니다! 빠르게 확인 후 연락드리겠습니다.");
      setName(""); setPhone(""); setPassword(""); setTitle(""); setDescription(""); 
      setSelectedFiles([]); setFilePreviews([]); setAgreed(false);
      setHasElevator("있음 (제품 적재 가능)"); setHasStairs("없음 (1층 또는 엘리베이터 이동)");
      fetchData();
    } catch (error: any) { alert("오류가 발생했습니다: " + error.message); } 
    finally { setLoading(false); }
  };

  const handleReviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (reviewFiles.length + files.length > 3) return alert("사진은 최대 3장까지 등록 가능합니다.");
    setReviewFiles([...reviewFiles, ...files]);
    setReviewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleReviewRemoveFile = (index: number) => {
    setReviewFiles(reviewFiles.filter((_, i) => i !== index));
    setReviewPreviews(reviewPreviews.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewTitle || reviewFiles.length === 0) return alert("제목과 최소 1장의 사진을 등록해주세요.");

    setUploadingReview(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of reviewFiles) {
        const compressedBlob = await compressImage(file);
        const fileName = `review_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const { error: uploadError } = await supabase.storage.from("inquiries").upload(fileName, compressedBlob, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const uploadedUrl = supabase.storage.from("inquiries").getPublicUrl(fileName).data.publicUrl;
        uploadedUrls.push(uploadedUrl);
      }

      const finalImageString = uploadedUrls.join(',');
      const { error } = await supabase.from("products").insert({
        title: reviewTitle, category: "배송인증", image_url: finalImageString, price: 0, status: "판매중" 
      });

      if (error) throw error;
      alert("인증사진 등록 완료.");
      setIsReviewUploadOpen(false); setReviewTitle(""); setReviewFiles([]); setReviewPreviews([]);
      fetchData(); 
    } catch (error: any) { alert("오류 발생: " + error.message); } 
    finally { setUploadingReview(false); }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("이 인증사진을 정말 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error; alert("삭제되었습니다."); fetchData();
    } catch (error: any) { alert("삭제 실패: " + error.message); }
  };

  const scrollToSection = (id: string) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth" }); };
  const maskName = (rawName: string) => {
    if (!rawName) return "고*객"; if (rawName.length <= 2) return rawName.charAt(0) + "*";
    return rawName.charAt(0) + "*".repeat(rawName.length - 2) + rawName.slice(-1);
  };
  const toggleFaq = (index: number) => setOpenFaqIndex(openFaqIndex === index ? null : index);

  const handleGalleryDirectInquiry = () => {
    if (!enlargedReview) return;
    setEnlargedReview(null); 
    setInquiryType("구매 문의"); 
    setTitle(`[갤러리 참고] '${enlargedReview.title}' 현장 관련 상담 요청`); 
    setTimeout(() => scrollToSection("inquiry-section"), 150); 
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative flex flex-col">

      {/* 우측 퀵메뉴 */}
      <aside className="fixed right-3 top-1/4 z-50 hidden md:flex flex-col gap-1.5 bg-white shadow-2xl rounded-2xl p-2 border border-slate-200">
        <a href="tel:042-523-8179" className="flex flex-col items-center justify-center w-16 h-16 bg-[#DC2626] text-white rounded-xl hover:opacity-90 transition text-[11px] font-black text-center leading-tight shadow-sm">
          <span className="text-lg mb-0.5">📞</span><span>전화상담</span>
        </a>
        <a href="http://pf.kakao.com/_XmyrX/chat" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-16 h-16 bg-[#FACC15] text-slate-900 rounded-xl hover:opacity-90 transition text-[11px] font-black text-center leading-tight shadow-sm p-1.5">
          <img src="/kakao-logo.png" alt="카톡상담" className="w-7 h-7 object-contain mb-0.5 rounded-md" /><span>카톡상담</span>
        </a>
        <button onClick={() => scrollToSection("inquiry-section")} className="flex flex-col items-center justify-center w-16 h-16 bg-[#1E293B] text-white rounded-xl hover:opacity-90 transition text-[11px] font-black text-center leading-tight shadow-sm">
          <span className="text-lg mb-0.5">✍️</span><span>판매/매입</span>
        </button>
        <a href="https://cafe.naver.com/hanbatmall" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center w-16 h-16 bg-[#059669] text-white rounded-xl hover:opacity-90 transition text-[11px] font-black text-center leading-tight shadow-sm p-1.5">
          <img src="/naver-cafe.png" alt="제품확인" className="w-7 h-7 object-contain mb-0.5 rounded-md bg-white p-0.5" /><span>제품확인</span>
        </a>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex flex-col items-center justify-center w-16 h-12 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition text-[10px] font-black">
          <span className="text-[10px] mb-0.5">▲</span><span>TOP</span>
        </button>
      </aside>

      {/* 상단 헤더 (관리자 버튼 제거) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-0 sm:h-20 flex items-center justify-between gap-2">
          <a href="/" className="font-black text-base sm:text-xl tracking-tight flex items-center gap-2 shrink-0 hover:opacity-80 transition">
            <span className="text-blue-500 text-lg sm:text-2xl">⚡</span> 
            <div>
              <span className="whitespace-nowrap">한밭중고전자</span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-normal">대전 중구 중촌동 · SINCE 1997</span>
            </div>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-300">
            <button onClick={() => scrollToSection("reviews-section")} className="hover:text-white transition">배송/설치 인증</button>
            <button onClick={() => scrollToSection("inquiry-section")} className="hover:text-white transition">간편상담안내</button>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <a href="/inquiry" className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition shadow-md inline-flex items-center gap-1 border border-white whitespace-nowrap">
              <span>📋</span><span>문의게시판</span>
            </a>
            <a href="http://pf.kakao.com/_XmyrX/chat" target="_blank" rel="noopener noreferrer" className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 text-xs font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition shadow-md hidden sm:inline-flex items-center gap-1">
              <img src="/kakao-logo.png" alt="카카오톡" className="w-4 h-4 object-contain rounded" /><span>카톡 견적문의</span>
            </a>
            <a href="tel:042-523-8179" className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition shadow-md whitespace-nowrap">
              📞 042-523-8179
            </a>
          </div>
        </div>
      </header>

      {/* 메인 히어로 섹션 (모바일 버튼 완벽 중앙 정렬) */}
      <section className="relative w-full min-h-[100svh] lg:min-h-[750px] flex items-center justify-center overflow-hidden border-b border-slate-800 pt-20 lg:pt-0">
        <div className="absolute inset-0 overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 flex transition-transform duration-700 ease-in-out" 
            style={{ 
              width: `${bgImages.length * 100}%`, 
              transform: `translateX(-${currentBgIndex * (100 / bgImages.length)}%)` 
            }}
          >
            {bgImages.map((img, index) => (
              <div 
                key={index}
                className="h-full bg-cover bg-center bg-no-repeat relative shrink-0"
                style={{ 
                  width: `${100 / bgImages.length}%`, 
                  backgroundImage: `url('${img}')` 
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 via-slate-900/30 to-slate-900/20"></div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {bgImages.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setCurrentBgIndex(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 shadow-sm ${idx === currentBgIndex ? "bg-[#3b82f6] w-8" : "bg-white/40 hover:bg-white/70"}`}
              aria-label={`배경 ${idx + 1}`}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center text-center pb-16 lg:pb-0">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-400/20 backdrop-blur-md mb-6 sm:mb-8 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="text-blue-100 font-bold text-xs sm:text-sm tracking-widest">대전·세종·충청 지역 전문</span>
          </div>
          
          <h1 className="text-[36px] sm:text-5xl lg:text-[60px] xl:text-[68px] font-black text-white tracking-tight leading-[1.3] sm:leading-[1.3] lg:leading-[1.35] mb-10 drop-shadow-xl break-keep">
            <span className="text-[#3b82f6] drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]">새것 같은</span> 중고 상품을<br />
            <span className="text-[#3b82f6] drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]">최저가</span>로 판매합니다!
          </h1>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 w-full items-center justify-center">
            <button onClick={() => scrollToSection("reviews-section")} className="group w-full sm:w-auto min-w-[220px] max-w-[280px] bg-white text-slate-900 font-black py-4 px-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg flex items-center justify-center gap-2.5 mx-auto">
              <span className="text-xl group-hover:scale-110 transition-transform">📸</span><span>배송·설치 후기</span>
            </button>
            <a href="http://pf.kakao.com/_XmyrX/chat" target="_blank" rel="noopener noreferrer" className="group w-full sm:w-auto min-w-[220px] max-w-[280px] bg-[#FEE500] text-slate-900 font-black py-4 px-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg flex items-center justify-center gap-2.5 mx-auto">
              <img src="/kakao-logo.png" alt="카톡" className="w-5 h-5 sm:w-6 sm:h-6 object-contain group-hover:scale-110 transition-transform" /><span>카톡 견적 문의</span>
            </a>
            <a href="https://cafe.naver.com/hanbatmall" target="_blank" rel="noopener noreferrer" className="group w-full sm:w-auto min-w-[220px] max-w-[280px] bg-[#03C75A] text-white font-black py-4 px-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl text-base sm:text-lg flex items-center justify-center gap-2.5 mx-auto">
              <img src="/naver-cafe.png" alt="카페" className="w-5 h-5 sm:w-6 sm:h-6 object-contain bg-white rounded p-0.5 group-hover:scale-110 transition-transform" /><span>제품 확인 카페</span>
            </a>
          </div>
        </div>
      </section>

      {/* 진행 과정 섹션 */}
      <section className="bg-white py-20 border-b border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-black text-[#3b82f6] tracking-widest uppercase">Systematic Process</span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-1">중고가전제품 진행 과정</h2>
            <p className="text-sm text-slate-500 mt-2">체계적인 프로세스로 안전하고 깔끔하게 진행합니다</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {[
              {t: "문의 접수", c: "전화/카톡 간편 문의", icon: "접수"}, 
              {t: "방문 및 확인", c: "사진/현장 상태 체크", icon: "확인"}, 
              {t: "견적 산출", c: "합리적인 최고가 견적", icon: "견적"}, 
              {t: "작업 진행", c: "안전한 수거 및 설치", icon: "작업"}, 
              {t: "완료 검수", c: "작업 후 현장 정리", icon: "검수"}, 
              {t: "사후 관리", c: "무상 A/S 확실 보장", icon: "관리"}
            ].map((step, i) => {
              let arrowClass = "hidden ";
              if (i === 0 || i === 4) arrowClass = "block "; 
              else if (i === 2) arrowClass = "block md:hidden lg:block "; 
              else if (i === 1 || i === 3) arrowClass = "hidden md:block "; 

              return (
                <div key={i} className="relative bg-white border border-slate-200/80 p-5 sm:p-6 rounded-3xl flex flex-col items-center text-center shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 group z-10">
                  <div className="w-12 h-12 bg-[#3b82f6] text-white font-black text-sm rounded-2xl flex items-center justify-center shadow-md mb-4 group-hover:-translate-y-1 group-hover:bg-[#0b4b8b] transition-all duration-300">
                    {step.icon}
                  </div>
                  <h3 className="font-black text-slate-900 text-[15px] sm:text-base mb-1.5">{step.t}</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed break-keep">{step.c}</p>
                  {i !== 5 && (
                    <div className={`absolute top-1/2 -translate-y-1/2 -right-3 sm:-right-4 translate-x-1/2 text-slate-300 z-0 ${arrowClass}`}>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 갤러리 섹션 */}
      <section id="reviews-section" className="max-w-7xl mx-auto px-4 py-20 scroll-mt-10 flex-1 border-b border-slate-200">
        <div className="flex flex-col items-center text-center mb-12 relative">
          <span className="text-xs font-black text-blue-600 tracking-widest uppercase">Delivery & Installation</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">배송·설치 인증 갤러리</h2>
          <p className="text-sm text-slate-500 mt-2 break-keep px-4 mb-4">한밭중고전자의 꼼꼼하고 안전한 실제 배송 및 설치 현장입니다.</p>

          <a href="/gallery" className="text-sm font-bold text-[#0b4b8b] bg-blue-50 hover:bg-blue-100 px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5">
            인증 갤러리 더보기 <span>➔</span>
          </a>

          {isAdmin && (
            <button onClick={() => setIsReviewUploadOpen(true)} className="mt-4 sm:mt-0 sm:absolute right-0 top-0 bg-[#0066FF] hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-4 py-2 sm:py-2.5 rounded-lg transition shadow-md flex items-center gap-1.5">
              <span>➕</span> <span>사진 올리기</span>
            </button>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-20 sm:py-28 bg-white rounded-3xl border border-slate-200 shadow-2xs">
            <p className="text-slate-400 text-sm">등록된 인증사진이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {reviews.slice(0, 10).map((review) => (
              <ReviewCard 
                key={review.id} 
                review={review} 
                isAdmin={isAdmin} 
                onDelete={handleDeleteReview} 
                onEnlarge={(rev: any, index: number) => {
                  setEnlargedReview(rev);
                  setEnlargedIndex(index);
                }} 
              />
            ))}
          </div>
        )}
      </section>

      {/* FAQ 섹션 */}
      <section className="bg-slate-50 py-20 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-black text-[#0b4b8b] tracking-wider uppercase drop-shadow-sm">FAQ</h2>
          </div>
          <div className="space-y-3">
            {faqData.map((faq, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden transition-all duration-300 shadow-sm">
                <button onClick={() => toggleFaq(idx)} className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition">
                  <div className="flex items-start gap-3">
                    <span className="text-[#0b4b8b] font-black text-lg leading-none mt-0.5">Q</span>
                    <span className="font-bold text-slate-900 text-sm sm:text-base pr-4">{faq.q}</span>
                  </div>
                  <span className={`text-[#0b4b8b] font-bold transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180' : ''}`}>∨</span>
                </button>
                {openFaqIndex === idx && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-[#0b4b8b] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">A</div>
                      <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <p className="text-slate-600 font-medium text-sm sm:text-base flex items-center justify-center flex-wrap gap-x-1">
              더 궁금한 점은 
              <a href="tel:042-523-8179" className="font-black text-[#0b4b8b] text-base sm:text-lg hover:underline">042-523-8179</a>
              또는 
              <a href="tel:010-6631-8179" className="font-black text-[#0b4b8b] text-base sm:text-lg hover:underline">010-6631-8179</a>
              로 편히 문의해 주세요.
            </p>
          </div>
        </div>
      </section>

      {/* 오프라인 매장 소개 & 찾아오시는 길 섹션 (문구 세련되게 변경) */}
      <section id="location-section" className="bg-white py-20 border-b border-slate-200 scroll-mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-black text-[#0b4b8b] tracking-widest uppercase">Store Location</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">대전 최대 규모 중고가전 전문 매장</h2>
            <p className="text-sm text-slate-500 mt-2 break-keep px-4">직접 눈으로 보고 안심하고 거래할 수 있는 신뢰의 오프라인 본점입니다.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden flex flex-col lg:flex-row">
            <div className="lg:w-1/2 h-[350px] sm:h-[450px] lg:h-auto relative bg-slate-100 border-b lg:border-b-0 lg:border-r border-slate-200">
              <iframe 
                src="https://maps.google.com/maps?q=대전광역시%20중구%20중촌동%20144&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                className="absolute inset-0 w-full h-full border-0" 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            <div className="lg:w-1/2 p-6 sm:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-[#0b4b8b] px-3 py-1.5 rounded-lg text-xs font-bold w-fit mb-5 border border-blue-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                정상 영업 중
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-6">가는 길 안내</h3>
              
              <div className="space-y-6 text-sm">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-xl shadow-sm">📍</div>
                  <div className="pt-0.5">
                    <strong className="block text-slate-900 mb-1 text-base">오시는 길</strong>
                    <p className="text-slate-600 font-medium leading-relaxed">대전광역시 중구 중촌동 144<br/><span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">내비게이션에 '한밭중고전자' 검색</span></p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-xl shadow-sm">⏰</div>
                  <div className="pt-0.5">
                    <strong className="block text-slate-900 mb-1 text-base">영업 시간</strong>
                    <p className="text-slate-600 font-medium leading-relaxed">월요일 ~ 토요일 : 09:00 - 19:00<br/><span className="text-red-500 text-xs font-bold">매주 일요일 정기 휴무</span></p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 text-xl shadow-sm">🚗</div>
                  <div className="pt-0.5">
                    <strong className="block text-slate-900 mb-1 text-base">주차 안내</strong>
                    <p className="text-slate-600 font-medium leading-relaxed">매장 앞 전용 주차장 무료 이용 가능<br/><span className="text-slate-500 text-xs">(대형 화물차 및 탑차 진입 가능)</span></p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <a href="https://naver.me/F5DkWQ4z" target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#03C75A] hover:bg-[#02b351] text-white text-center py-3.5 rounded-xl font-bold transition shadow-sm text-sm flex items-center justify-center gap-1.5">
                  네이버 지도로 보기
                </a>
                <a href="https://map.kakao.com/link/search/대전광역시 중구 중촌동 144" target="_blank" rel="noopener noreferrer" className="flex-1 bg-[#FEE500] hover:bg-[#FADA0A] text-slate-900 text-center py-3.5 rounded-xl font-bold transition shadow-sm text-sm flex items-center justify-center gap-1.5">
                  카카오 맵으로 보기
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 통합 문의 폼 */}
      <section id="inquiry-section" className="max-w-7xl mx-auto px-4 py-16 scroll-mt-10 border-t border-slate-200 bg-slate-50 rounded-t-[40px] mt-10">
        <div className="text-center mb-10">
          <span className="text-xs font-black text-[#0b4b8b] tracking-widest uppercase">Customer Service</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">판매 / 매입 통합 문의</h2>
          <p className="text-sm text-slate-500 mt-2 break-keep px-4">필요하신 제품 구매나 안 쓰시는 가전 매입 견적을 간편하게 남겨주세요.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 pb-4 border-b border-slate-100">CONTACT US</h3>
              <div className="space-y-6 text-sm text-slate-600">
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-1">영업 시간</span>
                  <p className="font-bold text-slate-800 text-base">09:00 - 19:00 (일 휴무)</p>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-1">대표 연락처</span>
                  <a href="tel:042-523-8179" className="font-black text-[#0b4b8b] text-[22px] hover:underline block">042-523-8179</a>
                  <a href="tel:010-6631-8179" className="font-bold text-slate-600 text-lg hover:underline block mt-1">010-6631-8179</a>
                </div>
                <div className="pt-2 border-t border-slate-50">
                  <span className="text-xs font-bold text-slate-400 block mb-2">매장 주소</span>
                  <p className="font-bold text-slate-800 mb-3 leading-snug">대전광역시 중구 중촌동 144</p>
                  <a href="https://naver.me/F5DkWQ4z" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-slate-100 text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-200 transition">
                    📍 지도에서 보기
                  </a>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a href="http://pf.kakao.com/_XmyrX/chat" target="_blank" rel="noopener noreferrer" className="bg-[#FEE500] hover:bg-[#FADA0A] text-slate-900 flex flex-col items-center justify-center p-4 rounded-2xl transition shadow-sm gap-2">
                <img src="/kakao-logo.png" alt="카카오톡" className="w-8 h-8 object-contain" />
                <span className="text-[13px] font-black">카톡 상담</span>
              </a>
              <a href="tel:042-523-8179" className="bg-[#0b4b8b] hover:bg-blue-800 text-white flex flex-col items-center justify-center p-4 rounded-2xl transition shadow-sm gap-2">
                <span className="text-3xl leading-none">📞</span>
                <span className="text-[13px] font-black">전화 상담</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <span>📝</span> 문의 및 견적 작성
              </h3>
              <form onSubmit={handleInquirySubmit} className="flex flex-col gap-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">문의 구분 *</label>
                    <select 
                      value={inquiryType} onChange={(e) => setInquiryType(e.target.value)}
                      className="w-full border border-slate-300 p-3 rounded-xl bg-white text-[15px] outline-none font-bold text-[#0b4b8b] focus:border-[#0b4b8b] focus:ring-2 focus:ring-[#0b4b8b]/20 transition"
                    >
                      <option value="구매 문의">상품 구매 문의</option>
                      <option value="내 물건 팔기">내 물건 팔기 (매입 견적)</option>
                      <option value="기타 문의">기타 문의</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">조회용 비밀번호 *</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required 
                        className="w-full border border-slate-300 p-3 rounded-xl bg-white text-sm outline-none focus:border-[#0b4b8b] focus:ring-2 focus:ring-[#0b4b8b]/20 transition pr-10" 
                        placeholder="숫자 4자리 권장" 
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0b4b8b] text-xs font-bold">
                        {showPassword ? "숨김" : "보기"}
                      </button>
                    </div>
                  </div>
                </div>

                {inquiryType === "내 물건 팔기" && (
                  <div className="col-span-1 sm:col-span-2 mt-2 mb-2 animate-fade-in-down">
                    <div className="bg-[#f0f6ff] border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-inner">
                      <p className="text-sm font-black text-[#0b4b8b] mb-3 flex items-center gap-1.5">
                        <span className="text-lg">💡</span> 빠르고 정확 매입 접수 가이드
                      </p>
                      
                      <div className="rounded-xl overflow-hidden shadow-sm border border-blue-100 mb-4 bg-white p-4 sm:p-5 text-center">
                        <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed">
                          📌 가전제품의 <span className="text-blue-600">정면, 측면, 내부(모델명 스티커)</span> 사진을 함께 첨부해 주시면 훨씬 빠르고 정확한 최고가 매입 견적 산출이 가능합니다!
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl border border-blue-100">
                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">엘리베이터 유무 (필수)</label>
                          <select value={hasElevator} onChange={(e) => setHasElevator(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 font-medium">
                            <option value="있음 (제품 적재 가능)">있음 (제품 적재 가능)</option>
                            <option value="있으나 작음 (적재 불가할 수 있음)">있으나 작음 (적재 불가할 수 있음)</option>
                            <option value="없음">없음</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">계단 작업 유무 (필수)</label>
                          <select value={hasStairs} onChange={(e) => setHasStairs(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none focus:border-blue-500 font-medium">
                            <option value="없음 (1층 또는 엘리베이터 이동)">없음 (1층 또는 엘리베이터 이동)</option>
                            <option value="있음 (몇 층인지 아래에 기재 부탁드립니다)">있음 (사람이 들고 계단 이동)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">성함 / 상호명 *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-sm outline-none focus:border-[#0b4b8b] transition" placeholder="성함을 입력해 주세요" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">연락처 *</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-sm outline-none focus:border-[#0b4b8b] transition" placeholder="010-0000-0000" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">제목 (제품명/수량) *</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-[15px] font-medium outline-none focus:border-[#0b4b8b] transition" placeholder={inquiryType === "내 물건 팔기" ? "예: 양문형 냉장고 및 세탁기 매입 견적 문의" : "예: OOO 제품 구매 및 배송 문의드립니다."} />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">상세 내용</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-sm outline-none resize-none focus:border-[#0b4b8b] transition leading-relaxed" placeholder={inquiryType === "내 물건 팔기" ? "제품의 제조년월, 수리 이력, 스크래치 등 특이사항과 주소지(동, 층수)를 자세히 적어주시면 정확한 매입 견적이 가능합니다." : "방문 희망 일정, 배송 지역 등을 자유롭게 작성해 주세요."} />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[13px] font-bold text-slate-800">📸 사진 첨부 (선택, 최대 3장)</label>
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={selectedFiles.length >= 3} className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" />
                  {filePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                      {filePreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                          <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => handleRemoveFile(index)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold hover:bg-red-500 transition">✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="privacy" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4 accent-[#0b4b8b] rounded cursor-pointer" />
                    <label htmlFor="privacy" className="text-xs text-slate-600 cursor-pointer font-medium">
                      <a href="/privacy" target="_blank" className="underline font-bold text-[#0b4b8b] hover:text-blue-800">개인정보처리방침</a>에 동의합니다. (필수)
                    </label>
                  </div>
                  <button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[200px] bg-[#0b4b8b] hover:bg-[#093c70] text-white font-black py-4 px-8 rounded-xl transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg text-[15px]">
                    {loading ? "접수 처리 중..." : "이 내용으로 접수하기"}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="mt-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>📋</span> 실시간 문의 현황
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-bold tracking-tight">총 {inquiries.length}건</span>
                  <a href="/inquiry" className="text-xs font-bold text-[#0b4b8b] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1">
                    더보기 <span>→</span>
                  </a>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[400px] pr-1 scrollbar-hide">
                {inquiries.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm">등록된 문의 내역이 없습니다.</div>
                ) : (
                  <>
                    <table className="hidden md:table w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-bold sticky top-0 bg-white z-10 text-xs">
                          <th className="py-3 px-2 w-[15%] whitespace-nowrap">유형</th>
                          <th className="py-3 px-4 w-[50%] whitespace-nowrap">제목</th>
                          <th className="py-3 px-3 w-[15%] whitespace-nowrap">작성자</th>
                          <th className="py-3 px-3 w-[10%] text-center whitespace-nowrap">상태</th>
                          <th className="py-3 px-2 w-[10%] text-right whitespace-nowrap">날짜</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {inquiries.map((inq) => (
                          <tr key={inq.id} className="hover:bg-slate-50 transition cursor-pointer" onClick={() => window.location.href='/inquiry'}>
                            <td className="py-3.5 px-2 whitespace-nowrap">
                              <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-md text-[11px]">
                                {inq.inquiry_type || '문의'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800 hover:text-[#0b4b8b] transition truncate max-w-[200px] sm:max-w-[280px]">
                              {inq.category}
                            </td>
                            <td className="py-3.5 px-3 text-slate-500 font-medium whitespace-nowrap">{inq.is_notice ? inq.name : maskName(inq.name)}</td>
                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${inq.status === '답변완료' ? 'bg-[#0b4b8b] text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                {inq.status || '접수'}
                              </span>
                            </td>
                            <td className="py-3.5 px-2 text-right text-slate-400 text-[11px] whitespace-nowrap">
                              {new Date(inq.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="md:hidden flex flex-col gap-3 pb-2">
                      {inquiries.map((inq) => (
                        <div key={inq.id} onClick={() => window.location.href='/inquiry'} className="bg-white border border-slate-200 p-4 rounded-2xl hover:border-[#0b4b8b] transition cursor-pointer shadow-xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded text-[10px]">
                              {inq.inquiry_type || '문의'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inq.status === '답변완료' ? 'bg-[#0b4b8b] text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                              {inq.status || '접수'}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-2">{inq.category}</h4>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{inq.is_notice ? inq.name : maskName(inq.name)}</span>
                            <span>{new Date(inq.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 하단 배너 */}
      <section className="max-w-7xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="bg-emerald-50 border border-emerald-200/80 p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 bg-emerald-600 text-white font-black text-2xl rounded-2xl flex items-center justify-center shrink-0 shadow-md overflow-hidden p-2">
              <img src="/naver-cafe.png" alt="제품확인카페" className="w-full h-full object-contain bg-white rounded-sm" />
            </div>
            <div>
              <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">Product Catalog</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">한밭중고전자 상품 카페</h3>
              <p className="text-xs text-slate-600 mt-1">현재 판매 중인 실제 제품들을 확인해 보세요</p>
            </div>
          </div>
          <a href="https://cafe.naver.com/hanbatmall" target="_blank" rel="noopener noreferrer" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-2xl text-xs transition shadow-md whitespace-nowrap">
            제품 보러가기 →
          </a>
        </div>

        <div className="bg-yellow-50 border border-yellow-200/80 p-8 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xs">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 bg-yellow-400 text-slate-900 font-black text-2xl rounded-2xl flex items-center justify-center shrink-0 shadow-md overflow-hidden p-2">
              <img src="/kakao-logo.png" alt="카카오톡" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-black text-yellow-800 uppercase tracking-wider">KakaoTalk Channel</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">카카오톡 채널</h3>
              <p className="text-xs text-slate-600 mt-1">사진 보내고 실시간 견적받기</p>
            </div>
          </div>
          <a href="http://pf.kakao.com/_XmyrX/chat" target="_blank" rel="noopener noreferrer" className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold px-5 py-3 rounded-2xl text-xs transition shadow-md whitespace-nowrap">
            채팅 상담 →
          </a>
        </div>
      </section>

      {/* SEO 및 로컬 검색 최적화 블록 */}
      <section className="bg-slate-100 py-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center sm:text-left">
          <h3 className="text-xs font-black text-slate-500 mb-2">
            전국 중고가전 판매·매입 전문, 한밭중고전자
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed break-keep">
            한밭중고전자는 30년 이상의 중고가전 유통 노하우를 바탕으로 중고 냉장고, 세탁기, 에어컨, 냉난방기부터 업소용 냉장고, 제빙기, 쇼케이스, 상업용 주방기기까지 다양한 제품을 판매·매입합니다. 전국 단위 판매 및 대량 거래가 가능하며, 제품 특성에 맞는 배송과 설치 서비스를 제공합니다. 가정용 중고가전부터 식당·카페·사업장의 업소용 주방기기까지 판매, 매입, 대량 거래를 한 곳에서 상담받을 수 있습니다.
          </p>

          <div className="sr-only">
            전국중고가전, 중고가전, 중고전자제품, 중고가전판매, 중고가전매입, 중고가전매장, 중고가전쇼핑몰, 중고가전전문점, 중고가전전문업체, 중고가전전국배송, 중고가전전국판매, 중고가전전국매입, 중고가전배송, 중고가전설치, 중고가전직거래, 중고가전대량판매, 중고가전대량매입, 중고전자제품판매, 중고전자제품매입, 중고제품판매, 
            중고냉장고, 중고김치냉장고, 중고세탁기, 중고건조기, 중고에어컨, 중고냉난방기, 중고TV, 중고전자레인지, 중고가전제품, 중고가정용가전, 중고4도어냉장고, 중고스탠드냉장고, 중고양문형냉장고, 중고드럼세탁기, 중고통돌이세탁기, 중고벽걸이에어컨, 중고스탠드에어컨, 중고시스템에어컨, 
            중고업소용냉장고, 중고업소용주방기기, 중고주방기기, 중고상업용냉장고, 중고식당주방기기, 중고제빙기, 중고쇼케이스, 중고냉동고, 중고냉장쇼케이스, 중고냉동쇼케이스, 중고테이블냉장고, 중고반찬냉장고, 중고업소용냉동고, 중고식기세척기, 중고주방설비, 중고식당기기, 중고카페장비, 중고식당장비, 중고급식기기, 중고상업용주방기기, 
            중고대형냉난방기, 중고대형에어컨, 중고업소용에어컨, 중고상업용에어컨, 중고천장형에어컨, 중고스탠드에어컨, 중고냉난방기판매, 중고냉난방기매입, 냉난방기중고, 에어컨중고, 에어컨중고판매, 에어컨중고매입, 대형에어컨중고, 업소용냉난방기, 상업용냉난방기, 중고냉난방기전국배송
          </div>
        </div>
      </section>

      {/* 푸터 (whitespace-nowrap으로 줄바꿈 깨짐 완전 방지) */}
      <footer className="bg-slate-950 text-slate-400 py-10 text-xs border-t border-slate-800 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 pb-4 border-b border-slate-900 text-slate-300 font-bold">
            <div className="flex flex-wrap items-center justify-center gap-3 whitespace-nowrap">
              <a href="/privacy" target="_blank" className="hover:text-white transition">개인정보처리방침</a><span>|</span>
              <button onClick={() => scrollToSection("location-section")} className="hover:text-white transition">오시는 길</button><span>|</span>
              <a href="http://pf.kakao.com/_XmyrX" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-yellow-400">카카오채널</a><span>|</span>
              <a href="https://cafe.naver.com/hanbatmall" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-emerald-400">제품 확인 카페</a>
            </div>
            <div className="text-slate-500 text-[11px] whitespace-nowrap">© 2026 한밭중고전자. All rights reserved.</div>
          </div>
          <div className="space-y-1 text-slate-400 text-[11px] sm:text-xs leading-relaxed text-center sm:text-left">
            <p><strong className="text-slate-200">상호 :</strong> 한밭중고전자 &nbsp;|&nbsp; <strong className="text-slate-200">대표자 :</strong> 김영종 &nbsp;|&nbsp; <strong className="text-slate-200">주소 :</strong> 대전광역시 중구 중촌동 144</p>
            <p><strong className="text-slate-200">TEL :</strong> 042-523-8179 / 042-527-4888 &nbsp;|&nbsp; <strong className="text-slate-200">HP :</strong> 010-5406-8179 &nbsp;|&nbsp; <strong className="text-slate-200">사업자번호 :</strong> 314-01-70945 &nbsp;|&nbsp; <strong className="text-slate-200">통신판매신고번호 :</strong> 2011-대전서구-0292</p>
            <p className="text-slate-500">개인정보 보호책임자 : 김태현(sunny3815@naver.com)</p>
          </div>
          <div className="pt-4 border-t border-slate-900 flex justify-center sm:justify-end">
            <button onClick={() => isAdmin ? handleAdminLogout() : setIsAdminAuthModalOpen(true)} className="text-slate-600 hover:text-slate-400 transition underline text-[11px] whitespace-nowrap">
              {isAdmin ? "관리자 로그아웃" : "관리자 로그인"}
            </button>
          </div>
        </div>
      </footer>

      {/* 갤러리 확대 모달 */}
      {enlargedReview && (
        <div onClick={() => setEnlargedReview(null)} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 cursor-pointer">
          <div className="relative w-full max-w-5xl flex flex-col items-center">
            
            <button 
              onClick={() => setEnlargedReview(null)}
              className="absolute -top-10 sm:-top-12 right-0 text-white/70 hover:text-white font-bold text-2xl transition"
            >
              ✕
            </button>

            <div className="relative w-full flex items-center justify-center group" onClick={(e) => e.stopPropagation()}>
              <img 
                src={enlargedReview.image_url.split(',')[enlargedIndex]} 
                alt="확대사진" 
                className="max-w-full max-h-[70vh] sm:max-h-[80vh] object-contain rounded-xl shadow-2xl transition-all duration-300" 
              />
              
              {enlargedReview.image_url.split(',').length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEnlargedIndex((prev) => (prev === 0 ? enlargedReview.image_url.split(',').length - 1 : prev - 1)); }}
                    className="absolute left-2 sm:left-4 bg-black/60 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-[#0b4b8b] transition text-sm sm:text-base shadow-xl backdrop-blur-sm"
                  >
                    ❮
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEnlargedIndex((prev) => (prev === enlargedReview.image_url.split(',').length - 1 ? 0 : prev + 1)); }}
                    className="absolute right-2 sm:right-4 bg-black/60 text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center hover:bg-[#0b4b8b] transition text-sm sm:text-base shadow-xl backdrop-blur-sm"
                  >
                    ❯
                  </button>
                  
                  <div className="absolute bottom-4 flex gap-2 z-20 bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                    {enlargedReview.image_url.split(',').map((_: any, idx: number) => (
                      <span key={idx} onClick={(e) => { e.stopPropagation(); setEnlargedIndex(idx); }} className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full cursor-pointer transition-all ${enlargedIndex === idx ? "bg-white scale-125 shadow-md" : "bg-white/40 hover:bg-white/70"}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-5 w-full max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-xl border border-white/10 cursor-default" onClick={(e) => e.stopPropagation()}>
              <div className="text-center sm:text-left">
                <span className="bg-[#0b4b8b] text-white text-[11px] font-bold px-2.5 py-1 rounded mb-2 inline-block">배송·설치 갤러리</span>
                <p className="font-black text-white text-base sm:text-lg drop-shadow-md">{enlargedReview.title}</p>
              </div>
              <button
                onClick={handleGalleryDirectInquiry}
                className="w-full sm:w-auto bg-white hover:bg-slate-100 text-[#0b4b8b] font-black py-3.5 px-6 rounded-xl transition shadow-lg whitespace-nowrap text-sm sm:text-base flex items-center justify-center gap-1.5"
              >
                <span>이 현장처럼 견적/상담 신청하기</span><span>➔</span>
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* 관리자 팝업 */}
      {isReviewUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2"><span>📸</span> 배송·설치 사진 등록</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">장소 및 내용 (제목)</label>
                <input type="text" value={reviewTitle} onChange={(e) => setReviewTitle(e.target.value)} required className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#0066FF] text-sm" placeholder="예: 둔산동 식당 냉난방기 설치" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">현장 사진 첨부 (최대 3장)</label>
                <input type="file" accept="image/*" multiple onChange={handleReviewFileChange} disabled={reviewFiles.length >= 3} required={reviewFiles.length === 0} className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" />
                {reviewPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {reviewPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleReviewRemoveFile(index)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100 mt-2">
                <button type="button" onClick={() => { setIsReviewUploadOpen(false); setReviewFiles([]); setReviewPreviews([]); setReviewTitle(""); }} className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50">취소</button>
                <button type="submit" disabled={uploadingReview} className="w-1/2 py-2.5 rounded-xl bg-[#0066FF] text-white font-bold text-xs hover:bg-blue-700 transition shadow-sm">{uploadingReview ? "업로드 중..." : "등록하기"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <h3 className="font-bold text-slate-900 text-base mb-1">관리자 인증</h3>
            <p className="text-xs text-slate-500 mb-4">관리자 마스터 비밀번호를 입력해 주세요.</p>
            <form onSubmit={handleAdminAuth} className="space-y-3">
              <input type="password" value={adminPinInput} onChange={(e) => setAdminPinInput(e.target.value)} placeholder="비밀번호" required autoFocus className="w-full border border-slate-300 rounded-xl p-2.5 text-center text-sm outline-none focus:border-[#0b4b8b]" />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setIsAdminAuthModalOpen(false); setAdminPinInput(""); }} className="w-1/2 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs">취소</button>
                <button type="submit" className="w-1/2 py-2 rounded-xl bg-[#0b4b8b] text-white font-bold text-xs hover:bg-[#093c70]">인증</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}