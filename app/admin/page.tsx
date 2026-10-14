"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
   supabase,
  isAuthorizedAdminUser,
  getAdminAuthHeaders,
} from "../../lib/supabase";
import {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS,
  STORAGE_BUCKETS,
  isProductSold,
  getProductStatusLabel,
  normalizeProductCategory,
  formatProductPrice,
  splitImages,
  compressImage,
  validateImageFiles,
  extractInquiryImages,
} from "../../lib/site";

export default function AdminPage() {
  const [authChecking, setAuthChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<"products" | "purchases">("products");

  // 상품 등록 상태 (표준 카테고리/상태값 적용)
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>(PRODUCT_CATEGORIES[0]);
  const [conditionGrade, setConditionGrade] = useState("A급 (사용감 적음)");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  // 문의/매입 신청 목록 상태
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);

  const grades = [
    "S급 (새상품급)",
    "A급 (사용감 적음)",
    "B급 (보통)",
    "C급 (저렴이)",
  ];

  // 관리자 권한이 확인된 경우에만 데이터를 조회합니다.
  const fetchData = useCallback(async () => {
    try {
      const { data: prodData, error: prodErr } = await supabase
        .from("products")
        .select("*")
        .neq("category", "배송인증")
        .order("created_at", { ascending: false });

      if (!prodErr && prodData) {
        setProducts(prodData);
      }

      // 서버 API를 통해 관리자 토큰 검증 후 문의/매입 목록 조회
      const headers = await getAdminAuthHeaders();
      const res = await fetch("/api/inquiries", { headers });
      if (res.ok) {
        const json = await res.json();
        setPurchaseRequests(json.inquiries || []);
      }
    } catch (err) {
      console.error("관리자 데이터 로드 오류:", err);
    }
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const authorized = isAuthorizedAdminUser(session?.user);
      setIsAdmin(authorized);
      setAuthChecking(false);
      if (authorized) {
        fetchData();
      }
    };

    verifySession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const authorized = isAuthorizedAdminUser(session?.user);
        setIsAdmin(authorized);
        setAuthChecking(false);
        if (authorized) {
          fetchData();
        } else {
          setProducts([]);
          setPurchaseRequests([]);
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, [fetchData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });
      if (error) throw error;

      if (!isAuthorizedAdminUser(data.user)) {
        await supabase.auth.signOut();
        toast.error("관리자 권한이 허용되지 않은 계정입니다.");
        return;
      }

      toast.success("관리자 인증이 완료되었습니다.");
      setAdminPassword("");
    } catch {
      toast.error("로그인 실패: 이메일 또는 비밀번호를 확인해 주세요.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    toast.success("로그아웃되었습니다.");
  };

  // 1. 상품 등록 (표준 상태값 '판매중' 및 'inquiries' 스토리지 버킷으로 통일)
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!title.trim()) {
      toast.error("상품명을 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const { ok, error: fileErr } = validateImageFiles([imageFile], 1);
        if (fileErr || ok.length === 0) {
          throw new Error(fileErr || "유효하지 않은 이미지 파일입니다.");
        }
        const blob = await compressImage(ok[0]);
        const fileName = `product_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .upload(fileName, blob, { contentType: "image/jpeg" });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKETS.inquiries)
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      const parsedPrice = price ? Number(price.replace(/[^0-9]/g, "")) : 0;

      const { error: insertError } = await supabase.from("products").insert({
        title: title.trim(),
        price: parsedPrice,
        category: normalizeProductCategory(category),
        condition_grade: conditionGrade,
        description: description.trim(),
        image_url: imageUrl,
        status: PRODUCT_STATUS.SELLING,
        views: 0,
      });

      if (insertError) throw insertError;

      toast.success("상품이 정상적으로 등록되었습니다.");
      setTitle("");
      setPrice("");
      setDescription("");
      setImageFile(null);
      fetchData();
    } catch (error: any) {
      toast.error("등록 중 오류가 발생했습니다: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. 상품 삭제
  const handleDeleteProduct = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("정말 이 상품을 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast.success("삭제되었습니다.");
      fetchData();
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  // 3. 상품 판매상태 토글 (표준 상태값 '판매중' <-> '판매완료' 사용, 기존 'sale'/'sold' 호환)
  const handleToggleProductStatus = async (id: string, currentStatus: string) => {
    if (!isAdmin) return;
    const currentlySold = isProductSold(currentStatus);
    const newStatus = currentlySold
      ? PRODUCT_STATUS.SELLING
      : PRODUCT_STATUS.SOLD;

    try {
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
      fetchData();
    } catch {
      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 4. 문의/매입 신청 상태 변경 (서버 API 경유)
  const handleUpdatePurchaseStatus = async (id: string, currentStatus: string) => {
    if (!isAdmin) return;
    const statusFlow = ["접수", "검토중", "방문예정", "답변완료", "매입완료", "취소"];
    const nextIndex = (statusFlow.indexOf(currentStatus) + 1) % statusFlow.length;
    const newStatus = statusFlow[nextIndex];

    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("상태 변경 실패");
      fetchData();
    } catch {
      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 5. 문의/매입 신청 삭제 (서버 API 경유)
  const handleDeletePurchase = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm("이 문의/매입 신청 내역을 삭제하시겠습니까?")) return;
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch(`/api/inquiries/${id}`, {
        method: "DELETE",
        headers: { ...headers, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("삭제 실패");
      toast.success("삭제되었습니다.");
      fetchData();
    } catch {
      toast.error("삭제 중 오류가 발생했습니다.");
    }
  };

  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] text-sm text-[#4B5260]">
        관리자 권한을 확인하고 있습니다...
      </div>
    );
  }

  // 비로그인 또는 비인가 사용자 접근 차단 화면
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F6F5F2] p-4 font-sans">
        <div className="bg-white p-8 rounded-xl shadow-md border border-[#E4E0D8] w-full max-w-sm">
          <h1 className="text-xl font-bold text-[#0E1A2B] mb-1 text-center">
            한밭중고전자 관리자 인증
          </h1>
          <p className="text-xs text-[#6B7280] mb-6 text-center">
            인가된 관리자 계정으로 로그인해야 접근할 수 있습니다.
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                관리자 이메일
              </label>
              <input
                type="email"
                required
                autoComplete="username"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full border border-[#DDD9D1] p-3 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                비밀번호
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full border border-[#DDD9D1] p-3 rounded-md text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-[#0E1A2B] text-white font-bold py-3 rounded-md text-sm hover:bg-[#22324A] disabled:opacity-50"
            >
              {loggingIn ? "인증 확인 중..." : "관리자 로그인"}
            </button>
          </form>
          <div className="mt-5 text-center">
            <a href="/" className="text-xs text-[#6B7280] hover:underline">
              ← 홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-[#F6F5F2] min-h-screen font-sans pb-24">
      <div className="bg-white p-6 rounded-xl shadow-xs mb-6 border border-[#E4E0D8]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0E1A2B]">
              한밭중고전자 통합 관리자
            </h1>
            <p className="text-xs text-[#6B7280] mt-0.5">
              상품 재고 및 고객 문의·매입 신청 관리
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-md"
          >
            로그아웃
          </button>
        </div>

        <div className="flex gap-2 mt-5 bg-[#F6F5F2] p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`flex-1 py-2.5 rounded-md text-xs font-bold transition ${
              activeTab === "products"
                ? "bg-[#0E1A2B] text-white shadow-xs"
                : "text-[#4B5260]"
            }`}
          >
            상품 관리 ({products.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("purchases")}
            className={`flex-1 py-2.5 rounded-md text-xs font-bold transition ${
              activeTab === "purchases"
                ? "bg-[#0E1A2B] text-white shadow-xs"
                : "text-[#4B5260]"
            }`}
          >
            문의·매입 내역 ({purchaseRequests.length})
          </button>
        </div>
      </div>

      {activeTab === "products" && (
        <>
          <div className="bg-white p-6 rounded-xl shadow-xs border border-[#E4E0D8] mb-8">
            <h2 className="text-base font-bold mb-4 text-[#0E1A2B]">
              새 가전제품 등록
            </h2>
            <form onSubmit={handleSubmitProduct} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                  표준 카테고리
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-[#DDD9D1] p-3 rounded-md bg-white text-sm font-medium"
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
                  상품명 *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full border border-[#DDD9D1] p-3 rounded-md text-sm"
                  placeholder="예: 삼성 양문형 냉장고 800L"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                    가격 (원, 비우면 상담문의)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-[#DDD9D1] p-3 rounded-md text-sm"
                    placeholder="350000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                    제품 상태 등급
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

              <div>
                <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                  제품 설명 및 특이사항
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full border border-[#DDD9D1] p-3 rounded-md text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0E1A2B] mb-1">
                  상품 사진
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

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-[#0E1A2B] text-white font-bold py-3.5 rounded-md hover:bg-[#22324A] transition text-sm"
              >
                {loading ? "등록 처리 중..." : "상품 등록하기"}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-xs border border-[#E4E0D8]">
            <h2 className="text-base font-bold mb-4 text-[#0E1A2B]">
              등록된 상품 목록 ({products.length}개)
            </h2>
            <div className="flex flex-col gap-3">
              {products.map((product) => {
                const imgs = splitImages(product.image_url);
                const sold = isProductSold(product.status);
                const statusLabel = getProductStatusLabel(product.status);
                const catLabel = normalizeProductCategory(product.category);

                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-3 border border-[#E4E0D8] p-3.5 rounded-lg bg-white"
                  >
                    <div className="w-16 h-16 bg-[#F6F5F2] rounded overflow-hidden shrink-0 border border-[#E4E0D8]">
                      {imgs[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgs[0]}
                          alt={product.title}
                          className="object-cover w-full h-full"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] bg-[#F6F5F2] text-[#4B5260] px-2 py-0.5 rounded font-bold">
                          {catLabel}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#0E1A2B] text-sm truncate">
                        {product.title}
                      </h3>
                      <p className="text-[#D9531E] font-bold text-sm">
                        {formatProductPrice(product.price, catLabel)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleProductStatus(product.id, product.status)
                        }
                        className={`px-3 py-1.5 text-xs font-bold rounded transition ${
                          sold
                            ? "bg-[#8A8478] text-white"
                            : "bg-[#0E1A2B] text-white"
                        }`}
                      >
                        {statusLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="px-3 py-1.5 text-xs font-bold bg-red-50 text-red-600 rounded border border-red-200"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {activeTab === "purchases" && (
        <div className="bg-white p-6 rounded-xl shadow-xs border border-[#E4E0D8]">
          <h2 className="text-base font-bold mb-4 text-[#0E1A2B]">
            접수된 문의 및 매입 신청 ({purchaseRequests.length}건)
          </h2>
          <div className="flex flex-col gap-4">
            {purchaseRequests.map((req) => {
              const imgs = extractInquiryImages(req);
              return (
                <div
                  key={req.id}
                  className="border border-[#E4E0D8] p-4 rounded-lg bg-white flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded bg-[#0E1A2B] text-white font-bold">
                          {req.status || "접수"}
                        </span>
                        <span className="text-xs bg-[#F6F5F2] text-[#4B5260] px-2 py-0.5 rounded font-bold">
                          {req.inquiry_type || "문의"}
                        </span>
                        <span className="text-xs text-[#8A8478]">
                          {new Date(req.created_at).toLocaleDateString("ko-KR")}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#0E1A2B] text-sm">
                        {req.category}
                      </h3>
                      <p className="text-xs text-[#4B5260] mt-0.5">
                        고객명: <strong>{req.name}</strong>{" "}
                        {req.phone && `(${req.phone})`}
                      </p>
                    </div>
                    {imgs[0] && (
                      <a
                        href={imgs[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-14 h-14 bg-[#F6F5F2] rounded shrink-0 overflow-hidden border border-[#E4E0D8]"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgs[0]}
                          alt="첨부 사진"
                          className="object-cover w-full h-full"
                        />
                      </a>
                    )}
                  </div>

                  {req.description && (
                    <div className="bg-[#FAF9F7] p-3 rounded text-xs text-[#4B5260] whitespace-pre-wrap">
                      {req.description}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-[#EEEBE5]">
                    {req.phone ? (
                      <a
                        href={`tel:${req.phone}`}
                        className="text-xs font-bold bg-[#F6F5F2] text-[#0E1A2B] px-3 py-1.5 rounded border border-[#DDD9D1]"
                      >
                        📞 전화 걸기
                      </a>
                    ) : (
                      <span />
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdatePurchaseStatus(req.id, req.status || "접수")
                        }
                        className="text-xs font-bold bg-[#0E1A2B] text-white px-3 py-1.5 rounded"
                      >
                        상태 변경
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePurchase(req.id)}
                        className="text-xs font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded border border-red-200"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
