"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import {
  STORE, telHref, formatPhone, isValidPhone, maskName, splitImages,
  compressImage, validateImageFiles, MAX_PHOTOS,
} from "../../lib/site";
import {
  Icon, ICON, SafeImg, Modal, SiteHeader, SiteFooter, MobileCtaBar, AdminLoginModal,
} from "../../lib/ui";

/* ════════════════════════════════════════════════════════════
   타입 및 공용 상수
   ════════════════════════════════════════════════════════════ */
interface Product {
  id: string;
  title: string;
  category: string | null;
  description?: string | null;
  image_url: string | null;
  price: number | null;
  status: string | null;
  created_at: string;
  views?: number | null;
}

const isNewProduct = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
const hasPrice = (p: Product) => !!p.price && p.price > 0;
const formatPrice = (p: Product) => (hasPrice(p) ? `${Number(p.price).toLocaleString()}원` : "가격 문의");
const isSold = (p: Product) => p.status === "판매완료";

const BTN = "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
const BTN_ACCENT = `${BTN} bg-[#D9531E] text-white hover:bg-[#BF4715] focus-visible:ring-[#D9531E]`;
const BTN_NAVY = `${BTN} bg-[#0E1A2B] text-white hover:bg-[#22324A] focus-visible:ring-[#0E1A2B]`;
const BTN_LINE = `${BTN} border border-[#0E1A2B]/15 bg-white text-[#0E1A2B] hover:border-[#0E1A2B]/60 focus-visible:ring-[#0E1A2B]`;
const BTN_KAKAO = `${BTN} bg-[#FEE500] text-[#191600] hover:bg-[#F2D900] focus-visible:ring-[#191600]`;
const INPUT = "w-full rounded-md border border-[#DDD9D1] bg-white px-3.5 py-3 text-[15px] text-[#0E1A2B] placeholder:text-neutral-400 transition-colors focus:border-[#0E1A2B] focus:outline-none focus:ring-1 focus:ring-[#0E1A2B]";
const LABEL = "mb-1.5 block text-[13px] font-semibold text-[#0E1A2B]";

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 opacity-70 mt-px">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/* ════════════════════════════════════════════════════════════
   상세 보기 모달 컴포넌트 (가로/세로 모든 사진 완벽 대응)
   ════════════════════════════════════════════════════════════ */
