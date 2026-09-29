"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

export default function GalleryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeCategory, setActiveCategory] = useState("전체");

  // 관리자 로그인 모달 상태
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 상품 등록 모달 상태
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [productTitle, setProductTitle] = useState("");
  const [productCategory, setProductCategory] = useState("냉장고");
  const [productPrice, setProductPrice] = useState("");
  const [productStatus, setProductStatus] = useState("판매중");
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);

  const categories = ["전체", "냉장고", "세탁기/건조기", "에어컨/냉난방기", "업소용기기", "기타"];
  const registerCategories = ["냉장고", "세탁기/건조기", "에어컨/냉난방기", "업소용기기", "기타"];

  // Supabase 제품 데이터 불러오기
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (err) {
      console.error("제품을 불러오는데 실패했습니다:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const categoryQuery = params.get("category");
      if (categoryQuery && categories.includes(categoryQuery)) {
        setActiveCategory(categoryQuery);
      }
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAdmin(!!session);
    });

    fetchProducts();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 관리자 로그인 처리
  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
      });
      if (error) throw error;
      toast.success("관리자 로그인에 성공했습니다.");
      setIsAdminAuthModalOpen(false);
      setAdminEmail("");
      setAdminPassword("");
    } catch (error: any) {
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

  // 이미지 압축 함수
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (productFiles.length + files.length > 3) {
      toast.error("사진은 최대 3장까지 등록 가능합니다.");
      return;
    }
    setProductFiles([...productFiles, ...files]);
    setProductPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const handleRemoveFile = (index: number) => {
    setProductFiles(productFiles.filter((_, i) => i !== index));
    setProductPreviews(productPreviews.filter((_, i) => i !== index));
  };

  // 상품 등록 제출
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle || productFiles.length === 0) {
      toast.error("제품명과 최소 1장의 사진을 등록해주세요.");
      return;
    }

    setUploadingProduct(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of productFiles) {
        const compressedBlob = await compressImage(file);
        const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const { error: uploadError } = await supabase.storage.from("inquiries").upload(fileName, compressedBlob, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        const uploadedUrl = supabase.storage.from("inquiries").getPublicUrl(fileName).data.publicUrl;
        uploadedUrls.push(uploadedUrl);
      }

      const finalImageString = uploadedUrls.join(',');
      const parsedPrice = productPrice ? Number(productPrice.replace(/[^0-9]/g, '')) : 0;

      const { error } = await supabase.from("products").insert({
        title: productTitle, 
        category: productCategory, 
        image_url: finalImageString, 
        price: parsedPrice, 
        status: productStatus 
      });

      if (error) throw error;
      toast.success("새 상품이 성공적으로 등록되었습니다!");
      setIsUploadModalOpen(false);
      setProductTitle("");
      setProductPrice("");
      setProductFiles([]);
      setProductPreviews([]);
      fetchProducts();
    } catch (error: any) {
      toast.error("등록 실패: " + error.message);
    } finally {
      setUploadingProduct(false);
    }
  };

  // 제품 삭제 (관리자 전용)
  const handleDeleteProduct = async (id: string) => {
    if (!confirm("이 제품을 갤러리에서 정말 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("제품이 삭제되었습니다.");
      fetchProducts();
    } catch (error: any) {
      toast.error("삭제 실패: " + error.message);
    }
  };

  const filteredProducts = products.filter(product => {
    if (activeCategory === "전체") return true;
    return product.category === activeCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-0 sm:h-20 flex items-center justify-between gap-2">
          <a href="/" className="font-black text-sm sm:text-xl tracking-tight flex items-center gap-1.5 shrink-0 hover:opacity-80 transition">
            <span className="text-blue-500 text-base sm:text-2xl">⚡</span> 
            <div className="whitespace-nowrap">
              <span className="text-sm sm:text-xl font-black whitespace-nowrap">한밭중고전자</span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-normal">대전 중구 중촌동 · SINCE 1997</span>
            </div>
          </a>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl transition shadow-md flex items-center gap-1.5 whitespace-nowrap"
              >
                <span>➕</span> <span>상품 등록하기</span>
              </button>
            )}
            <a href="/inquiry" className="bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-extrabold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition shadow-md inline-flex items-center gap-1 border border-white whitespace-nowrap">
              <span>📋</span><span>문의게시판</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">판매 제품 갤러리</h1>
          <p className="text-slate-500 text-sm sm:text-base">한밭중고전자의 꼼꼼한 검수를 거친 A급 제품들을 만나보세요.</p>
        </div>

        {/* 카테고리 탭 */}
        <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition shadow-sm border ${
                activeCategory === cat
                  ? "bg-[#0b4b8b] text-white border-[#0b4b8b]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 갤러리 그리드 & 스켈레톤 UI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-pulse">
                <div className="aspect-square bg-slate-200 w-full"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 rounded-md w-4/5"></div>
                  <div className="h-4 bg-slate-200 rounded-md w-1/2"></div>
                  <div className="pt-2">
                    <div className="h-6 bg-slate-300 rounded-md w-1/3"></div>
                  </div>
                </div>
              </div>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200 shadow-sm">
              해당 카테고리에 등록된 제품이 없습니다.
            </div>
          ) : (
            filteredProducts.map((product) => {
              const images = product.image_url ? product.image_url.split(',') : [];
              const mainImage = images.length > 0 ? images[0] : "/images/placeholder.png";

              return (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col relative">
                  <div className="aspect-square relative overflow-hidden bg-slate-100">
                    <img 
                      src={mainImage} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {product.status && (
                      <div className={`absolute top-3 left-3 px-3 py-1 rounded-md text-xs font-black text-white shadow-md backdrop-blur-sm ${
                        product.status === '판매완료' ? 'bg-slate-800/80' : 'bg-[#0b4b8b]/90'
                      }`}>
                        {product.status}
                      </div>
                    )}
                    {isAdmin && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }} 
                        className="absolute top-3 right-3 bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700 transition z-20"
                        title="상품 삭제"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 mb-1">{product.category || '기타'}</span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug mb-3 line-clamp-2 flex-1">
                      {product.title}
                    </h3>
                    <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-100">
                      <p className="font-black text-lg text-[#0b4b8b]">
                        {product.price && product.price > 0 ? `${Number(product.price).toLocaleString()}원` : "가격 문의"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 푸터 */}
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

      {/* 🟢 상품 등록 팝업 모달 */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8">
            <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-2"><span>📦</span> 판매 상품 등록</h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">카테고리 *</label>
                <select 
                  value={productCategory} 
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 font-bold text-[#0b4b8b] outline-none focus:border-[#0b4b8b]"
                >
                  {registerCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">제품명 / 상세 타이틀 *</label>
                <input 
                  type="text" 
                  value={productTitle} 
                  onChange={(e) => setProductTitle(e.target.value)} 
                  required 
                  className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-sm outline-none focus:border-[#0b4b8b]" 
                  placeholder="예: 삼성 비스포크 4도어 양문형 냉장고" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">판매 가격 (원)</label>
                  <input 
                    type="text" 
                    value={productPrice} 
                    onChange={(e) => setProductPrice(e.target.value)} 
                    className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-sm outline-none focus:border-[#0b4b8b]" 
                    placeholder="예: 450000 (공백 시 가격 문의)" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">판매 상태</label>
                  <select 
                    value={productStatus} 
                    onChange={(e) => setProductStatus(e.target.value)}
                    className="w-full border border-slate-300 p-3 rounded-xl bg-slate-50 font-bold text-slate-800 outline-none focus:border-[#0b4b8b]"
                  >
                    <option value="판매중">판매중</option>
                    <option value="판매완료">판매완료</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">제품 사진 첨부 (최대 3장) *</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={handleFileChange} 
                  disabled={productFiles.length >= 3} 
                  required={productFiles.length === 0} 
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer" 
                />
                {productPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {productPreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleRemoveFile(index)} className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setIsUploadModalOpen(false); setProductFiles([]); setProductPreviews([]); }} 
                  className="w-1/2 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                >
                  취소
                </button>
                <button 
                  type="submit" 
                  disabled={uploadingProduct} 
                  className="w-1/2 py-3 rounded-xl bg-[#0b4b8b] text-white font-bold text-sm hover:bg-[#093c70] transition shadow-md"
                >
                  {uploadingProduct ? "등록 중..." : "등록하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🟢 관리자 로그인 팝업 모달 */}
      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <h3 className="font-bold text-slate-900 text-base mb-1">관리자 로그인</h3>
            <p className="text-xs text-slate-500 mb-4">관리자 이메일과 비밀번호를 입력해 주세요.</p>
            <form onSubmit={handleAdminAuth} className="space-y-3">
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="이메일 주소"
                required
                autoFocus
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0b4b8b]"
              />
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="비밀번호"
                required
                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0b4b8b]"
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminAuthModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-1/2 py-2.5 rounded-xl bg-[#0b4b8b] text-white font-bold text-xs hover:bg-[#093c70] transition disabled:opacity-50"
                >
                  {isLoggingIn ? "인증 중..." : "로그인"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}