"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function GalleryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeCategory, setActiveCategory] = useState("전체");

  // Supabase에서 products 테이블 데이터를 불러옵니다.
  const fetchProducts = async () => {
    setIsLoading(true); // ✅ 데이터 부르기 시작: 스켈레톤 UI 켜기
    
    try {
      const { data, error } = await supabase
        .from("products") // 제품 테이블 이름 (필요시 수정)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (err) {
      console.error("제품을 불러오는데 실패했습니다:", err);
    } finally {
      setIsLoading(false); // ✅ 데이터 다 부름: 스켈레톤 UI 끄기
    }
  };

  useEffect(() => {
    // 관리자 세션 체크
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkSession();

    fetchProducts();
  }, []);

  const handleAdminLogout = async () => {
    if (confirm("관리자 모드를 종료하시겠습니까?")) {
      await supabase.auth.signOut();
      window.location.reload();
    }
  };

  // 카테고리 필터링 적용
  const filteredProducts = products.filter(product => {
    if (activeCategory === "전체") return true;
    return product.category === activeCategory;
  });

  // 임시 카테고리 목록 (원하시는 대로 수정 가능합니다)
  const categories = ["전체", "냉장고", "세탁기/건조기", "에어컨/냉난방기", "업소용기기", "기타"];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* 🟢 헤더 영역 (문의 게시판과 동일) */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-3 py-3 sm:py-0 sm:h-20 flex items-center justify-between gap-2">
          <a href="/" className="font-black text-sm sm:text-xl tracking-tight flex items-center gap-1.5 shrink-0 hover:opacity-80 transition">
            <span className="text-blue-500 text-base sm:text-2xl">⚡</span> 
            <div className="whitespace-nowrap">
              <span className="text-sm sm:text-xl font-black whitespace-nowrap">한밭중고전자</span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-normal">대전 중구 중촌동 · SINCE 1997</span>
            </div>
          </a>
          <div className="flex items-center gap-1.5 shrink-0">
            {isAdmin && (
              <button
                onClick={handleAdminLogout}
                className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] sm:text-xs font-bold px-2 py-1.5 sm:px-3 rounded-xl transition whitespace-nowrap hidden sm:block"
              >
                관리자 ON
              </button>
            )}
            <a href="/inquiry" className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-extrabold px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl transition shadow-md inline-flex items-center gap-1 border border-white whitespace-nowrap">
              <span>📝</span><span className="whitespace-nowrap">문의/견적 작성</span>
            </a>
          </div>
        </div>
      </header>

      {/* 🟢 메인 본문 영역 */}
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

        {/* 🟢 갤러리 그리드 & 스켈레톤 UI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          
          {isLoading ? (
            /* ✅ 로딩 중일 때 보여줄 바둑판 모양 스켈레톤 애니메이션 (8개) */
            Array.from({ length: 8 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-pulse">
                {/* 썸네일 이미지 자리 */}
                <div className="aspect-square bg-slate-200 w-full"></div>
                {/* 텍스트 정보 자리 */}
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
            /* 데이터가 없을 때 */
            <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200">
              해당 카테고리에 등록된 제품이 없습니다.
            </div>
          ) : (
            /* ✅ 로딩 완료 후 실제 제품 리스트 */
            filteredProducts.map((product) => {
              // Supabase의 images 배열에서 첫 번째 사진을 가져오거나, 없다면 대체 이미지 사용
              const imageUrl = product.images && product.images.length > 0 
                ? product.images[0] 
                : product.image_url || "/images/placeholder.png";

              return (
                <div key={product.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-300 group cursor-pointer flex flex-col">
                  {/* 사진 영역 */}
                  <div className="aspect-square relative overflow-hidden bg-slate-100">
                    <img 
                      src={imageUrl} 
                      alt={product.title || product.name || "제품 이미지"} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* 상태 뱃지 (예: 판매중, 판매완료) */}
                    {product.status && (
                      <div className={`absolute top-3 left-3 px-3 py-1 rounded-md text-xs font-black text-white shadow-md backdrop-blur-sm ${
                        product.status === '판매완료' ? 'bg-slate-800/80' : 'bg-[#0b4b8b]/90'
                      }`}>
                        {product.status}
                      </div>
                    )}
                  </div>
                  
                  {/* 정보 영역 */}
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 mb-1">{product.category || '기타'}</span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug mb-3 line-clamp-2 flex-1">
                      {product.title || product.name || "제품명 없음"}
                    </h3>
                    <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-100">
                      <p className="font-black text-lg text-[#0b4b8b]">
                        {product.price ? `${Number(product.price).toLocaleString()}원` : "가격 문의"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 🟢 푸터 영역 (문의 게시판과 동일) */}
      <footer className="bg-slate-950 text-slate-400 py-10 text-xs border-t border-slate-800 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 pb-4 border-b border-slate-900 text-slate-300 font-bold">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <a href="/privacy" className="hover:text-white transition whitespace-nowrap">개인정보처리방침</a>
              <span className="text-slate-600">|</span>
              <a href="/#location-section" className="hover:text-white transition whitespace-nowrap">오시는 길</a>
              <span className="text-slate-600">|</span>
              <a href="http://pf.kakao.com/_XmyrX" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-yellow-400 whitespace-nowrap">카카오채널</a>
              <span className="text-slate-600">|</span>
              <a href="https://cafe.naver.com/hanbatmall" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-emerald-400 whitespace-nowrap">제품 확인 카페</a>
            </div>
            <div className="text-slate-500 text-[11px] whitespace-nowrap">© 2026 한밭중고전자. All rights reserved.</div>
          </div>
          <div className="space-y-1 text-slate-400 text-[11px] sm:text-xs leading-relaxed text-center sm:text-left break-keep">
            <p><strong className="text-slate-200">상호 :</strong> 한밭중고전자 &nbsp;|&nbsp; <strong className="text-slate-200">대표자 :</strong> 김영종 &nbsp;|&nbsp; <strong className="text-slate-200">주소 :</strong> 대전광역시 중구 중촌동 144</p>
            <p><strong className="text-slate-200">TEL :</strong> 042-523-8179 / 042-527-4888 &nbsp;|&nbsp; <strong className="text-slate-200">HP :</strong> 010-5406-8179 &nbsp;|&nbsp; <strong className="text-slate-200">사업자번호 :</strong> 314-01-70945 &nbsp;|&nbsp; <strong className="text-slate-200">통신판매신고번호 :</strong> 2011-대전서구-0292</p>
            <p className="text-slate-500">개인정보 보호책임자 : 김태현(sunny3815@naver.com)</p>
          </div>
        </div>
      </footer>
    </div>
  );
}