function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const images = splitImages(product.image_url);
  const displayImages = images.length > 0 ? images : [""];
  const [idx, setIdx] = useState(0);
  const sold = isSold(product);
  const go = (d: number) => setIdx((i) => (i + d + displayImages.length) % displayImages.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (displayImages.length < 2) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [displayImages.length]);

  return (
    <Modal onClose={onClose} label={`${product.title} 상세 정보`} panelClassName="sm:max-w-4xl" sheet={false}>
      <div className="bg-white rounded-lg shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[92vh] w-full">
        {/* 왼쪽: 제품 사진 영역 (가로/세로 모든 비율 완벽 대응 화이트 프레임) */}
        <div className="w-full md:w-1/2 bg-[#F6F5F2] border-b md:border-b-0 md:border-r border-[#E4E0D8] p-4 sm:p-6 flex flex-col justify-between">
          {/* 메인 이미지 액자 프레임 */}
          <div className="relative flex-1 min-h-[280px] sm:min-h-[360px] w-full bg-white rounded-lg border border-[#E4E0D8] flex items-center justify-center p-3 overflow-hidden shadow-xs">
            <SafeImg
              key={displayImages[idx]}
              src={displayImages[idx]}
              alt={product.title}
              eager
              className={`max-w-full max-h-full w-auto h-auto object-contain select-none transition-all duration-200 ${sold ? "grayscale opacity-75" : ""}`}
            />
            {sold && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/50 backdrop-blur-xs">
                <span className="px-5 py-2 rounded bg-[#0E1A2B]/90 text-white text-[15px] font-bold tracking-[0.2em] border border-white/20">
                  SOLD
                </span>
              </div>
            )}
            {displayImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="이전 사진"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 text-[#0E1A2B] shadow-md border border-[#E4E0D8] flex items-center justify-center hover:bg-white hover:scale-105 transition-all focus-visible:ring-2 focus-visible:ring-[#0E1A2B] z-10"
                >
                  <Icon d={ICON.left} className="w-4 h-4 text-[#0E1A2B]" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="다음 사진"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 text-[#0E1A2B] shadow-md border border-[#E4E0D8] flex items-center justify-center hover:bg-white hover:scale-105 transition-all focus-visible:ring-2 focus-visible:ring-[#0E1A2B] z-10"
                >
                  <Icon d={ICON.right} className="w-4 h-4 text-[#0E1A2B]" />
                </button>
                <span className="absolute bottom-2.5 right-2.5 bg-[#0E1A2B]/75 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-xs z-10">
                  {idx + 1} / {displayImages.length}
                </span>
              </>
            )}
          </div>

          {/* 하단 썸네일 스트립 (2장 이상일 때만 표시) */}
          {displayImages.length > 1 && (
            <div className="flex gap-2 mt-3 pt-3 border-t border-[#E4E0D8] overflow-x-auto scrollbar-hide shrink-0">
              {displayImages.map((img, i) => (
                <button
                  key={img + i}
                  type="button"
                  onClick={() => setIdx(i)}
                  aria-label={`${i + 1}번 사진 보기`}
                  className={`relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-md overflow-hidden bg-white border transition-all ${
                    i === idx
                      ? "border-[#D9531E] ring-2 ring-[#D9531E]/30 scale-102"
                      : "border-[#E4E0D8] opacity-60 hover:opacity-100"
                  }`}
                >
                  <SafeImg src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 오른쪽: 상세 정보 영역 */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col max-h-[50vh] md:max-h-none overflow-y-auto bg-white">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-bold text-[#8A8478] bg-[#F6F5F2] border border-[#E4E0D8] px-2.5 py-1 rounded-sm">{product.category || "기타"}</span>
              <span className={`text-[12px] font-bold text-white px-2.5 py-1 rounded-sm ${sold ? "bg-[#8A8478]" : "bg-[#0E1A2B]"}`}>{product.status || "판매중"}</span>
            </div>
            <button type="button" onClick={onClose} aria-label="닫기" className="text-[#8A8478] hover:text-[#0E1A2B] transition-colors -mr-2 -mt-2 p-2">
              <Icon d={ICON.close} className="w-6 h-6" />
            </button>
          </div>

          <h2 className="text-[22px] sm:text-[26px] font-bold text-[#0E1A2B] leading-snug mb-3 tracking-tight">{product.title}</h2>
          
          {/* 판매 가격 박스 ("가격 문의" 줄바꿈 깨짐 방지) */}
          <div className="flex items-center justify-between gap-3 mb-6 bg-[#FAF9F7] p-4 rounded-md border border-[#E4E0D8]">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-[#8A8478] block mb-1">판매 가격</span>
              {sold ? (
                <p className="text-[26px] sm:text-[30px] font-bold tracking-tight leading-none text-[#8A8478] whitespace-nowrap">
                  판매완료
                </p>
              ) : hasPrice(product) ? (
                <p className="text-[26px] sm:text-[30px] font-bold tracking-tight leading-none text-[#D9531E] whitespace-nowrap">
                  {formatPrice(product)}
                </p>
              ) : (
                <a
                  href={telHref(STORE.tel)}
                  className="group inline-flex items-center gap-2 text-[26px] sm:text-[30px] font-bold tracking-tight leading-none text-[#D9531E] hover:text-[#BF4715] transition-colors whitespace-nowrap"
                  title="전화 문의하기 (042-523-8179)"
                >
                  <span className="underline decoration-2 underline-offset-4">가격 문의</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D9531E] bg-[#FFF5F0] border border-[#FADCD0] px-2 py-1 rounded-sm group-hover:bg-[#D9531E] group-hover:text-white transition-all shadow-xs shrink-0">
                    <Icon d={ICON.phone} className="w-3 h-3" /> 연결
                  </span>
                </a>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-[#E4E0D8] px-3 py-2 rounded-md text-[13px] text-[#4B5260] font-semibold shadow-xs shrink-0">
              <EyeIcon /> 
              <span>조회 <strong className="text-[#0E1A2B]">{product.views || 0}</strong>회</span>
            </div>
          </div>

          {product.description && (
            <div className="mb-6 p-4 rounded-md bg-[#FAF9F7] border border-[#E4E0D8]">
              <span className="text-[12px] font-bold text-[#8A8478] block mb-1.5">제품 규격 및 상세 설명</span>
              <p className="text-[14px] text-[#0E1A2B] whitespace-pre-wrap leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          <ul className="text-[14px] text-[#4B5260] space-y-2.5 mb-8 bg-[#FAF9F7] rounded-md p-5 border border-[#E4E0D8] leading-relaxed">
            <li className="flex items-start gap-2"><Icon d={ICON.check} className="w-4 h-4 text-[#D9531E] mt-0.5 shrink-0" /> 꼼꼼한 세척·검수를 거친 A급 제품입니다.</li>
            <li className="flex items-start gap-2"><Icon d={ICON.check} className="w-4 h-4 text-[#D9531E] mt-0.5 shrink-0" /> 구매 후 A/S와 세금계산서 발행이 가능합니다.</li>
            <li className="flex items-start gap-2"><Icon d={ICON.check} className="w-4 h-4 text-[#D9531E] mt-0.5 shrink-0" /> 대전, 충청, 세종 외 지역 배송·설치는 전화로 문의해 주세요.</li>
          </ul>

          <div className="mt-auto space-y-3 pt-4">
            {sold && <p className="text-[13px] text-[#D9531E] font-semibold text-center mb-1">이 제품은 판매가 완료되었습니다. 유사 제품은 전화로 문의해 주세요.</p>}
            <a href={telHref(STORE.tel)} className={`${BTN_NAVY} w-full h-[52px] text-[15px]`}>
              <Icon d={ICON.phone} className="w-4 h-4" /> 전화 문의 {STORE.tel}
            </a>
            <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className={`${BTN_KAKAO} w-full h-[52px] text-[15px]`}>
              <Icon d={ICON.chat} className="w-4 h-4" /> 카톡으로 사진 보내고 상담
            </a>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════
   메인 갤러리 페이지 컴포넌트
   ════════════════════════════════════════════════════════════ */
export default function GalleryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"latest" | "priceAsc" | "priceDesc" | "views">("latest");
  const [onlySelling, setOnlySelling] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  /* 관리자 로그인 팝업 */
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  /* 상품 등록 팝업 상태 */
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [productTitle, setProductTitle] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [productCategory, setProductCategory] = useState("에어컨/냉난방기");
  const [productPrice, setProductPrice] = useState("");
  const [productStatus, setProductStatus] = useState("판매중");
  const [productFiles, setProductFiles] = useState<File[]>([]);
  const [productPreviews, setProductPreviews] = useState<string[]>([]);
  const [uploadingProduct, setUploadingProduct] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  /* AI 인터넷 검색 옵션 */
  const [searchSpecs, setSearchSpecs] = useState(true);
  const [reviewWarnings, setReviewWarnings] = useState<string[]>([]);
  const [foundSources, setFoundSources] = useState<string[]>([]);

  const categories = ["전체", "에어컨/냉난방기", "냉장고", "세탁기/건조기", "업소용기기", "기타"];
  const registerCategories = ["에어컨/냉난방기", "냉장고", "세탁기/건조기", "업소용기기", "기타"];

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("products").select("*").neq("category", "배송인증").order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setProducts(data as Product[]);
    } catch (err) {
      console.error("제품을 불러오는데 실패했습니다:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const categoryQuery = new URLSearchParams(window.location.search).get("category");
      if (categoryQuery && categories.includes(categoryQuery)) setActiveCategory(categoryQuery);
    }

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAdmin(!!session);
    };
    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setIsAdmin(!!session));

    fetchProducts();
    return () => authListener.subscription.unsubscribe();
  }, []);

  const changeCategory = (cat: string) => {
    setActiveCategory(cat);
    const url = new URL(window.location.href);
    if (cat === "전체") url.searchParams.delete("category");
    else url.searchParams.set("category", cat);
    window.history.replaceState(null, "", url.toString());
  };

  const handleProductClick = async (product: Product) => {
    setSelectedProduct(product);

    if (isAdmin) return;

    try {
      const viewedStr = sessionStorage.getItem("viewed_products") || "[]";
      const viewedList = JSON.parse(viewedStr) as string[];

      if (viewedList.includes(product.id)) return;

      viewedList.push(product.id);
      sessionStorage.setItem("viewed_products", JSON.stringify(viewedList));

      const newViews = (product.views || 0) + 1;
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, views: newViews } : p)));
      setSelectedProduct((prev) => (prev && prev.id === product.id ? { ...prev, views: newViews } : prev));

      await supabase.from("products").update({ views: newViews }).eq("id", product.id);
    } catch (error) {
      console.error("조회수 증가 실패:", error);
    }
  };

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: adminEmail, password: adminPassword });
      if (error) throw error;
      toast.success("관리자 로그인에 성공했습니다.");
      setIsAdminAuthModalOpen(false);
      setAdminEmail("");
      setAdminPassword("");
    } catch {
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

  const resetUploadForm = () => {
    productPreviews.forEach((u) => URL.revokeObjectURL(u));
    setProductTitle("");
    setProductDescription("");
    setProductPrice("");
    setProductStatus("판매중");
    setProductFiles([]);
    setProductPreviews([]);
    setReviewWarnings([]);
    setFoundSources([]);
    setSearchSpecs(true);
    setIsAnalyzing(false);
  };

  const analyzeImageWithAI = async (filesToAnalyze: File[]) => {
    setIsAnalyzing(true);
    const toastId = toast.loading(
      searchSpecs
        ? "AI가 사진을 판독하고 구글에서 공식 제원을 정밀 검색 중입니다..."
        : "AI가 사진에서 모델 규격을 판독 중입니다..."
    );

    try {
      const formData = new FormData();
      formData.append("category", productCategory);
      formData.append("searchSpecs", searchSpecs ? "true" : "false");

      for (const file of filesToAnalyze.slice(0, MAX_PHOTOS)) {
        const compressedBlob = await compressImage(file);
        const optimizedFile = new File([compressedBlob], file.name, { type: "image/jpeg" });
        formData.append("files", optimizedFile);
      }

      const res = await fetch("/api/analyze-product", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "분석 요청에 실패했습니다.");
      }

      // AI 자동 분류 카테고리 적용
      if (data.category && registerCategories.includes(data.category)) {
        setProductCategory(data.category);
      }

      if (data.title) {
        setProductTitle(data.title);
      }

      if (data.specDetails) {
        setProductDescription(data.specDetails);
      }

      if (Array.isArray(data.needsReview) && data.needsReview.length > 0) {
        setReviewWarnings(data.needsReview);
      } else {
        setReviewWarnings([]);
      }

      if (Array.isArray(data.sourceUrls) && data.sourceUrls.length > 0) {
        setFoundSources(data.sourceUrls);
      } else {
        setFoundSources([]);
      }

      toast.success(
        data.category 
          ? `'${data.category}' 카테고리로 자동 분류되었습니다!` 
          : "제품 정보가 완성되었습니다!", 
        { id: toastId }
      );
    } catch (error: any) {
      console.error("AI 분석 오류:", error);
      toast.error(error.message || "라벨 분석에 실패했습니다.", { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const { ok, error } = validateImageFiles(files);
    if (error) toast.error(error);
    if (productFiles.length + ok.length > MAX_PHOTOS) {
      toast.error(`사진은 최대 ${MAX_PHOTOS}장까지 등록 가능합니다.`);
      return;
    }

    const updatedFiles = [...productFiles, ...ok];
    setProductFiles(updatedFiles);
    setProductPreviews((prev) => [...prev, ...ok.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";

    if (productFiles.length === 0 && ok.length > 0) {
      analyzeImageWithAI(ok);
    }
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(productPreviews[index]);
    setProductFiles(productFiles.filter((_, i) => i !== index));
    setProductPreviews(productPreviews.filter((_, i) => i !== index));
  };

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
        const blob = await compressImage(file);
        const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const { error: uploadError } = await supabase.storage.from("inquiries").upload(fileName, blob, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        uploadedUrls.push(supabase.storage.from("inquiries").getPublicUrl(fileName).data.publicUrl);
      }
      const parsedPrice = productPrice ? Number(productPrice.replace(/[^0-9]/g, "")) : 0;
      const { error } = await supabase.from("products").insert({
        title: productTitle.trim(),
        category: productCategory,
        description: productDescription.trim(),
        image_url: uploadedUrls.join(","),
        price: parsedPrice,
        status: productStatus,
        views: 0,
      });
      if (error) throw error;
      toast.success("새 상품이 성공적으로 등록되었습니다!");
      setIsUploadModalOpen(false);
      resetUploadForm();
      fetchProducts();
    } catch (error: any) {
      toast.error("등록 실패: " + error.message);
    } finally {
      setUploadingProduct(false);
    }
  };

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

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { 전체: products.length };
    products.forEach((p) => {
      const key = p.category || "기타";
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [products]);

  const sellingCount = useMemo(() => products.filter((p) => !isSold(p)).length, [products]);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (activeCategory === "전체" || (p.category || "기타") === activeCategory) &&
        (!onlySelling || !isSold(p)) &&
        (!q || (p.title || "").toLowerCase().includes(q))
    );
    const MAX = Number.MAX_SAFE_INTEGER;
    return [...list].sort((a, b) => {
      const soldA = isSold(a) ? 1 : 0;
      const soldB = isSold(b) ? 1 : 0;
      if (soldA !== soldB) return soldA - soldB;
      if (sort === "priceAsc") return (hasPrice(a) ? a.price! : MAX) - (hasPrice(b) ? b.price! : MAX);
      if (sort === "priceDesc") return (b.price || 0) - (a.price || 0);
      if (sort === "views") return (b.views || 0) - (a.views || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products, activeCategory, onlySelling, search, sort]);

  const resetFilters = () => {
    setSearch("");
    setOnlySelling(false);
    changeCategory("전체");
  };

  return (
    <div className="min-h-screen bg-[#F6F5F2] text-[#1F2530] font-sans flex flex-col">
      <SiteHeader>
        {isAdmin && (
          <button type="button" onClick={() => setIsUploadModalOpen(true)} className="hidden sm:inline-flex bg-[#0E1A2B] text-white text-[12px] font-bold px-3 py-1.5 rounded transition hover:bg-[#22324A] whitespace-nowrap gap-1 items-center shadow-sm">
            <Icon d={ICON.plus} className="w-3.5 h-3.5" /> 상품 등록
          </button>
        )}
        {isAdmin && (
          <button type="button" onClick={handleAdminLogout} title="클릭하여 관리자 모드 종료" className="hidden sm:inline-flex bg-red-500/10 text-red-500 border border-red-500/20 text-[12px] font-bold px-3 py-1.5 rounded text-center transition hover:bg-red-500/20 whitespace-nowrap">
            관리자 모드 ON
          </button>
        )}
        <a href={`tel:${STORE.tel}`} className="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0E1A2B] px-2 xl:px-3 hover:underline underline-offset-4 whitespace-nowrap">
          <Icon d={ICON.phone} className="w-4 h-4" /> {STORE.tel}
        </a>
      </SiteHeader>

      <section className="bg-white border-b border-[#E4E0D8]">
        <div className="max-w-[1000px] mx-auto px-5 py-12 sm:py-20 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#D9531E] mb-3">Product Gallery</p>
          <h1 className="text-[28px] sm:text-[36px] font-bold text-[#0E1A2B] mb-4 tracking-[-0.02em]">판매 제품 갤러리</h1>
          <p className="text-[15px] text-[#4B5260] leading-relaxed max-w-xl mx-auto break-keep">
            한밭중고전자의 꼼꼼한 세척과 검수를 마친 A급 제품들을 확인하세요. 구매 관련 문의는 전화나 카톡으로 연락 주시면 빠르게 재고를 확인해 드립니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            {!isLoading && <span className="px-3 py-1 rounded bg-[#0E1A2B] text-white text-[12px] font-semibold tracking-wide">판매중 {sellingCount}건</span>}
            <span className="px-3 py-1 rounded border border-[#E4E0D8] bg-[#F6F5F2] text-[#8A8478] text-[12px] font-semibold tracking-wide">무상 A/S</span>
            <span className="px-3 py-1 rounded border border-[#E4E0D8] bg-[#F6F5F2] text-[#8A8478] text-[12px] font-semibold tracking-wide">세금계산서</span>
          </div>
        </div>
      </section>

      <div className="sticky top-[68px] z-30 bg-white/95 backdrop-blur-md border-b border-[#E4E0D8] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1" role="tablist">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeCategory(cat)}
                  className={`px-4 py-2 rounded text-[14px] font-semibold whitespace-nowrap transition-colors border shrink-0 focus-visible:ring-2 focus-visible:ring-[#0E1A2B] ${
                    active ? "bg-[#0E1A2B] text-white border-[#0E1A2B]" : "bg-white text-[#4B5260] border-[#DDD9D1] hover:bg-[#F6F5F2]"
                  }`}
                >
                  {cat}
                  <span className={`ml-1.5 text-[12px] font-medium ${active ? "text-white/60" : "text-[#8A8478]"}`}>{categoryCounts[cat] || 0}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"><Icon d={ICON.search} className="w-4 h-4" /></span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="제품명 검색"
                aria-label="제품명 검색"
                className="w-full pl-10 pr-3 py-2.5 rounded border border-[#DDD9D1] bg-white text-[14px] outline-none focus:border-[#0E1A2B] focus:ring-1 focus:ring-[#0E1A2B] transition-colors placeholder:text-neutral-400"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              aria-label="정렬"
              className="w-32 shrink-0 py-2.5 pl-3 pr-2 rounded border border-[#DDD9D1] bg-white text-[14px] font-semibold text-[#4B5260] outline-none focus:border-[#0E1A2B] transition-colors"
            >
              <option value="latest">최신 등록순</option>
              <option value="views">조회 많은순</option>
              <option value="priceAsc">낮은 가격순</option>
              <option value="priceDesc">높은 가격순</option>
            </select>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 flex-1 w-full">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[13px] text-[#8A8478]">
            {isLoading ? "제품을 불러오는 중..." : <>검색결과 <strong className="text-[#0E1A2B]">{visibleProducts.length}</strong>건</>}
          </p>
          <label className="flex items-center gap-2 text-[13px] font-bold text-[#4B5260] cursor-pointer select-none">
            <input type="checkbox" checked={onlySelling} onChange={(e) => setOnlySelling(e.target.checked)} className="w-4 h-4 accent-[#0E1A2B]" />
            판매중만 보기
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="bg-white rounded-md overflow-hidden border border-[#E4E0D8] animate-pulse">
                <div className="aspect-[3/4] bg-[#EFECE6] w-full" />
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="h-3 bg-[#EFECE6] rounded w-1/4" />
                  <div className="h-5 bg-[#EFECE6] rounded w-4/5" />
                  <div className="h-6 bg-[#EFECE6] rounded w-1/2 pt-2 mt-4" />
                </div>
              </div>
            ))
          ) : visibleProducts.length === 0 ? (
            <div className="col-span-full py-20 px-6 text-center bg-white rounded-md border border-[#E4E0D8] shadow-sm">
              <p className="text-[#0E1A2B] text-[18px] font-bold mb-2">조건에 맞는 제품이 없습니다.</p>
              <p className="text-[#8A8478] text-[14px] mb-8">찾으시는 제품이 있다면 전화나 카톡으로 편하게 문의해 주세요.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <button onClick={resetFilters} className={`${BTN_LINE} h-11 px-6 text-[14px]`}>필터 초기화</button>
                <a href={STORE.kakaoChat} target="_blank" rel="noopener noreferrer" className={`${BTN_KAKAO} h-11 px-6 text-[14px]`}>카톡 문의</a>
              </div>
            </div>
          ) : (
            visibleProducts.map((product) => {
              const images = splitImages(product.image_url);
              const sold = isSold(product);
              const fresh = !sold && isNewProduct(product.created_at);
              
              return (
                <article
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${product.title} 상세 보기`}
                  onClick={() => handleProductClick(product)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleProductClick(product); } }}
                  className="bg-white rounded-md overflow-hidden border border-[#E4E0D8] group cursor-pointer flex flex-col relative focus-visible:ring-2 focus-visible:ring-[#0E1A2B] outline-none transition-shadow hover:shadow-lg"
                >
                  <div className="aspect-[3/4] relative overflow-hidden bg-[#EFECE6]">
                    <SafeImg
                      src={images[0]}
                      alt={product.title}
                      className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${sold ? "grayscale opacity-70" : ""}`}
                    />
                    {sold && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0E1A2B]/40">
                        <span className="px-4 py-1.5 rounded-sm bg-[#0E1A2B]/90 text-white text-[12px] font-bold tracking-[0.2em]">SOLD</span>
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {product.status && (
                        <span className={`px-2 py-1 rounded text-[11px] font-bold text-white shadow-sm ${sold ? "bg-[#8A8478]" : "bg-[#0E1A2B]"}`}>{product.status}</span>
                      )}
                      {fresh && <span className="px-2 py-1 rounded text-[11px] font-bold text-white bg-[#D9531E] shadow-sm">NEW</span>}
                    </div>
                    {images.length > 1 && (
                      <span className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[11px] font-semibold px-2 py-0.5 rounded backdrop-blur-sm">+{images.length - 1}장</span>
                    )}
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                        className="absolute top-2.5 right-2.5 bg-white text-red-600 border border-red-200 w-7 h-7 rounded-sm flex items-center justify-center shadow hover:bg-red-50 transition-colors z-20"
                        title="상품 삭제"
                        aria-label="상품 삭제"
                      >
                        <Icon d={ICON.close} className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-[#8A8478] uppercase tracking-wide">{product.category || "기타"}</span>
                      <span className="text-[11px] font-medium text-[#8A8478] flex items-center gap-1">
                        <EyeIcon /> {product.views || 0}
                      </span>
                    </div>
                    <h3 className="font-bold text-[#0E1A2B] text-[15px] sm:text-base leading-snug mb-3 line-clamp-2 flex-1 group-hover:underline underline-offset-4 transition-all">{product.title}</h3>
                    <div className="mt-auto pt-4 border-t border-[#EEEBE5]">
                      <p className={`font-bold text-[18px] sm:text-[20px] tracking-tight ${sold ? "text-[#8A8478]" : hasPrice(product) ? "text-[#D9531E]" : "text-[#4B5260]"}`}>{formatPrice(product)}</p>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      <SiteFooter isAdmin={isAdmin} onAdminClick={() => (isAdmin ? handleAdminLogout() : setIsAdminAuthModalOpen(true))} />
      <MobileCtaBar />

      {/* ───── 상세 보기 모달 ───── */}
      {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

      {/* ───── 상품 등록 모달 (관리자) ───── */}
      {isUploadModalOpen && (
        <Modal onClose={() => setIsUploadModalOpen(false)} label="판매 상품 등록">
          <div className="bg-white w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-lg sm:rounded-lg shadow-2xl border border-[#E4E0D8]">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E4E0D8] sticky top-0 bg-white z-10">
              <h2 className="text-[18px] font-bold text-[#0E1A2B]">판매 상품 등록</h2>
              <button type="button" onClick={() => setIsUploadModalOpen(false)} className="grid h-8 w-8 place-items-center text-neutral-500 hover:text-[#0E1A2B]" aria-label="닫기">
                <Icon d={ICON.close} className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 sm:p-8 space-y-5">
              <div>
                <label className={LABEL}>카테고리 *</label>
                <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className={`${INPUT} font-semibold text-[#0E1A2B]`}>
                  {registerCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className={LABEL}>제품명 / 상세 타이틀 *</label>
                <input type="text" value={productTitle} onChange={(e) => setProductTitle(e.target.value)} required className={INPUT} placeholder="예: 삼성 비스포크 양문형 846L" />
              </div>

              <div>
                <label className={LABEL}>상세 설명 / 제품 규격</label>
                <textarea
                  rows={5}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  className={`${INPUT} resize-none`}
                  placeholder="제품 특징, 편의 기능 및 [주요 사양]이 자동 기재됩니다."
                />
              </div>

              {/* 검토 필요 알림 영역 */}
              {reviewWarnings.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-[12.5px] text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-800">
                    <Icon d={ICON.check} className="w-4 h-4 text-amber-600" /> AI 판독 확인 필요 사항
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-amber-700">
                    {reviewWarnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 검색 출처 링크 영역 */}
              {foundSources.length > 0 && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-[12px] text-slate-700">
                  <p className="font-semibold text-slate-900 mb-1">참조 공식 출처:</p>
                  <div className="flex flex-col gap-1">
                    {foundSources.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate hover:text-blue-800">
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>판매 가격 (원)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={productPrice ? Number(productPrice).toLocaleString() : ""}
                    onChange={(e) => setProductPrice(e.target.value.replace(/[^0-9]/g, ""))}
                    className={INPUT}
                    placeholder="비우면 가격 문의"
                  />
                </div>
                <div>
                  <label className={LABEL}>판매 상태</label>
                  <select value={productStatus} onChange={(e) => setProductStatus(e.target.value)} className={`${INPUT} font-semibold text-[#0E1A2B]`}>
                    <option value="판매중">판매중</option>
                    <option value="판매완료">판매완료</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={LABEL}>사진 첨부 (최대 {MAX_PHOTOS}장) *</label>
                  <span className="text-[11px] text-[#D9531E] font-medium -mt-1">첫 사진이 대표</span>
                </div>

                {/* 인터넷 검색 옵션 토글 */}
                <div className="mb-2.5 flex items-center gap-2 p-2.5 bg-neutral-50 rounded border border-neutral-200">
                  <input
                    type="checkbox"
                    id="searchSpecsCheckbox"
                    checked={searchSpecs}
                    onChange={(e) => setSearchSpecs(e.target.checked)}
                    className="w-4 h-4 accent-[#0E1A2B] cursor-pointer"
                  />
                  <label htmlFor="searchSpecsCheckbox" className="text-[12px] font-semibold text-[#0E1A2B] cursor-pointer select-none">
                    인터넷 검색
                  </label>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={productFiles.length >= MAX_PHOTOS || isAnalyzing}
                  required={productFiles.length === 0}
                  className="w-full text-[12px] text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded file:border-0 file:text-[12px] file:font-semibold file:bg-[#F6F5F2] file:text-[#0E1A2B] hover:file:bg-[#EFECE6] cursor-pointer disabled:opacity-50"
                />

                {isAnalyzing && (
                  <div className="mt-2.5 flex items-center gap-2 p-3 bg-[#FFF5F0] border border-[#FADCD0] rounded text-[#D9531E] text-[12px] font-semibold animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#D9531E] animate-ping" />
                    AI가 사진을 분석하고 사양을 정리하고 있습니다...
                  </div>
                )}

                {productPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {productPreviews.map((preview, index) => (
                      <div key={preview} className="relative aspect-square bg-[#EFECE6] rounded overflow-hidden border border-[#E4E0D8]">
                        <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
                        {index === 0 && <span className="absolute bottom-1 left-1 bg-[#D9531E] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">대표</span>}
                        <button type="button" onClick={() => handleRemoveFile(index)} aria-label="사진 삭제" className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center transition-colors">
                          <Icon d={ICON.close} className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-5 border-t border-[#E4E0D8]">
                <button type="button" onClick={() => { setIsUploadModalOpen(false); resetUploadForm(); }} className={`${BTN_LINE} w-1/2 h-12 text-[14px]`}>취소</button>
                <button type="submit" disabled={uploadingProduct || isAnalyzing} className={`${BTN_NAVY} w-1/2 h-12 text-[14px] disabled:opacity-50`}>
                  {uploadingProduct ? "등록 중..." : "등록하기"}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* ───── 관리자 로그인 모달 ───── */}
      {isAdminAuthModalOpen && (
        <Modal onClose={() => setIsAdminAuthModalOpen(false)} label="관리자 로그인">
          <form onSubmit={handleAdminAuth} className="w-full rounded-t-lg bg-white p-6 sm:max-w-sm sm:rounded-lg sm:p-8 shadow-2xl border border-[#E4E0D8]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px] font-bold text-[#0E1A2B]">관리자 로그인</h2>
              <button type="button" onClick={() => setIsAdminAuthModalOpen(false)} className="grid h-9 w-9 place-items-center text-neutral-500 hover:text-[#0E1A2B]" aria-label="닫기">
                <Icon d={ICON.close} className="h-5 w-5" />
              </button>
            </div>
            <label className={LABEL} htmlFor="admin-email">이메일</label>
            <input id="admin-email" type="email" autoComplete="username" required value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={`${INPUT} mb-4`} />
            <label className={LABEL} htmlFor="admin-pw">비밀번호</label>
            <input id="admin-pw" type="password" autoComplete="current-password" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={INPUT} />
            <button type="submit" disabled={isLoggingIn} className={`${BTN_NAVY} mt-6 h-12 w-full text-[15px] disabled:opacity-60`}>
              {isLoggingIn ? "로그인 중…" : "로그인"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}