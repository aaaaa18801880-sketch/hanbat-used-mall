"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function InquiryPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
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

  const fetchData = async () => {
    const { data } = await supabase.from("purchase_requests").select("*").order("created_at", { ascending: false });
    if (data) setInquiries(data);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("isAdmin") === "true") {
      setIsAdmin(true);
    }
    fetchData();
  }, []);

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

  const handleDeleteInquiry = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) {
      alert("관리자만 삭제할 수 있습니다.");
      return;
    }
    if (!confirm("이 문의 글을 정말 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase.from("purchase_requests").delete().eq("id", id);
      if (error) throw error;
      alert("삭제되었습니다.");
      fetchData();
    } catch (error: any) {
      alert("삭제 실패: " + error.message);
    }
  };

  const maskName = (rawName: string) => {
    if (!rawName) return "고*객"; if (rawName.length <= 2) return rawName.charAt(0) + "*";
    return rawName.charAt(0) + "*".repeat(rawName.length - 2) + rawName.slice(-1);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative flex flex-col">
      {/* 상단 헤더 (상단 관리자 버튼 완전히 제거 및 줄바꿈 방지) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-0 sm:h-20 flex items-center justify-between gap-2">
          <a href="/" className="font-black text-base sm:text-xl tracking-tight flex items-center gap-2 shrink-0 hover:opacity-80 transition">
            <span className="text-blue-500 text-lg sm:text-2xl">⚡</span> 
            <div>
              <span className="whitespace-nowrap">한밭중고전자</span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-normal">대전 중구 중촌동 · SINCE 1997</span>
            </div>
          </a>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
            <a href="/" className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition shadow-md inline-flex items-center gap-1 border border-white whitespace-nowrap">
              <span>🏠</span><span className="whitespace-nowrap">메인 홈으로</span>
            </a>
          </div>
        </div>
      </header>

      {/* 본문 영역 */}
      <main className="max-w-7xl mx-auto px-4 py-10 flex-1 w-full space-y-10">
        
        {/* 문의 작성 폼 */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <span>📝</span> 문의 및 견적 작성
          </h2>
          <form onSubmit={handleInquirySubmit} className="flex flex-col gap-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">문의 구분 *</label>
                <select 
                  value={inquiryType} onChange={(e) => setInquiryType(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl bg-white text-[15px] outline-none font-bold text-[#0b4b8b] focus:border-[#0b4b8b] transition"
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
                    className="w-full border border-slate-300 p-3 rounded-xl bg-white text-sm outline-none focus:border-[#0b4b8b] transition pr-10" 
                    placeholder="숫자 4자리 권장" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0b4b8b] text-xs font-bold">
                    {showPassword ? "숨김" : "보기"}
                  </button>
                </div>
              </div>
            </div>

            {inquiryType === "내 물건 팔기" && (
              <div className="col-span-1 sm:col-span-2 mt-2 mb-2">
                <div className="bg-[#f0f6ff] border border-blue-200 rounded-2xl p-4 sm:p-5 shadow-inner">
                  <p className="text-sm font-black text-[#0b4b8b] mb-3 flex items-center gap-1.5">
                    <span className="text-lg">💡</span> 빠르고 정확 매입 접수 가이드
                  </p>
                  <div className="rounded-xl overflow-hidden shadow-sm border border-blue-100 mb-4 bg-white p-4 text-center">
                    <p className="text-xs sm:text-sm font-bold text-slate-700 leading-relaxed break-keep">
                      📌 가전제품의 <span className="text-blue-600">정면, 측면, 내부(모델명 스티커)</span> 사진을 함께 첨부해 주시면 훨씬 빠르고 정확한 최고가 매입 견적 산출이 가능합니다!
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-xl border border-blue-100">
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">엘리베이터 유무 (필수)</label>
                      <select value={hasElevator} onChange={(e) => setHasElevator(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none font-medium">
                        <option value="있음 (제품 적재 가능)">있음 (제품 적재 가능)</option>
                        <option value="있으나 작음 (적재 불가할 수 있음)">있으나 작음 (적재 불가할 수 있음)</option>
                        <option value="없음">없음</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1.5">계단 작업 유무 (필수)</label>
                      <select value={hasStairs} onChange={(e) => setHasStairs(e.target.value)} className="w-full border border-slate-300 p-2.5 rounded-lg text-sm outline-none font-medium">
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
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-sm outline-none focus:border-[#0b4b8b]" placeholder="성함을 입력해 주세요" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">연락처 *</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-sm outline-none focus:border-[#0b4b8b]" placeholder="010-0000-0000" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">제목 (제품명/수량) *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-[15px] font-medium outline-none focus:border-[#0b4b8b]" placeholder={inquiryType === "내 물건 팔기" ? "예: 양문형 냉장고 및 세탁기 매입 견적 문의" : "예: OOO 제품 구매 및 배송 문의드립니다."} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">상세 내용</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-sm outline-none resize-none focus:border-[#0b4b8b]" placeholder={inquiryType === "내 물건 팔기" ? "제품의 제조년월, 수리 이력, 스크래치 등 특이사항과 주소지(동, 층수)를 자세히 적어주세요." : "방문 희망 일정, 배송 지역 등을 자유롭게 작성해 주세요."} />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <label className="block text-[13px] font-bold text-slate-800 mb-2">📸 사진 첨부 (선택, 최대 3장)</label>
              <input type="file" accept="image/*" multiple onChange={handleFileChange} disabled={selectedFiles.length >= 3} className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 cursor-pointer" />
              {filePreviews.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                  {filePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                      <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveFile(index)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="privacy" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="w-4 h-4 accent-[#0b4b8b] rounded cursor-pointer" />
                <label htmlFor="privacy" className="text-xs text-slate-600 cursor-pointer font-medium break-keep">
                  <a href="/privacy" target="_blank" className="underline font-bold text-[#0b4b8b]">개인정보처리방침</a>에 동의합니다. (필수)
                </label>
              </div>
              <button type="submit" disabled={loading} className="w-full sm:w-auto min-w-[200px] bg-[#0b4b8b] hover:bg-[#093c70] text-white font-black py-4 px-8 rounded-xl transition shadow-md text-[15px] whitespace-nowrap">
                {loading ? "접수 처리 중..." : "이 내용으로 접수하기"}
              </button>
            </div>
          </form>
        </div>

        {/* 실시간 문의 현황 목록 */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>📋</span> 전체 문의 및 접수 현황
            </h3>
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">총 {inquiries.length}건</span>
          </div>

          {inquiries.length === 0 ? (
            <div className="text-center py-20 text-slate-400 text-sm">등록된 문의 내역이 없습니다.</div>
          ) : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div key={inq.id} className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px] whitespace-nowrap">
                        {inq.inquiry_type || '문의'}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${inq.status === '답변완료' ? 'bg-[#0b4b8b] text-white' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                        {inq.status || '접수'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm sm:text-base break-keep">{inq.category}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 whitespace-nowrap">
                    <span>{inq.is_notice ? inq.name : maskName(inq.name)}</span>
                    <span>{new Date(inq.created_at).toLocaleDateString()}</span>
                    {isAdmin && (
                      <button 
                        onClick={(e) => handleDeleteInquiry(inq.id, e)} 
                        className="bg-red-600 text-white px-2.5 py-1 rounded-lg text-xs font-bold hover:bg-red-700 transition shadow-sm ml-2 whitespace-nowrap"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 푸터 (하단 관리자 로그인 버튼 배치, whitespace-nowrap 적용) */}
      <footer className="bg-slate-950 text-slate-400 py-10 text-xs border-t border-slate-800 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 pb-4 border-b border-slate-900 text-slate-300 font-bold">
            <div className="flex flex-wrap items-center justify-center gap-3 whitespace-nowrap">
              <a href="/privacy" target="_blank" className="hover:text-white transition">개인정보처리방침</a><span>|</span>
              <a href="/#location-section" className="hover:text-white transition">오시는 길</a><span>|</span>
              <a href="http://pf.kakao.com/_XmyrX" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-yellow-400">카카오채널</a><span>|</span>
              <a href="https://cafe.naver.com/hanbatmall" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-emerald-400">제품 확인 카페</a>
            </div>
            <div className="text-slate-500 text-[11px] whitespace-nowrap">© 2026 한밭중고전자. All rights reserved.</div>
          </div>
          <div className="space-y-1 text-slate-400 text-[11px] sm:text-xs leading-relaxed text-center sm:text-left break-keep">
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

      {/* 관리자 인증 모달 */}
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