"use client";

import { useState, useEffect } from "react";
// ⚠️ 경로 주의: lib 폴더가 루트에 있다면 '../../lib/supabase' 로 맞춰주세요.
import { supabase } from "../../lib/supabase";

export default function InquiryBoardPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("전체");
  const [isAdmin, setIsAdmin] = useState(false);

  // 글쓰기 모달 상태
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [inquiryType, setInquiryType] = useState("내 물건 팔기");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showWritePassword, setShowWritePassword] = useState(false);
  const [isNotice, setIsNotice] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 상세 보기 및 비밀번호 모달 상태
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isPwModalOpen, setIsPwModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [inputPw, setInputPw] = useState("");
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  // 글 수정 모달 상태
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editInquiryType, setEditInquiryType] = useState("");
  const [editUpdating, setEditUpdating] = useState(false);

  // 관리자 인증 모달 상태
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");

  // ✅ 추가: 관리자 답변 상태
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const loadData = async () => {
    const { data: authData } = await supabase.auth.getSession();
    if (authData?.session?.user) {
      setIsAdmin(true);
    }

    const { data } = await supabase
      .from("purchase_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setInquiries(data);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("isAdmin") === "true") {
      setIsAdmin(true);
    }
    loadData();
  }, []);

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("압축 변환 실패"));
            },
            "image/jpeg",
            0.75
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (selectedFiles.length + files.length > 3) {
      alert("사진은 최대 3장까지 등록 가능합니다.");
      return;
    }

    const updatedFiles = [...selectedFiles, ...files];
    setSelectedFiles(updatedFiles);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = filePreviews.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    setFilePreviews(updatedPreviews);
  };

  const noticeList = inquiries.filter((item) => item.is_notice);
  const regularList = inquiries.filter((item) => !item.is_notice);

  const filteredRegularList = regularList.filter((item) => {
    if (activeTab === "전체") return true;
    if (activeTab === "구매문의") {
      return item.inquiry_type === "구매 문의" || item.inquiry_type === "구매문의";
    }
    if (activeTab === "내 물건팔기") {
      return item.inquiry_type === "내 물건 팔기" || item.inquiry_type === "매입문의";
    }
    return true;
  });

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setInputPw("");
    setShowVerifyPassword(false);
    
    // ✅ 모달 열릴 때 기존에 달린 답변 내용 세팅
    setReplyContent(item.admin_reply || ""); 

    if (item.is_notice || isAdmin) {
      setIsDetailOpen(true);
    } else {
      setIsPwModalOpen(true);
    }
  };

  const handleVerifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (inputPw === "8179" || (selectedItem.password && selectedItem.password === inputPw)) {
      setIsPwModalOpen(false);
      setIsDetailOpen(true);
    } else {
      alert("비밀번호가 일치하지 않습니다.");
    }
  };

  // ✅ 추가: 관리자 다이렉트 답변 작성 핸들러
  const handleReplySubmit = async () => {
    if (!selectedItem) return;
    if (!replyContent.trim()) return alert("답변 내용을 입력해 주세요.");
    
    setIsReplying(true);
    try {
      const { error } = await supabase
        .from("purchase_requests")
        .update({ 
          status: '답변완료',
          admin_reply: replyContent 
        })
        .eq('id', selectedItem.id);

      if (error) throw error;
      alert("답변이 성공적으로 등록되었습니다.");
      
      // 로컬 상태 즉시 반영
      setSelectedItem({ ...selectedItem, status: '답변완료', admin_reply: replyContent });
      setInquiries((prev) => 
        prev.map((item) => 
          item.id === selectedItem.id ? { ...item, status: '답변완료', admin_reply: replyContent } : item
        )
      );
    } catch (error: any) {
      alert("답변 등록 실패: " + error.message);
    } finally {
      setIsReplying(false);
    }
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === "8179") {
      setIsAdmin(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("isAdmin", "true");
      }
      setIsAdminAuthModalOpen(false);
      alert("관리자 모드가 활성화되었습니다.");
    } else {
      alert("관리자 비밀번호가 일치하지 않습니다.");
    }
  };

  const handleAdminLogout = () => {
    if (confirm("관리자 모드를 종료하시겠습니까?")) {
      setIsAdmin(false);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("isAdmin");
      }
      alert("관리자 모드가 종료되었습니다.");
    }
  };

  const handleOpenWrite = () => {
    setIsNotice(false);
    setShowWritePassword(false);
    setName(isAdmin ? "한밭중고전자" : "");
    setPhone(isAdmin ? "042-523-8179" : "");
    setPassword("");
    setTitle("");
    setContent("");
    setSelectedFiles([]);
    setFilePreviews([]);
    setIsWriteOpen(true);
  };

  const handleWriteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert("제목을 입력해 주세요.");
      return;
    }

    if (!isNotice && (!name || !phone || !password)) {
      alert("성함, 연락처, 비밀번호를 모두 입력해 주세요.");
      return;
    }

    if (!isNotice && !agreed) {
      alert("개인정보 수집 및 이용에 동의해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of selectedFiles) {
        const compressedBlob = await compressImage(file);
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from("inquiries")
          .upload(fileName, compressedBlob, {
            contentType: "image/jpeg",
          });

        if (uploadError) {
          throw new Error(`이미지 업로드 실패 (${uploadError.message})`);
        }

        const { data: publicUrlData } = supabase.storage
          .from("inquiries")
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }

      const { error: insertError } = await supabase.from("purchase_requests").insert({
        name: isNotice ? (name || "한밭중고전자") : name,
        phone: isNotice ? (phone || "042-523-8179") : phone,
        password: isNotice ? "0000" : password,
        inquiry_type: isNotice ? "공지사항" : inquiryType,
        category: title,
        region: "대전/기타",
        description: content,
        images: uploadedUrls,
        is_notice: isNotice,
        status: isNotice ? "공지" : "접수",
      });

      if (insertError) throw insertError;

      alert(isNotice ? "공지사항이 등록되었습니다." : "문의가 등록되었습니다.");
      setIsWriteOpen(false);
      loadData();
    } catch (err: any) {
      alert("오류 발생: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = () => {
    if (!selectedItem) return;
    setEditTitle(selectedItem.category || "");
    setEditContent(selectedItem.description || "");
    setEditInquiryType(selectedItem.inquiry_type || "내 물건 팔기");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setEditUpdating(true);
    try {
      setInquiries((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? { ...item, category: editTitle, description: editContent, inquiry_type: selectedItem.is_notice ? "공지사항" : editInquiryType }
            : item
        )
      );

      const { error } = await supabase
        .from("purchase_requests")
        .update({
          category: editTitle,
          description: editContent,
          inquiry_type: selectedItem.is_notice ? "공지사항" : editInquiryType,
        })
        .eq("id", selectedItem.id);

      if (error) throw error;

      alert("성공적으로 수정되었습니다.");
      setSelectedItem({
        ...selectedItem,
        category: editTitle,
        description: editContent,
        inquiry_type: selectedItem.is_notice ? "공지사항" : editInquiryType,
      });
      setIsEditOpen(false);
    } catch (err: any) {
      alert("수정 실패: " + err.message);
      loadData();
    } finally {
      setEditUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!confirm("정말 이 글을 삭제하시겠습니까?")) return;

    try {
      setInquiries((prev) => prev.filter((item) => item.id !== selectedItem.id));
      setIsDetailOpen(false);
      alert("게시글이 삭제되었습니다.");

      const { error } = await supabase
        .from("purchase_requests")
        .delete()
        .eq("id", selectedItem.id);

      if (error) throw error;
      
    } catch (err: any) {
      alert("삭제 실패: " + err.message);
      loadData();
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setInquiries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    setSelectedItem((prev: any) => ({ ...prev, status: newStatus }));

    try {
      const { error } = await supabase
        .from("purchase_requests")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;
    } catch (err: any) {
      alert("상태 업데이트 실패: " + err.message);
      loadData();
    }
  };

  const maskName = (rawName: string) => {
    if (!rawName) return "고*객";
    if (rawName.length === 1) return rawName;
    if (rawName.length === 2) return rawName.charAt(0) + "*";
    
    const firstChar = rawName.charAt(0);
    const lastChar = rawName.slice(-1);
    const middleMask = "*".repeat(rawName.length - 2);
    
    return firstChar + middleMask + lastChar;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${month}-${day}`;
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <a href="/" className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
            <span className="text-[#0b4b8b] text-2xl">⚡</span>
            <span>한밭중고전자</span>
          </a>

          <div className="flex items-center gap-3">
            {isAdmin ? (
              <button
                onClick={handleAdminLogout}
                className="bg-red-50 text-red-600 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-full hover:bg-red-100 transition"
                title="클릭하여 관리자 모드 종료"
              >
                관리자 모드 ON
              </button>
            ) : (
              <button
                onClick={() => setIsAdminAuthModalOpen(true)}
                className="text-xs text-slate-400 hover:text-slate-700 underline"
              >
                관리자 인증
              </button>
            )}

            <a href="/" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#0b4b8b] transition px-2 py-1">
              메인 홈으로
            </a>

            <button
              onClick={handleOpenWrite}
              className="bg-[#0b4b8b] hover:bg-[#093c70] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg transition shadow-sm"
            >
              글쓰기
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16 flex-1 w-full">
        <div className="text-center mb-10 pt-4">
          <h1 className="text-3xl sm:text-4xl font-black text-[#0b4b8b]">문의 게시판</h1>
        </div>

        <div className="flex items-center border-b border-slate-200 mb-8 gap-8 text-sm sm:text-base font-bold">
          {["전체", "구매문의", "내 물건팔기"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 transition relative ${
                activeTab === tab
                  ? "text-[#0b4b8b] border-b-2 border-[#0b4b8b]"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4 text-xs sm:text-sm text-slate-500">
          <div>
            Total <strong className="text-slate-900 font-bold">{noticeList.length + filteredRegularList.length}</strong>건
          </div>
          <button
            onClick={handleOpenWrite}
            className="bg-[#0b4b8b] hover:bg-[#093c70] text-white font-bold px-4 py-2 rounded text-xs transition shadow-xs"
          >
            글쓰기
          </button>
        </div>

        <div className="overflow-x-auto border-t border-slate-200">
          <table className="w-full text-center border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#0b4b8b] text-white font-bold h-14">
                <th className="w-20 py-3">번호</th>
                <th className="w-28 py-3">구분</th>
                <th className="py-3 px-4 text-left">제목</th>
                <th className="w-28 py-3">답변여부</th>
                <th className="w-24 py-3">작성자</th>
                <th className="w-24 py-3">날짜</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {noticeList.map((notice) => {
                const hasImages = notice.images && notice.images.length > 0;
                return (
                  <tr
                    key={notice.id}
                    onClick={() => handleItemClick(notice)}
                    className="bg-red-50/40 hover:bg-red-50/70 transition h-14 cursor-pointer font-bold border-b border-red-100"
                  >
                    <td className="py-3 text-red-600">
                      <span className="bg-red-600 text-white text-[11px] px-2 py-0.5 rounded-full shadow-2xs">공지</span>
                    </td>
                    <td className="py-3">
                      <span className="bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded text-xs">
                        공지사항
                      </span>
                    </td>
                    <td className="py-3 px-4 text-left text-slate-900 font-black">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">📢</span>
                        <span className="truncate max-w-md hover:underline">{notice.category}</span>
                        {hasImages && (
                          <span className="text-slate-400 text-sm opacity-80" title="사진 첨부됨">
                            🖼️
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-slate-400 font-normal">-</td>
                    <td className="py-3 text-red-700 font-bold">{notice.name}</td>
                    <td className="py-3 text-slate-500 font-normal">{formatDate(notice.created_at)}</td>
                  </tr>
                );
              })}

              {filteredRegularList.length === 0 && noticeList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-slate-400 text-sm">
                    등록된 문의 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredRegularList.map((item, index) => {
                  const isSell =
                    item.inquiry_type === "내 물건 팔기" ||
                    item.inquiry_type === "내 물건팔기" ||
                    item.inquiry_type === "매입문의";
                  const hasImages = item.images && item.images.length > 0;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className="hover:bg-slate-50 transition h-14 cursor-pointer"
                    >
                      <td className="py-3 text-slate-400">{filteredRegularList.length - index}</td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-md text-xs font-semibold ${
                            isSell
                              ? "bg-[#e8f3fc] text-[#026bb4]"
                              : "bg-indigo-50 text-indigo-700"
                          }`}
                        >
                          {isSell ? "내 물건팔기" : "구매문의"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-left font-medium text-slate-800">
                        <div className="flex items-center gap-1.5">
                          {!isAdmin && <span className="text-slate-400 text-sm">🔒</span>}
                          <span className="truncate max-w-md hover:text-[#0b4b8b]">
                            {item.category || item.description || "문의드립니다."}
                          </span>
                          {hasImages && (
                            <span className="text-slate-400 text-sm opacity-80" title="사진 첨부됨">
                              🖼️
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                            item.status === '답변완료' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.status || "접수"}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">
                        {maskName(item.name)}
                      </td>
                      <td className="py-3 text-slate-500">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* ✅ 문의 게시판에도 보이지 않는 SEO 최적화 블록(sr-only) 새로 추가! */}
      <section className="bg-slate-100 py-10 border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center sm:text-left">
          <h3 className="text-xs font-black text-slate-500 mb-2">
            전국 중고가전 판매·매입 전문, 한밭중고전자
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed break-keep">
            한밭중고전자는 30년 이상의 중고가전 유통 노하우를 바탕으로 중고 냉장고, 세탁기, 에어컨, 냉난방기부터 업소용 냉장고, 제빙기, 쇼케이스, 상업용 주방기기까지 다양한 제품을 판매·매입합니다. 전국 단위 판매 및 대량 거래가 가능하며, 제품 특성에 맞는 배송과 설치 서비스를 제공합니다. 가정용 중고가전부터 식당·카페·사업장의 업소용 주방기기까지 판매, 매입, 대량 거래를 한 곳에서 상담받을 수 있습니다.
          </p>

          {/* 🚨 고객 눈에는 절대 안 보이고 검색 로봇만 읽어가는 74개 핵심 키워드 */}
          <div className="sr-only">
            전국중고가전, 중고가전, 중고전자제품, 중고가전판매, 중고가전매입, 중고가전매장, 중고가전쇼핑몰, 중고가전전문점, 중고가전전문업체, 중고가전전국배송, 중고가전전국판매, 중고가전전국매입, 중고가전배송, 중고가전설치, 중고가전직거래, 중고가전대량판매, 중고가전대량매입, 중고전자제품판매, 중고전자제품매입, 중고제품판매, 
            중고냉장고, 중고김치냉장고, 중고세탁기, 중고건조기, 중고에어컨, 중고냉난방기, 중고TV, 중고전자레인지, 중고가전제품, 중고가정용가전, 중고4도어냉장고, 중고스탠드냉장고, 중고양문형냉장고, 중고드럼세탁기, 중고통돌이세탁기, 중고벽걸이에어컨, 중고스탠드에어컨, 중고시스템에어컨, 
            중고업소용냉장고, 중고업소용주방기기, 중고주방기기, 중고상업용냉장고, 중고식당주방기기, 중고제빙기, 중고쇼케이스, 중고냉동고, 중고냉장쇼케이스, 중고냉동쇼케이스, 중고테이블냉장고, 중고반찬냉장고, 중고업소용냉동고, 중고식기세척기, 중고주방설비, 중고식당기기, 중고카페장비, 중고식당장비, 중고급식기기, 중고상업용주방기기, 
            중고대형냉난방기, 중고대형에어컨, 중고업소용에어컨, 중고상업용에어컨, 중고천장형에어컨, 중고스탠드에어컨, 중고냉난방기판매, 중고냉난방기매입, 냉난방기중고, 에어컨중고, 에어컨중고판매, 에어컨중고매입, 대형에어컨중고, 업소용냉난방기, 상업용냉난방기, 중고냉난방기전국배송
          </div>
        </div>

      </section>

      <footer className="bg-slate-950 text-slate-400 py-10 text-xs border-t border-slate-800 w-full mt-auto">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-900 text-slate-300 font-bold">
            <div className="flex items-center gap-4">
              <a href="/privacy" target="_blank" className="hover:text-white transition">개인정보처리방침</a>
              <span>|</span>
              <a href="/#location-section" className="hover:text-white transition">오시는 길</a>
              <span>|</span>
              <a href="http://pf.kakao.com/_XmyrX" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-yellow-400">카카오채널</a>
              <span>|</span>
              <a href="https://cafe.naver.com/hanbatmall" target="_blank" rel="noopener noreferrer" className="hover:text-white transition text-emerald-400">제품 확인 카페</a>
            </div>
            <div className="text-slate-500 text-[11px]">
              © 2026 한밭중고전자. All rights reserved.
            </div>
          </div>

          <div className="space-y-1 text-slate-400 text-[11px] sm:text-xs leading-relaxed">
            <p>
              <strong className="text-slate-200">상호 :</strong> 한밭중고전자 &nbsp;|&nbsp; 
              <strong className="text-slate-200">대표자 :</strong> 김영종 &nbsp;|&nbsp; 
              <strong className="text-slate-200">주소 :</strong> 대전광역시 중구 중촌동 144
            </p>
            <p>
              <strong className="text-slate-200">TEL :</strong> 042-523-8179 / 042-527-4888 &nbsp;|&nbsp; 
              <strong className="text-slate-200">HP :</strong> 010-5406-8179 &nbsp;|&nbsp; 
              <strong className="text-slate-200">사업자번호 :</strong> 314-01-70945 &nbsp;|&nbsp; 
              <strong className="text-slate-200">통신판매신고번호 :</strong> 2011-대전서구-0292
            </p>
            <p className="text-slate-500">
              개인정보 보호책임자 : 김태현(sunny3815@naver.com)
            </p>
          </div>
        </div>
      </footer>

      {/* 모달 팝업들 */}
      {isPwModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              🔒
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">비밀글 열람</h3>
            <p className="text-xs text-slate-500 mb-5">
              작성 시 등록하신 조회 비밀번호를 입력해 주세요.
            </p>

            <form onSubmit={handleVerifyPassword} className="space-y-3 text-left">
              <div>
                <input
                  type={showVerifyPassword ? "text" : "password"}
                  value={inputPw}
                  onChange={(e) => setInputPw(e.target.value)}
                  placeholder="비밀번호 입력"
                  required
                  autoFocus
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm text-center outline-none focus:border-[#0b4b8b]"
                />
                <div className="flex items-center gap-1.5 mt-2 justify-center">
                  <input
                    type="checkbox"
                    id="show-verify-pw"
                    checked={showVerifyPassword}
                    onChange={(e) => setShowVerifyPassword(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 accent-[#0b4b8b] cursor-pointer"
                  />
                  <label htmlFor="show-verify-pw" className="text-xs text-slate-600 cursor-pointer select-none">
                    문자 표시
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPwModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-[#0b4b8b] text-white font-bold text-xs hover:bg-[#093c70] transition"
                >
                  확인
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200 custom-scrollbar">
            <div className={`px-6 py-4 flex items-center justify-between sticky top-0 z-10 text-white ${selectedItem.is_notice ? 'bg-red-600' : 'bg-[#0b4b8b]'}`}>
              <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded">
                {selectedItem.is_notice ? "공지사항" : selectedItem.inquiry_type}
              </span>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-lg font-black text-slate-900 mb-2">
                  {selectedItem.category || "문의 내용"}
                </h2>
                <div className="flex flex-wrap gap-y-1 gap-x-4 text-slate-500 text-xs">
                  <span>작성자: <strong className="text-slate-800">{isAdmin || selectedItem.is_notice ? selectedItem.name : maskName(selectedItem.name)}</strong></span>
                  {(isAdmin || selectedItem.is_notice) && (
                    <span>연락처: <strong className="text-blue-600">{selectedItem.phone}</strong></span>
                  )}
                  <span>등록일: {new Date(selectedItem.created_at).toLocaleDateString()}</span>
                  {!selectedItem.is_notice && (
                    <span>상태: <strong className="text-blue-600">{selectedItem.status || '접수'}</strong></span>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[100px] border border-slate-100">
                {selectedItem.description || "등록된 상세 내용이 없습니다."}
              </div>

              {selectedItem.images && selectedItem.images.length > 0 && (
                <div className="pt-2">
                  <h4 className="font-bold text-slate-800 mb-2">📸 첨부 사진 ({selectedItem.images.length}장)</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedItem.images.map((imgUrl: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => setEnlargedImage(imgUrl)}
                        className="aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 cursor-pointer group relative"
                      >
                        <img src={imgUrl} alt={`첨부사진-${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">
                          확대
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ 고객 화면 노출용: 등록된 답변이 있을 경우 */}
              {selectedItem.admin_reply && !isAdmin && (
                <div className="bg-[#f0f6ff] rounded-2xl p-5 border border-blue-100 shadow-inner mt-4">
                  <h3 className="font-black text-[#0b4b8b] flex items-center gap-2 mb-3">
                    <span className="bg-[#0b4b8b] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">A</span>
                    한밭중고전자 답변입니다.
                  </h3>
                  <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pl-8">
                    {selectedItem.admin_reply}
                  </div>
                </div>
              )}

              {/* ✅ 관리자 전용 답변 폼 */}
              {!selectedItem.is_notice && isAdmin && (
                <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 mt-6 shadow-sm">
                  <h3 className="font-black text-slate-800 flex items-center gap-2 mb-3 text-sm">
                    <span>👑</span> 관리자 답변 달기
                  </h3>
                  <textarea 
                    value={replyContent} 
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={4}
                    placeholder="고객에게 남길 답변을 작성해 주세요."
                    className="w-full border border-slate-300 p-3 rounded-xl bg-white text-sm outline-none resize-y focus:border-[#0b4b8b] transition leading-relaxed mb-3"
                  />
                  <div className="flex justify-end">
                    <button onClick={handleReplySubmit} disabled={isReplying} className="bg-[#0b4b8b] text-white px-5 py-2 rounded-xl font-bold text-xs sm:text-sm hover:bg-blue-800 transition shadow-sm">
                      {isReplying ? "등록 중..." : "답변 저장 (상태 자동 업데이트)"}
                    </button>
                  </div>
                </div>
              )}

              {/* 관리자 상태 변경 패널 */}
              {!selectedItem.is_notice && isAdmin && (
                <div className="pt-4 mt-2 border-t border-slate-100">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-700">⚙️ 수동 상태 변경</span>
                    <div className="flex gap-2">
                      {["접수", "답변완료"].map((statusOption) => (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() => handleStatusUpdate(selectedItem.id, statusOption)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition shadow-sm ${
                            selectedItem.status === statusOption
                              ? "bg-[#0b4b8b] text-white"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {statusOption}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition border border-red-200"
                  >
                    삭제
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(false)}
                  className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && selectedItem && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-base">게시글 수정</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-white/80 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
              {!selectedItem.is_notice && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">문의 구분</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["내 물건 팔기", "구매 문의"].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setEditInquiryType(type)}
                        className={`py-2 rounded-lg font-bold border transition ${
                          editInquiryType === type
                            ? "border-[#0b4b8b] bg-[#0b4b8b] text-white"
                            : "border-slate-300 bg-white text-slate-600"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">제목</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#0b4b8b]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">상세 내용</label>
                <textarea
                  rows={5}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#0b4b8b] resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={editUpdating}
                  className="px-5 py-2 bg-[#0b4b8b] text-white rounded-lg font-bold hover:bg-[#093c70]"
                >
                  {editUpdating ? "수정 중..." : "수정 완료"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {enlargedImage && (
        <div
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={enlargedImage} alt="확대사진" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            <p className="text-center text-white/80 text-xs mt-2">화면을 클릭하면 닫힙니다.</p>
          </div>
        </div>
      )}

      {isWriteOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border border-slate-200">
            <div className={`px-6 py-4 flex items-center justify-between sticky top-0 z-10 text-white ${isNotice ? 'bg-red-600' : 'bg-[#0b4b8b]'}`}>
              <h3 className="font-bold text-base">
                {isNotice ? "📢 관리자 공지사항 등록" : "문의글 작성하기"}
              </h3>
              <button
                onClick={() => setIsWriteOpen(false)}
                className="text-white/80 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWriteSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
              {isAdmin && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📌</span>
                    <div>
                      <span className="font-extrabold text-red-800 block text-xs">최상단 고정 공지사항</span>
                      <span className="text-[11px] text-red-600">체크 시 모든 탭 상단에 자물쇠 없이 고정됩니다.</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isNotice}
                    onChange={(e) => setIsNotice(e.target.checked)}
                    className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                  />
                </div>
              )}

              {!isNotice && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">문의 구분 *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["내 물건 팔기", "구매 문의"].map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setInquiryType(type)}
                        className={`py-2.5 rounded-lg font-bold border transition ${
                          inquiryType === type
                            ? "border-[#0b4b8b] bg-[#0b4b8b] text-white"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">작성자 {isNotice ? "(공지표시명)" : "*"}</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isNotice ? "한밭중고전자" : "성함을 입력하세요"}
                    required={!isNotice}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#0b4b8b]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">연락처 {isNotice ? "(안내용)" : "*"}</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={isNotice ? "042-523-8179" : "연락처를 입력하세요"}
                    required={!isNotice}
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#0b4b8b]"
                  />
                </div>
              </div>

              {!isNotice && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">조회용 비밀번호 *</label>
                  <input
                    type={showWritePassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 설정"
                    required
                    className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#0b4b8b]"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                      type="checkbox"
                      id="show-write-pw"
                      checked={showWritePassword}
                      onChange={(e) => setShowWritePassword(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 accent-[#0b4b8b] cursor-pointer"
                    />
                    <label htmlFor="show-write-pw" className="text-xs text-slate-600 cursor-pointer select-none">
                      문자 표시
                    </label>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isNotice ? "공지 제목 *" : "제목 (제품명/수량) *"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isNotice ? "예: [공지] 매장 휴무 안내" : "예: 양문형 냉장고 매각 견적 요청드립니다."}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#0b4b8b]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isNotice ? "공지 상세 내용 *" : "상세 문의 내용"}
                </label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={isNotice ? "공지하실 내용을 작성해 주세요." : "제품 상태, 지역, 방문 희망 일정 등을 자세히 적어주세요."}
                  className="w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:border-[#0b4b8b] resize-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">사진 첨부 (선택, 최대 3장)</label>
                  <span className="text-[11px] text-blue-600 font-medium">자동 압축 등록</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={selectedFiles.length >= 3}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />

                {filePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {filePreviews.map((preview, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                        <img src={preview} alt="미리보기" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isNotice && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="modal-privacy-agree"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="rounded border-slate-300 accent-[#0b4b8b]"
                  />
                  <label htmlFor="modal-privacy-agree" className="text-slate-600 text-xs cursor-pointer">
                    개인정보 수집 및 이용에 동의합니다. *
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWriteOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2.5 rounded-lg text-white font-bold transition shadow-sm ${
                    isNotice ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0b4b8b] hover:bg-[#093c70]'
                  }`}
                >
                  {submitting ? "등록 처리 중..." : isNotice ? "공지사항 등록" : "문의 접수"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-2xl shadow-xl border border-slate-200 p-6 text-center">
            <h3 className="font-bold text-slate-900 text-base mb-1">관리자 인증</h3>
            <p className="text-xs text-slate-500 mb-4">
              관리자 마스터 비밀번호를 입력해 주세요.
            </p>
            <form onSubmit={handleAdminAuth} className="space-y-3">
              <input
                type="password"
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                placeholder="비밀번호"
                required
                autoFocus
                className="w-full border border-slate-300 rounded-xl p-2.5 text-center text-sm outline-none focus:border-[#0b4b8b]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminAuthModalOpen(false)}
                  className="w-1/2 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-[#0b4b8b] text-white font-bold text-xs hover:bg-[#093c70]"
                >
                  인증
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}