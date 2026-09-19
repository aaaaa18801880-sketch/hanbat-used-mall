"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  // 탭 상태 ("products" 또는 "purchases")
  const [activeTab, setActiveTab] = useState<"products" | "purchases">("products");

  // 상품 관련 상태
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("냉장고");
  const [conditionGrade, setConditionGrade] = useState("A급 (사용감 적음)");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  // 매입 신청 목록 상태
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);

  const categories = ["냉장고", "세탁기", "TV", "에어컨", "업소용 주방기기", "사무용 가전", "기타가전"];
  const grades = ["S급 (새상품급)", "A급 (사용감 적음)", "B급 (보통)", "C급 (저렴이)"];

  // 데이터 불러오기
  const fetchData = async () => {
    // 상품 목록
    const { data: prodData } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (prodData) setProducts(prodData);

    // 매입 신청 목록
    const { data: purData } = await supabase
      .from("purchase_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (purData) setPurchaseRequests(purData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 1. 상품 등록
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      alert("상품명과 가격을 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = "";
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase
        .from("products")
        .insert({
          title,
          price: Number(price),
          category,
          condition_grade: conditionGrade,
          description,
          image_url: imageUrl,
          status: 'sale'
        });

      if (insertError) throw insertError;

      alert("상품이 성공적으로 등록되었습니다!");
      setTitle("");
      setPrice("");
      setDescription("");
      setImageFile(null);
      fetchData();
    } catch (error: any) {
      alert("등록 중 오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. 상품 삭제
  const handleDeleteProduct = async (id: string, imageUrl: string) => {
    if (!confirm("정말 이 상품을 삭제하시겠습니까?")) return;

    try {
      if (imageUrl) {
        const fileName = imageUrl.split('/').pop();
        if (fileName) {
          await supabase.storage.from("product-images").remove([fileName]);
        }
      }
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      alert("삭제되었습니다.");
      fetchData();
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 3. 상품 판매상태 토글
  const handleToggleProductStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'sale' ? 'sold' : 'sale';
    try {
      const { error } = await supabase.from("products").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 4. 매입 신청 상태 변경 (접수 -> 검토중 -> 방문예정 -> 매입완료 -> 취소)
  const handleUpdatePurchaseStatus = async (id: string, currentStatus: string) => {
    const statusFlow = ['접수', '검토중', '방문예정', '매입완료', '취소'];
    const nextIndex = (statusFlow.indexOf(currentStatus) + 1) % statusFlow.length;
    const newStatus = statusFlow[nextIndex];

    try {
      const { error } = await supabase.from("purchase_requests").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert("매입 상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 5. 매입 신청 삭제
  const handleDeletePurchase = async (id: string) => {
    if (!confirm("이 매입 신청 내역을 삭제하시겠습니까?")) return;
    try {
      const { error } = await supabase.from("purchase_requests").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 bg-gray-100 min-h-screen font-sans pb-24">
      {/* 상단 타이틀 */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 text-center border border-gray-200">
        <h1 className="text-2xl font-black text-gray-900">한밭중고전자 관리자</h1>
        <p className="text-sm text-gray-500 mt-1">상품 재고 및 고객 매입 신청 통합 관리</p>
        
        {/* 관리자 탭 전환 버튼 */}
        <div className="flex gap-2 mt-5 bg-gray-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab("products")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'products' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            📦 상품 관리 ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab("purchases")}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'purchases' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            📥 매입 신청 내역 ({purchaseRequests.length})
          </button>
        </div>
      </div>
      
      {/* TAB 1: 상품 관리 */}
      {activeTab === 'products' && (
        <>
          {/* 상품 등록 폼 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
            <h2 className="text-lg font-bold mb-4 text-gray-800">📦 새 가전제품 등록</h2>
            <form onSubmit={handleSubmitProduct} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">카테고리</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-sm font-medium outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">상품명</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  required 
                  className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-sm outline-none" 
                  placeholder="예: 삼성 양문형 냉장고 800L" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">가격 (원)</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    required 
                    className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-sm outline-none" 
                    placeholder="350000" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-1">제품 상태 등급</label>
                  <select 
                    value={conditionGrade} 
                    onChange={(e) => setConditionGrade(e.target.value)}
                    className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-sm outline-none"
                  >
                    {grades.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">제품 설명 및 특이사항</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  rows={3}
                  className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-sm outline-none resize-none" 
                  placeholder="예: 2023년식, 내외부 청소 완료, 무상 AS 3개월" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">상품 사진</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => { if (e.target.files && e.target.files.length > 0) { setImageFile(e.target.files[0]); } }} 
                  className="w-full border border-gray-300 p-2.5 rounded-xl text-xs bg-gray-50 cursor-pointer" 
                />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="mt-2 w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-md text-sm"
              >
                {loading ? "등록 처리 중..." : "상품 등록하기"}
              </button>
            </form>
          </div>

          {/* 등록된 상품 목록 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center justify-between">
              <span>📋 등록된 상품 목록</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold">총 {products.length}개</span>
            </h2>
            
            <div className="flex flex-col gap-3">
              {products.length === 0 ? (
                <div className="text-center text-gray-400 py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
                  등록된 상품이 없습니다.
                </div>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 border border-gray-200 p-3.5 rounded-xl bg-white">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg shrink-0 relative overflow-hidden border border-gray-100">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.title} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-[10px] text-gray-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">사진없음</span>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-hidden pr-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">{product.category}</span>
                        <span className="text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{product.condition_grade}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm truncate mb-0.5">{product.title}</h3>
                      <p className="text-blue-600 font-extrabold text-sm">{product.price.toLocaleString()}원</p>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button 
                        onClick={() => handleToggleProductStatus(product.id, product.status)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${product.status === 'sold' ? 'bg-gray-600 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
                      >
                        {product.status === 'sold' ? '판매완료' : '판매중'}
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id, product.image_url)}
                        className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition border border-red-100"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB 2: 매입 신청 내역 관리 */}
      {activeTab === 'purchases' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center justify-between">
            <span>📥 들어온 매입 신청</span>
            <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-bold">총 {purchaseRequests.length}건</span>
          </h2>
          
          <div className="flex flex-col gap-4">
            {purchaseRequests.length === 0 ? (
              <div className="text-center text-gray-400 py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
                접수된 매입 신청이 없습니다.
              </div>
            ) : (
              purchaseRequests.map((req) => (
                <div key={req.id} className="border border-gray-200 p-4 rounded-xl bg-white shadow-2xs flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${
                          req.status === '매입완료' ? 'bg-blue-600 text-white' :
                          req.status === '방문예정' ? 'bg-green-600 text-white' :
                          req.status === '검토중' ? 'bg-orange-500 text-white' :
                          req.status === '취소' ? 'bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {req.status}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-bold">{req.category}</span>
                        <span className="text-xs text-gray-400">{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base">{req.name} <span className="text-sm font-normal text-gray-600">({req.phone})</span></h3>
                      <p className="text-xs text-gray-500 mt-0.5">📍 수거 지역: <strong className="text-gray-700">{req.region}</strong></p>
                    </div>

                    {req.image_url && (
                      <a href={req.image_url} target="_blank" rel="noopener noreferrer" className="w-14 h-14 bg-gray-100 rounded-lg shrink-0 overflow-hidden border border-gray-200">
                        <img src={req.image_url} alt="신청 제품 사진" className="object-cover w-full h-full" />
                      </a>
                    )}
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-700 flex flex-col gap-1">
                    <p><strong>모델명:</strong> {req.model || '미입력'}</p>
                    <p><strong>상태등급:</strong> {req.condition_grade}</p>
                    {req.description && <p><strong>설명:</strong> {req.description}</p>}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <a href={`tel:${req.phone}`} className="text-xs font-bold bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition">
                      📞 전화 걸기
                    </a>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUpdatePurchaseStatus(req.id, req.status)}
                        className="text-xs font-bold bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition"
                      >
                        상태 변경 🔄
                      </button>
                      <button 
                        onClick={() => handleDeletePurchase(req.id)}
                        className="text-xs font-bold bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition border border-red-100"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}