"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

interface Product {
  id: string;
  title: string;
  category: string | null;
  image_url: string | null;
  price: number | null;
  status: string | null;
  created_at: string;
}

const STORE_TEL = "042-523-8179";
const KAKAO_URL = "http://pf.kakao.com/_XmyrX/chat";
const BRAND = "#0b4b8b";
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='400' height='400' fill='#f1f5f9'/><text x='50%' y='50%' fill='#94a3b8' font-size='18' font-family='sans-serif' text-anchor='middle' dominant-baseline='middle'>이미지 준비 중</text></svg>`
  );

const ICON = {
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3",
  close: "M18 6 6 18M6 6l12 12",
  plus: "M12 5v14M5 12h14",
  left: "m15 18-6-6 6-6",
  right: "m9 18 6-6-6-6",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
};

function Icon({ d, className = "w-4 h-4" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function SafeImg({ src, alt, className, eager = false }: { src?: string; alt: string; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed || !src ? PLACEHOLDER : src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

const parseImages = (value: string | null) => (value ? value.split(",").filter(Boolean) : []);
const isNewProduct = (createdAt: string) => Date.now() - new Date(createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
const hasPrice = (p: Product) => !!p.price && p.price > 0;
const formatPrice = (p: Product) => (hasPrice(p) ? `${Number(p.price).toLocaleString()}원` : "가격 문의");

function ProductDetailModal({ product, onClose }: { product: Product; onClose: () => void }) {
  const parsed = parseImages(product.image_url);
  const images = parsed.length ? parsed : [""];
  const [idx, setIdx] = useState(0);
  const sold = product.status === "판매완료";
  const go = (d: number) => setIdx((i) => (i + d + images.length) % images.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (images.length < 2) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${product.title} 상세 정보`}
    >
      <div
        className="bg-white w-full sm:max-w-4xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl grid md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-100 md:rounded-l-3xl overflow-hidden">
          <div className="relative aspect-square">
            <SafeImg key={images[idx]} src={images[idx]} alt={product.title} eager className={`w-full h-full object-cover ${sold ? "grayscale" : ""}`} />
            {images.length > 1 && (
              <>
                <button onClick={() => go(-1)} aria-label="이전 사진" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500">
                  <Icon d={ICON.left} className="w-5 h-5" />
                </button>
                <button onClick={() => go(1)} aria-label="다음 사진" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white focus-visible:ring-2 focus-visible:ring-blue-500">
                  <Icon d={ICON.right} className="w-5 h-5" />
                </button>
                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {idx + 1} / {images.length}
                </span>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-3">
              {images.map((img, i) => (
                <button
                  key={img + i}
                  onClick={() => setIdx(i)}
                  aria-label={`${i + 1}번 사진 보기`}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition ${i === idx ? "border-[#0b4b8b]" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <SafeImg src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 sm:p-8 flex flex-col">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">{product.category || "기타"}</span>
              <span className={`text-xs font-black text-white px-2.5 py-1 rounded-md ${sold ? "bg-slate-700" : "bg-[#0b4b8b]"}`}>{product.status || "판매중"}</span>
            </div>
            <button onClick={onClose} aria-label="닫기" className="w-9 h-9 -mt-1 -mr-1 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500">
              <Icon d={ICON.close} className="w-5 h-5" />
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug mb-4">{product.title}</h2>
          <p className={`text-3xl font-black mb-6 ${sold ? "text-slate-400" : "text-[#0b4b8b]"}`}>{formatPrice(product)}</p>

          <ul className="text-sm text-slate-600 space-y-2 mb-8 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <li>꼼꼼한 세척·검수를 거친 A급 제품입니다.</li>
            <li>구매 후 A/S와 세금계산서 발행이 가능합니다.</li>
            <li>대전 외 지역 배송·설치는 전화로 문의해 주세요.</li>
          </ul>

          <div className="mt-auto space-y-2.5">
            {sold && <p className="text-xs text-slate-500 text-center">이 제품은 판매가 완료되었습니다. 유사 제품은 전화로 문의해 주세요.</p>}
            <a href={`tel:${STORE_TEL}`} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#0b4b8b] hover:bg-[#093c70] text-white font-bold transition shadow-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500">
              <Icon d={ICON.phone} className="w-5 h-5" /> 전화 문의 {STORE_TEL}
            </a>
            <a href={KAKAO_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#FEE500] hover:bg-[#f5dc00] text-slate-900 font-bold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-yellow-500">
              <Icon d={ICON.chat} className="w-5 h-5" /> 카톡으로 사진 보내고 상담
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"latest" | "priceAsc" | "priceDesc">("latest");
  const [onlySelling, setOnlySelling] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
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

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });

    fetchProducts();
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const anyOpen = isUploadModalOpen || isAdminAuthModalOpen || !!selectedProduct;
    document.body.style.overflow = anyOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSelectedProduct(null);
      setIsAdminAuthModalOpen(false);
      setIsUploadModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isUploadModalOpen, isAdminAuthModalOpen, selectedProduct]);

  const changeCategory = (cat: string) => {
    setActiveCategory(cat);
    const url = new URL(window.location.href);
    if (cat === "전체") url.searchParams.delete("category");
    else url.searchParams.set("category", cat);
    window.history.replaceState(null, "", url.toString());
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

  const compressImage = (file: File): Promise<Blob> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onerror = () => reject(new Error("파일 읽기 실패"));
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onerror = () => reject(new Error("이미지 로드 실패"));
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width, height = img.height;
          const maxDim = 1200;
          if (width > height) {
            if (width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height); height = maxDim;
          }
          canvas.width = width;
          canvas.height = height;
          canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("압축 실패"))), "image/jpeg", 0.75);
        };
      };
    });

  const resetUploadForm = () => {
    productPreviews.forEach((u) => URL.revokeObjectURL(u));
    setProductTitle("");
    setProductPrice("");
    setProductStatus("판매중");
    setProductFiles([]);
    setProductPreviews([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (productFiles.length + files.length > 3) {
      toast.error("사진은 최대 3장까지 등록 가능합니다.");
      return;
    }
    setProductFiles([...productFiles, ...files]);
    setProductPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
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
        const compressedBlob = await compressImage(file);
        const fileName = `product_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const { error: uploadError } = await supabase.storage.from("inquiries").upload(fileName, compressedBlob, { contentType: "image/jpeg" });
        if (uploadError) throw uploadError;
        uploadedUrls.push(supabase.storage.from("inquiries").getPublicUrl(fileName).data.publicUrl);
      }
      const parsedPrice = productPrice ? Number(productPrice.replace(/[^0-9]/g, "")) : 0;
      const { error } = await supabase.from("products").insert({
        title: productTitle,
        category: productCategory,
        image_url: uploadedUrls.join(","),
        price: parsedPrice,
        status: productStatus,
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

  const sellingCount = useMemo(() => products.filter((p) => p.status !== "판매완료").length, [products]);

  const visibleProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (activeCategory === "전체" || (p.category || "기타") === activeCategory) &&
        (!onlySelling || p.status !== "판매완료") &&
        (!q || p.title.toLowerCase().includes(q))
    );
    const MAX = Number.MAX_SAFE_INTEGER;
    return [...list].sort((a, b) => {
      const soldA = a.status === "판매완료" ? 1 : 0;
      const soldB = b.status === "판매완료" ? 1 : 0;
      if (soldA !== soldB) return soldA - soldB;
      if (sort === "priceAsc") return (hasPrice(a) ? a.price! : MAX) - (hasPrice(b) ? b.price! : MAX);
      if (sort === "priceDesc") return (b.price || 0) - (a.price || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products, activeCategory, onlySelling, search, sort]);

  const resetFilters = () => {
    setSearch("");
    setOnlySelling(false);
    changeCategory("전체");
  };

  const inputCls = "w-full border border-slate-300 p-3 rounded-xl bg-slate-50 text-sm outline-none focus:border-[#0b4b8b] focus:ring-2 focus:ring-[#0b4b8b]/15 transition";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-2">
          <a href="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition">
            <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0b4b8b] flex items-center justify-center font-black text-base sm:text-lg ring-1 ring-white/20">한</span>
            <div className="whitespace-nowrap leading-tight">
              <span className="block text-base sm:text-xl font-black">한밭중고전자</span>
              <span className="hidden sm:block text-[10px] text-slate-400">대전 중구 중촌동 · SINCE 1997</span>
            </div>
          </a>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => setIsUploadModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold px-3 py-2 rounded-xl transition shadow-md flex items-center gap-1.5 whitespace-nowrap">
                <Icon d={ICON.plus} /> <span className="hidden sm:inline">상품 등록하기</span><span className="sm:hidden">등록</span>
              </button>
            )}
            <a href={`tel:${STORE_TEL}`} className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2.5 rounded-xl border border-slate-600 hover:bg-slate-800 transition whitespace-nowrap">
              <Icon d={ICON.phone} /> {STORE_TEL}
            </a>
            <a href="/inquiry" className="bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-extrabold px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition shadow-md inline-flex items-center gap-1.5 whitespace-nowrap">
              <Icon d={ICON.list} /> 문의게시판
            </a>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 pt-10 pb-8 sm:pt-14 sm:pb-10 text-center">
          <p className="text-xs font-bold tracking-widest text-[#0b4b8b] mb-2">PRODUCT GALLERY</p>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">판매 제품 갤러리</h1>
          <p className="text-slate-500 text-sm sm:text-base mb-5">한밭중고전자의 꼼꼼한 검수를 거친 A급 제품들을 만나보세요.</p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold text-slate-600">
            {["30년 업력", "검수·A/S 보장", "세금계산서 발행", "전국 배송·설치"].map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">{t}</span>
            ))}
            {!isLoading && <span className="px-3 py-1.5 rounded-full bg-[#0b4b8b] text-white shadow-sm">현재 판매중 {sellingCount}개</span>}
          </div>
        </div>
      </section>

      <div className="sticky top-16 sm:top-20 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" role="tablist" aria-label="제품 카테고리">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={active}
                  onClick={() => changeCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition border focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    active ? "bg-[#0b4b8b] text-white border-[#0b4b8b] shadow-md" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                  <span className={`ml-1.5 text-xs ${active ? "text-blue-200" : "text-slate-400"}`}>{categoryCounts[cat] || 0}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"><Icon d={ICON.search} className="w-4 h-4" /></span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="제품명 검색 (예: LG 냉난방기)"
                aria-label="제품명 검색"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-[#0b4b8b] focus:bg-white focus:ring-2 focus:ring-[#0b4b8b]/15 transition"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              aria-label="정렬"
              className="py-2.5 pl-3 pr-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 outline-none focus:border-[#0b4b8b]"
            >
              <option value="latest">최신순</option>
              <option value="priceAsc">낮은 가격순</option>
              <option value="priceDesc">높은 가격순</option>
            </select>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-10 pb-28 sm:pb-12 flex-1 w-full">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-slate-500">
            {isLoading ? "제품을 불러오는 중..." : <>총 <strong className="text-slate-900">{visibleProducts.length}</strong>개 제품</>}
          </p>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={onlySelling} onChange={(e) => setOnlySelling(e.target.checked)} className="w-4 h-4 accent-[#0b4b8b]" />
            판매중만 보기
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm animate-pulse">
                <div className="aspect-square bg-slate-200 w-full" />
                <div className="p-3 sm:p-5 space-y-3">
                  <div className="h-3 bg-slate-200 rounded-md w-1/4" />
                  <div className="h-5 bg-slate-200 rounded-md w-4/5" />
                  <div className="h-6 bg-slate-300 rounded-md w-1/2" />
                </div>
              </div>
            ))
          ) : visibleProducts.length === 0 ? (
            <div className="col-span-full py-16 sm:py-20 px-6 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <p className="text-slate-700 font-bold mb-1">조건에 맞는 제품이 없습니다.</p>
              <p className="text-slate-400 text-sm mb-6">찾으시는 제품이 있다면 전화나 카톡으로 문의해 주세요. 재고를 바로 확인해 드립니다.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button onClick={resetFilters} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">필터 초기화</button>
                <a href={`tel:${STORE_TEL}`} className="px-5 py-2.5 rounded-xl bg-[#0b4b8b] text-white font-bold text-sm hover:bg-[#093c70]">전화 문의</a>
              </div>
            </div>
          ) : (
            visibleProducts.map((product) => {
              const images = parseImages(product.image_url);
              const sold = product.status === "판매완료";
              const fresh = !sold && isNewProduct(product.created_at);
              return (
                <article
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${product.title} 상세 보기`}
                  onClick={() => setSelectedProduct(product)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedProduct(product); } }}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition duration-300 group cursor-pointer flex flex-col relative focus-visible:ring-2 focus-visible:ring-[#0b4b8b] outline-none"
                >
                  <div className="aspect-square relative overflow-hidden bg-slate-100">
                    <SafeImg src={images[0]} alt={product.title} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${sold ? "grayscale opacity-70" : ""}`} />
                    {sold && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
                        <span className="px-4 py-1.5 rounded-md bg-slate-900/85 text-white text-sm font-black tracking-widest">SOLD</span>
                      </div>
                    )}
                    <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1.5">
                      {product.status && (
                        <span className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-black text-white shadow-md ${sold ? "bg-slate-800/85" : "bg-[#0b4b8b]/95"}`}>{product.status}</span>
                      )}
                      {fresh && <span className="px-2 py-1 rounded-md text-[11px] sm:text-xs font-black text-white bg-amber-500 shadow-md">NEW</span>}
                    </div>
                    {images.length > 1 && (
                      <span className="absolute bottom-2.5 right-2.5 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">사진 {images.length}</span>
                    )}
                    {isAdmin && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id); }}
                        className="absolute top-2.5 right-2.5 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md hover:bg-red-700 transition z-20"
                        title="상품 삭제"
                        aria-label="상품 삭제"
                      >
                        <Icon d={ICON.close} className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="p-3 sm:p-5 flex flex-col flex-1">
                    <span className="text-[11px] sm:text-xs font-bold text-slate-400 mb-1">{product.category || "기타"}</span>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug mb-3 line-clamp-2 flex-1">{product.title}</h3>
                    <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-100">
                      <p className={`font-black text-base sm:text-lg ${sold ? "text-slate-400" : hasPrice(product) ? "text-[#0b4b8b]" : "text-slate-600"}`}>{formatPrice(product)}</p>
                      <span className="hidden sm:inline text-xs font-bold text-slate-400 group-hover:text-[#0b4b8b] transition">상세보기 →</span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </main>

      <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-3 py-2.5 grid grid-cols-2 gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <a href={`tel:${STORE_TEL}`} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0b4b8b] text-white font-bold text-sm">
          <Icon d={ICON.phone} className="w-4 h-4" /> 전화 상담
        </a>
        <a href={KAKAO_URL} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FEE500] text-slate-900 font-bold text-sm">
          <Icon d={ICON.chat} className="w-4 h-4" /> 카톡 상담
        </a>
      </div>

      <footer className="bg-slate-950 text-slate-400 py-10 pb-24 sm:pb-10 text-xs border-t border-slate-800 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-between gap-3 pb-4 border-b border-slate-900 text-slate-300 font-bold">
            <div className="flex flex-wrap items-center justify-center gap-3 whitespace-nowrap">
              <a href="/privacy" target="_blank" className="hover:text-white transition">개인정보처리방침</a><span aria-hidden="true">|</span>
              <a href="/#location-section" className="hover:text-white transition">오시는 길</a><span aria-hidden="true">|</span>
              <a href="http://pf.kakao.com/_XmyrX" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-yellow-400">카카오채널</a><span aria-hidden="true">|</span>
              <a href="https://cafe.naver.com/hanbatmall" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-emerald-400">제품 확인 카페</a>
            </div>
            <div className="text-slate-500 text-[11px] whitespace-nowrap">© 2026 한밭중고전자. All rights reserved.</div>
          </div>
          <div className="space-y-1 text-slate-400 text-[11px] sm:text-xs leading-relaxed text-center sm:text-left">
            <p><strong className="text-slate-200">상호 :</strong> 한밭중고전자 &nbsp;|&nbsp; <strong className="text-slate-200">대표자 :</strong> 김영종 &nbsp;|&nbsp; <strong className="text-slate-200">주소 :</strong> 대전광역시 중구 중촌동 144</p>
            <p><strong className="text-slate-200">TEL :</strong> <a href={`tel:${STORE_TEL}`} className="hover:text-white">{STORE_TEL}</a> / 042-527-4888 &nbsp;|&nbsp; <strong className="text-slate-200">HP :</strong> 010-5406-8179 &nbsp;|&nbsp; <strong className="text-slate-200">사업자번호 :</strong> 314-01-70945 &nbsp;|&nbsp; <strong className="text-slate-200">통신판매신고번호 :</strong> 2011-대전서구-0292</p>
            <p className="text-slate-500">개인정보 보호책임자 : 김태현(sunny3815@naver.com)</p>
          </div>
          <div className="pt-4 border-t border-slate-900 flex justify-center sm:justify-end">
            <button onClick={() => (isAdmin ? handleAdminLogout() : setIsAdminAuthModalOpen(true))} className="text-slate-600 hover:text-slate-400 transition underline text-[11px] whitespace-nowrap">
              {isAdmin ? "관리자 로그아웃" : "관리자 로그인"}
            </button>
          </div>
        </div>
      </footer>

      {selectedProduct && <ProductDetailModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={() => setIsUploadModalOpen(false)} role="dialog" aria-modal="true" aria-label="판매 상품 등록">
          <div className="bg-white w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-xl text-slate-900 mb-6">판매 상품 등록</h3>
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">카테고리 *</label>
                <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)} className={`${inputCls} font-bold text-[#0b4b8b]`}>
                  {registerCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">제품명 / 상세 타이틀 *</label>
                <input type="text" value={productTitle} onChange={(e) => setProductTitle(e.target.value)} required className={inputCls} placeholder="예: 삼성 비스포크 4도어 양문형 냉장고" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">판매 가격 (원)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={productPrice ? Number(productPrice).toLocaleString() : ""}
                    onChange={(e) => setProductPrice(e.target.value.replace(/[^0-9]/g, ""))}
                    className={inputCls}
                    placeholder="비우면 가격 문의"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">판매 상태</label>
                  <select value={productStatus} onChange={(e) => setProductStatus(e.target.value)} className={`${inputCls} font-bold text-slate-800`}>
                    <option value="판매중">판매중</option>
                    <option value="판매완료">판매완료</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">제품 사진 첨부 (최대 3장, 첫 사진이 대표) *</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={productFiles.length >= 3}
                  required={productFiles.length === 0}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer disabled:opacity-50"
                />
                {productPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {productPreviews.map((preview, index) => (
                      <div key={preview} className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                        <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
                        {index === 0 && <span className="absolute bottom-1 left-1 bg-[#0b4b8b] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">대표</span>}
                        <button type="button" onClick={() => handleRemoveFile(index)} aria-label="사진 삭제" className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center">
                          <Icon d={ICON.close} className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setIsUploadModalOpen(false); resetUploadForm(); }} className="w-1/2 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50">취소</button>
                <button type="submit" disabled={uploadingProduct} className="w-1/2 py-3 rounded-xl bg-[#0b4b8b] text-white font-bold text-sm hover:bg-[#093c70] transition shadow-md disabled:opacity-50">
                  {uploadingProduct ? "등록 중..." : "등록하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setIsAdminAuthModalOpen(false)} role="dialog" aria-modal="true" aria-label="관리자 로그인">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-xl border border-slate-200 p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-slate-900 text-base mb-1">관리자 로그인</h3>
            <p className="text-xs text-slate-500 mb-4">관리자 이메일과 비밀번호를 입력해 주세요.</p>
            <form onSubmit={handleAdminAuth} className="space-y-3">
              <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="이메일 주소" required autoFocus autoComplete="username" className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0b4b8b] focus:ring-2 focus:ring-[#0b4b8b]/15" />
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="비밀번호" required autoComplete="current-password" className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:border-[#0b4b8b] focus:ring-2 focus:ring-[#0b4b8b]/15" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsAdminAuthModalOpen(false)} className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition">취소</button>
                <button type="submit" disabled={isLoggingIn} className="w-1/2 py-2.5 rounded-xl bg-[#0b4b8b] text-white font-bold text-xs hover:bg-[#093c70] transition disabled:opacity-50">
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
