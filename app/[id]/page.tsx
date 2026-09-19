import { supabase } from "../../lib/supabase";

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Supabase에서 해당 상품 정보 가져오기
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <h1 className="text-lg font-black text-slate-900 mb-2">상품을 찾을 수 없습니다.</h1>
          <p className="text-xs text-slate-500 mb-6">이미 판매가 완료되었거나 삭제된 상품입니다.</p>
          <a href="/" className="inline-block bg-slate-900 text-white font-bold px-6 py-3 rounded-xl text-xs hover:bg-slate-800 transition">
            메인으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* 상단 네비게이션 */}
      <header className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <a href="/" className="font-black text-base tracking-tight flex items-center gap-2">
            <span>← 홈으로 돌아가기</span>
          </a>
          <span className="text-xs text-slate-400">한밭중고전자 상품 상세 정보</span>
        </div>
      </header>

      {/* 메인 상세 내용 영역 */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-0">
          
          {/* 좌측: 상품 이미지 */}
          <div className="aspect-square bg-slate-100 relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-200">
            {product.image_url ? (
              <img src={product.image_url} alt={product.title} className="object-cover w-full h-full" />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">등록된 사진이 없습니다</div>
            )}
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1.5 text-xs font-black rounded-xl shadow-md ${product.status === 'sold' ? 'bg-slate-800 text-white' : 'bg-emerald-600 text-white'}`}>
                {product.status === 'sold' ? '판매완료' : '판매중'}
              </span>
            </div>
          </div>

          {/* 우측: 상품 정보 및 구매 문의 */}
          <div className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-bold">{product.category}</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-bold">{product.condition_grade}</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mb-4">{product.title}</h1>
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
                <span className="text-[11px] text-slate-400 block mb-1">판매 가격</span>
                <span className="text-2xl sm:text-3xl font-black text-blue-600">{product.price.toLocaleString()}원</span>
              </div>

              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">제품 상세 설명</h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {product.description || "등록된 상세 설명이 없습니다. 전화로 편하게 문의해 주세요!"}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4 text-xs text-slate-500 space-y-1">
                <p>📍 매장 위치: 대전광역시 중구 중촌동 144</p>
                <p>📞 문의 전화: 042-523-9179</p>
              </div>
            </div>

            {/* 하단 상담 버튼 */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex gap-3">
              <a 
                href="tel:042-523-9179" 
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-center font-bold py-4 rounded-2xl transition shadow-lg text-sm flex items-center justify-center gap-2"
              >
                <span>📞 전화로 구매 문의하기</span>
              </a>
            </div>
          </div>

        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-slate-950 text-slate-400 py-10 text-center text-xs mt-20 border-t border-slate-800">
        <p className="font-bold text-white mb-1">한밭중고전자 (SINCE 1997)</p>
        <p>대전광역시 중구 중촌동 144 | 대표전화: 042-523-9179</p>
        <p className="mt-4 text-slate-600">© 한밭중고전자. All rights reserved.</p>
      </footer>
    </div>
  );
}