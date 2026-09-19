"use client";

import { useState, useEffect } from "react";
// ⚠️ 경로 주의: lib 폴더가 최상위(루트)에 있다면 '../../lib/supabase' 가 맞습니다.
import { supabase } from "../../lib/supabase";

// ✅ 메인 화면과 동일한 다중 이미지 슬라이드 카드
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
    <div 
      onClick={() => onEnlarge(review, currentIndex)} 
      className="group relative bg-slate-100 rounded-xl sm:rounded-2xl overflow-hidden aspect-square shadow-sm border border-slate-200 cursor-pointer"
    >
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
            <span 
              key={idx} 
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${currentIndex === idx ? "bg-white scale-125 shadow-sm" : "bg-white/50"}`}
            />
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

export default function GalleryPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  
  // ✅ 갤러리 페이지용 관리자 인증 상태
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");

  // 관리자 업로드용 상태
  const [isReviewUploadOpen, setIsReviewUploadOpen] = useState(false);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewFiles, setReviewFiles] = useState<File[]>([]); 
  const [reviewPreviews, setReviewPreviews] = useState<string[]>([]);
  const [uploadingReview, setUploadingReview] = useState(false);

  // 갤러리 확대 모달용 상태
  const [enlargedReview, setEnlargedReview] = useState<any | null>(null);
  const [enlargedIndex, setEnlargedIndex] = useState(0);

  const fetchData = async () => {
    const { data: revData } = await supabase
      .from("products")
      .select("*")
      .eq("category", "배송인증")
      .order("created_at", { ascending: false });
    if (revData) setReviews(revData);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("isAdmin") === "true") {
      setIsAdmin(true);
    }
    fetchData();
  }, []);

  // ✅ 갤러리 페이지용 관리자 인증 및 로그아웃 핸들러
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === "8179") {
      setIsAdmin(true);
      if (typeof window !== "undefined") sessionStorage.setItem("isAdmin", "true");
      setIsAdminAuthModalOpen(false);
      setAdminPinInput("");
      alert("관리자 모드가 활성화되었습니다.");
    } else alert("관리자 비밀번호가 일치하지 않습니다.");
  };

  const handleAdminLogout = () => {
    if (confirm("관리자 모드를 종료하시겠습니까?")) {
      setIsAdmin(false);
      if (typeof window !== "undefined") sessionStorage.removeItem("isAdmin");
      alert("관리자 모드가 종료되었습니다.");
      window.location.reload();
    }
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative flex flex-col">
      
      {/* 헤더 */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <a href="/" className="font-black text-lg sm:text-xl tracking-tight flex items-center gap-2 hover:opacity-80 transition">
            <span className="text-blue-500 text-xl sm:text-2xl">⚡</span> 
            <div>
              <span>한밭중고전자</span>
            </div>
          </a>
          <div className="flex items-center gap-3">
            <a href="/#inquiry-section" className="bg-[#0b4b8b] hover:bg-blue-800 text-white text-xs sm:text-sm font-bold px-4 py-2 sm:py-2.5 rounded-lg transition shadow-md hidden sm:block">
              견적/상담 신청
            </a>
            <a href="/" className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold px-4 py-2 sm:py-2.5 rounded-lg transition border border-slate-700 flex items-center gap-1.5">
              <span>🏠</span> <span className="hidden sm:inline">메인으로 돌아가기</span>
            </a>
          </div>
        </div>
      </header>

      {/* 갤러리 메인 콘텐츠 */}
      <section className="max-w-7xl mx-auto px-4 py-10 sm:py-16 flex-1 w-full">
        <div className="flex flex-col items-center text-center mb-10 sm:mb-14 relative">
          <span className="text-[10px] sm:text-xs font-black text-blue-600 tracking-widest uppercase bg-blue-100 px-3 py-1 rounded-full mb-3">전체보기</span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-1 tracking-tight">배송·설치 인증 갤러리</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-3 break-keep max-w-lg mx-auto">
            한밭중고전자가 직접 진행한 수많은 배송 및 설치 현장입니다. 고객님들의 소중한 실제 작업 사례를 확인해 보세요.
          </p>

          {isAdmin && (
            <button 
              onClick={() => setIsReviewUploadOpen(true)} 
              className="mt-6 sm:mt-0 sm:absolute right-0 top-0 bg-[#0066FF] hover:bg-blue-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2"
            >
              <span>➕</span> <span>사진 올리기</span>
            </button>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-20 sm:py-32 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-4xl mb-4 block opacity-30">📸</span>
            <p className="text-slate-500 font-medium">아직 등록된 인증사진이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
            {reviews.map((review) => (
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

{/* ✅ 하단 SEO 및 로컬 검색 최적화 블록 */}
      <section className="bg-slate-100 py-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center sm:text-left">
          <h3 className="text-xs font-black text-slate-500 mb-2">
            전국 중고가전 판매·매입 전문, 한밭중고전자
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed break-keep">
            한밭중고전자는 30년 이상의 중고가전 유통 노하우를 바탕으로 중고 냉장고, 세탁기, 에어컨, 냉난방기부터 업소용 냉장고, 제빙기, 쇼케이스, 상업용 주방기기까지 다양한 제품을 판매·매입합니다. 전국 단위 판매 및 대량 거래가 가능하며, 제품 특성에 맞는 배송과 설치 서비스를 제공합니다. 가정용 중고가전부터 식당·카페·사업장의 업소용 주방기기까지 판매, 매입, 대량 거래를 한 곳에서 상담받을 수 있습니다.
          </p>

          {/* 🚨 고객 눈에는 절대 안 보이고(sr-only), 검색 로봇만 읽어가는 74개 핵심 키워드 🚨 */}
          <div className="sr-only">
            전국중고가전, 중고가전, 중고전자제품, 중고가전판매, 중고가전매입, 중고가전매장, 중고가전쇼핑몰, 중고가전전문점, 중고가전전문업체, 중고가전전국배송, 중고가전전국판매, 중고가전전국매입, 중고가전배송, 중고가전설치, 중고가전직거래, 중고가전대량판매, 중고가전대량매입, 중고전자제품판매, 중고전자제품매입, 중고제품판매, 
            중고냉장고, 중고김치냉장고, 중고세탁기, 중고건조기, 중고에어컨, 중고냉난방기, 중고TV, 중고전자레인지, 중고가전제품, 중고가정용가전, 중고4도어냉장고, 중고스탠드냉장고, 중고양문형냉장고, 중고드럼세탁기, 중고통돌이세탁기, 중고벽걸이에어컨, 중고스탠드에어컨, 중고시스템에어컨, 
            중고업소용냉장고, 중고업소용주방기기, 중고주방기기, 중고상업용냉장고, 중고식당주방기기, 중고제빙기, 중고쇼케이스, 중고냉동고, 중고냉장쇼케이스, 중고냉동쇼케이스, 중고테이블냉장고, 중고반찬냉장고, 중고업소용냉동고, 중고식기세척기, 중고주방설비, 중고식당기기, 중고카페장비, 중고식당장비, 중고급식기기, 중고상업용주방기기, 
            중고대형냉난방기, 중고대형에어컨, 중고업소용에어컨, 중고상업용에어컨, 중고천장형에어컨, 중고스탠드에어컨, 중고냉난방기판매, 중고냉난방기매입, 냉난방기중고, 에어컨중고, 에어컨중고판매, 에어컨중고매입, 대형에어컨중고, 업소용냉난방기, 상업용냉난방기, 중고냉난방기전국배송
          </div>
        </div>
      </section>

      {/* ✅ 메인 홈페이지와 완벽히 동일한 상세 푸터 */}
      <footer className="bg-slate-950 text-slate-400 py-10 text-xs border-t border-slate-800 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-900 text-slate-300 font-bold">
            <div className="flex items-center gap-4">
              <a href="/privacy" target="_blank" className="hover:text-white transition">개인정보처리방침</a><span>|</span>
              <a href="/#location-section" className="hover:text-white transition">오시는 길</a><span>|</span>
              <a href="http://pf.kakao.com/_XmyrX" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-yellow-400">카카오채널</a><span>|</span>
              <a href="https://cafe.naver.com/hanbatmall" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-emerald-400">제품 확인 카페</a>
            </div>
            <div className="text-slate-500 text-[11px]">© 2026 한밭중고전자. All rights reserved.</div>
          </div>
          <div className="space-y-1 text-slate-400 text-[11px] sm:text-xs leading-relaxed">
            <p><strong className="text-slate-200">상호 :</strong> 한밭중고전자 &nbsp;|&nbsp; <strong className="text-slate-200">대표자 :</strong> 김영종 &nbsp;|&nbsp; <strong className="text-slate-200">주소 :</strong> 대전광역시 중구 중촌동 144</p>
            <p><strong className="text-slate-200">TEL :</strong> 042-523-8179 / 042-527-4888 &nbsp;|&nbsp; <strong className="text-slate-200">HP :</strong> 010-5406-8179 &nbsp;|&nbsp; <strong className="text-slate-200">사업자번호 :</strong> 314-01-70945 &nbsp;|&nbsp; <strong className="text-slate-200">통신판매신고번호 :</strong> 2011-대전서구-0292</p>
            <p className="text-slate-500">개인정보 보호책임자 : 김태현(sunny3815@naver.com)</p>
          </div>
          
          <div className="pt-4 border-t border-slate-900 flex justify-end">
            <button onClick={() => isAdmin ? handleAdminLogout() : setIsAdminAuthModalOpen(true)} className="text-slate-600 hover:text-slate-400 transition underline text-[11px]">
              {isAdmin ? "관리자 로그아웃" : "관리자 로그인"}
            </button>
          </div>
        </div>
      </footer>

      {/* 갤러리 다중 이미지 확대 모달 */}
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
              <a
                href="/#inquiry-section"
                className="w-full sm:w-auto bg-white hover:bg-slate-100 text-[#0b4b8b] font-black py-3.5 px-6 rounded-xl transition shadow-lg whitespace-nowrap text-sm sm:text-base flex items-center justify-center gap-1.5"
              >
                <span>이 현장처럼 견적/상담 신청하기</span><span>➔</span>
              </a>
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