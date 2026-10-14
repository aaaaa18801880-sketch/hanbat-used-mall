"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import {
  PRODUCT_CATEGORIES,
  STORAGE_BUCKETS,
  formatPhone,
  isValidPhone,
  compressImage,
  validateImageFiles,
} from "../../lib/site";
import { SiteHeader, SiteFooter } from "../../lib/ui";

export default function PurchasePage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[1]); // 냉장고
  const [model, setModel] = useState("");
  const [conditionGrade, setConditionGrade] = useState("A급 (사용감 적음)");
  const [region, setRegion] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const grades = [
    "S급 (새상품급)",
    "A급 (사용감 적음)",
    "B급 (보통)",
    "C급 (노후됨/고장)",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !region.trim()) {
      toast.error("성함, 연락처, 수거 지역은 필수 입력 항목입니다.");
      return;
    }
    if (!isValidPhone(phone)) {
      toast.error("연락처를 정확히 입력해 주세요.");
      return;
    }
    if (password.trim().length < 4) {
      toast.error("문의게시판 조회용 비밀번호를 4자리 이상 입력해 주세요.");
      return;
    }
    if (!agreed) {
      toast.error("개인정보 수집·이용에 동의해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const uploadedUrls: string[] = [];

      if (imageFile) {
        const { ok, error: fileErr } = validateImageFiles([imageFile], 1);
        if (fileErr || ok.length === 0) {
          throw new Error(fileErr || "이미지 파일만 업로드할 수 있습니다.");
        }
        const blob = await compressImage(ok[0]);
        const fileName = `purchase_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .upload(fileName, blob, { contentType: "image/jpeg" });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      const unifiedTitle = `[${category}] ${model.trim() || "중고가전"} 매입 신청 (${region.trim()})`;
      const unifiedDescription = [
        `• 품목: ${category}`,
        model.trim() ? `• 모델명: ${model.trim()}` : null,
        `• 상태등급: ${conditionGrade}`,
        `• 수거지역: ${region.trim()}`,
        description.trim() ? `\n[상세 설명]\n${description.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          password: password.trim(),
          inquiry_type: "내 물건 팔기",
          category: unifiedTitle,
          model: model.trim() || null,
          condition_grade: conditionGrade,
          region: region.trim(),
          description: unifiedDescription,
          images: uploadedUrls,
          is_notice: false,
        }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || "매입 신청 접수에 실패했습니다.");
      }

      fetch("/api/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          type: "내 물건 팔기",
          title: unifiedTitle,
        }),
      }).catch(() => {});

      setSubmitted(true);
    } catch (error: any) {
      toast.error("신청 중 오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F6F5F2] flex flex-col font-sans">
        <SiteHeader />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-xs border border-[#E4E0D8] text-center max-w-md w-full">
            <h1 className="text-xl font-bold text-[#0E1A2B] mb-2">
              매입 신청이 완료되었습니다!
            </h1>
            <p className="text-sm text-[#4B5260] mb-6">
              문의게시판에서 설정하신 비밀번호로 진행 상태와 답변을 확인하실 수 있습니다.
            </p>
            <div className="flex gap-2 justify-center">
              <a
                href="/inquiry"
                className="inline-block bg-[#0E1A2B] text-white font-bold px-5 py-3 rounded-md text-sm"
              >
                문의게시판 확인
              </a>
              <a
                href="/"
                className="inline-block border border-[#DDD9D1] bg-white text-[#0E1A2B] font-bold px-5 py-3 rounded-md text-sm"
              >
                홈으로 이동
              </a>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F5F2] font-sans flex flex-col">
      <SiteHeader />
      <main className="flex-1 py-10 px-4">
        <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-xs border border-[#E4E0D8]">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#0E1A2B]">
              중고 가전 매입 신청
            </h1>
            <p className="text-sm text-[#4B5260] mt-1">
              안 쓰는 가전제품을 사진과 함께 간편하게 견적 받아보세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                  성함 / 상호명 *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-[#DDD9D1] p-3 rounded-md text-sm"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                  연락처 *
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  required
                  className="w-full border border-[#DDD9D1] p-3 rounded-md text-sm"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                  품목
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-[#DDD9D1] p-3 rounded-md bg-white text-sm"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                  상태 등급
                </label>
                <select
                  value={conditionGrade}
                  onChange={(e) => setConditionGrade(e.target.value)}
                  className="w-full border border-[#DDD9D1] p-3 rounded-md bg-white text-sm"
                >
                  {grades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                  모델명 / 제조사 (선택)
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full border border-[#DDD9D1] p-3 rounded-md text-sm"
                  placeholder="예: 삼성 양문형 냉장고"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                  수거 지역 (동/구까지) *
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  required
                  className="w-full border border-[#DDD9D1] p-3 rounded-md text-sm"
                  placeholder="예: 대전 중구 중촌동"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                조회용 비밀번호 (4자리 이상) *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={4}
                className="w-full border border-[#DDD9D1] p-3 rounded-md text-sm"
                placeholder="문의게시판에서 내 글 확인 시 사용됩니다"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                제품 사진 첨부
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setImageFile(e.target.files[0]);
                  }
                }}
                className="w-full border border-[#DDD9D1] p-2.5 rounded-md text-xs bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                상세 설명 (사용 기간, 특이사항 등)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-[#DDD9D1] p-3 rounded-md text-sm resize-none"
                placeholder="예: 3년 정도 사용했고, 이사로 인해 내놓습니다."
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-[#4B5260] cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-[#0E1A2B]"
              />
              <span>
                매입 견적 상담을 위해 성함·연락처·지역 정보를 수집하며,{" "}
                <a href="/privacy" target="_blank" className="underline font-bold">
                  개인정보 수집·이용
                </a>
                에 동의합니다. *
              </span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-[#D9531E] text-white font-bold py-3.5 rounded-md hover:bg-[#BF4715] transition text-sm disabled:opacity-50"
            >
              {loading ? "접수 처리 중..." : "매입 신청하기"}
            </button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
