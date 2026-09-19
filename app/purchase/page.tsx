"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PurchasePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("냉장고");
  const [model, setModel] = useState("");
  const [conditionGrade, setConditionGrade] = useState("A급 (깨끗함)");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = ["냉장고", "세탁기", "TV", "에어컨", "업소용 주방기기", "사무용 가전", "기타가전"];
  const grades = ["S급 (새상품급)", "A급 (사용감 적음)", "B급 (보통)", "C급 (노후됨/고장)"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !region) {
      alert("이름, 연락처, 지역은 필수 입력 항목입니다.");
      return;
    }

    setLoading(true);

    try {
      let imageUrl = "";

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `purchase_${Date.now()}.${fileExt}`;
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
        .from("purchase_requests")
        .insert({
          name,
          phone,
          category,
          model,
          condition_grade: conditionGrade,
          region,
          description,
          image_url: imageUrl,
          status: '접수'
        });

      if (insertError) throw insertError;

      setSubmitted(true);
    } catch (error: any) {
      alert("신청 중 오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center max-w-md w-full">
          <div className="text-4xl mb-3">🎉</div>
          <h1 className="text-xl font-black text-gray-900 mb-2">매입 신청이 완료되었습니다!</h1>
          <p className="text-sm text-gray-500 mb-6">검토 후 빠르게 연락드리겠습니다. 감사합니다.</p>
          <a href="/" className="inline-block bg-blue-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-blue-700 transition">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans py-10 px-4">
      <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-gray-900">중고 가전 매입 신청</h1>
          <p className="text-sm text-gray-500 mt-1">안 쓰는 가전제품을 사진과 함께 간편하게 팔아보세요!</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">성함 / 상호명 *</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-sm outline-none" 
                placeholder="홍길동" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">연락처 *</label>
              <input 
                type="text" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                required 
                className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-sm outline-none" 
                placeholder="010-0000-0000" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">품목</label>
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-sm outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">상태 등급</label>
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
            <label className="block text-xs font-bold text-gray-600 mb-1">모델명 / 제조사 (선택)</label>
            <input 
              type="text" 
              value={model} 
              onChange={(e) => setModel(e.target.value)} 
              className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-sm outline-none" 
              placeholder="예: 삼성 양문형 냉장고" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">수거 지역 (동/구까지) *</label>
            <input 
              type="text" 
              value={region} 
              onChange={(e) => setRegion(e.target.value)} 
              required 
              className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-sm outline-none" 
              placeholder="예: 대전 중구 중촌동" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">제품 사진 첨부</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => { if (e.target.files && e.target.files.length > 0) { setImageFile(e.target.files[0]); } }} 
              className="w-full border border-gray-300 p-2.5 rounded-xl text-xs bg-gray-50 cursor-pointer" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">상세 설명 (사용 기간, 특이사항 등)</label>
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows={3}
              className="w-full border border-gray-300 p-3 rounded-xl bg-gray-50 text-sm outline-none resize-none" 
              placeholder="예: 3년 정도 사용했고, 이사로 인해 내놓습니다." 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="mt-3 w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-md text-sm"
          >
            {loading ? "접수 처리 중..." : "매입 신청하기"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a href="/" className="text-xs text-gray-500 hover:underline">← 메인으로 돌아가기</a>
        </div>
      </div>
    </div>
  );
}