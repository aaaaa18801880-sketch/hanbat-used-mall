// 사이트 공통 상수와 유틸. 전화번호·주소·링크는 여기 한 곳에서만 수정하세요.
export const STORE = {
  name: "한밭중고전자",
  url: "https://hanbatmall.com",
  since: 1997,
  ceo: "김영종",
  tel: "042-523-8179",
  tel2: "042-527-4888",
  mobile: "010-5406-8179",
  address: "대전광역시 중구 중촌동 144",
  addressNote: "중촌고가도로 밑",
  hours: "월~토 09:00 - 19:00",
  closed: "일요일 휴무",
  bizNo: "314-01-70945",
  mailOrderNo: "2011-대전서구-0292",
  privacyOfficer: "김태현(sunny3815@naver.com)",
  kakaoChannel: "https://pf.kakao.com/_XmyrX",
  kakaoChat: "https://pf.kakao.com/_XmyrX/chat",
  cafe: "https://cafe.naver.com/hanbatmall",
  naverMapShort: "https://naver.me/F5DkWQ4z",
} as const;

export const telHref = (num: string) => `tel:${num.replace(/[^0-9+]/g, "")}`;

export function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

export const isValidPhone = (value: string) => {
  const n = value.replace(/\D/g, "").length;
  return n >= 9 && n <= 11;
};

export function maskName(rawName?: string | null) {
  if (!rawName) return "고*객";
  if (rawName.length === 1) return rawName;
  if (rawName.length === 2) return rawName.charAt(0) + "*";
  return rawName.charAt(0) + "*".repeat(rawName.length - 2) + rawName.slice(-1);
}

export const splitImages = (value?: string | null) =>
  (value ?? "").split(",").map((v) => v.trim()).filter(Boolean);

export const MAX_PHOTOS = 3;
export const MAX_FILE_MB = 15;

/** 이미지 파일만 통과시키고 용량 초과는 걸러냅니다. */
export function validateImageFiles(files: File[]): { ok: File[]; error?: string } {
  const ok: File[] = [];
  let error: string | undefined;
  for (const f of files) {
    if (!f.type.startsWith("image/")) { error = "이미지 파일만 첨부할 수 있습니다."; continue; }
    if (f.size > MAX_FILE_MB * 1024 * 1024) { error = `사진 한 장당 ${MAX_FILE_MB}MB 이하만 첨부할 수 있습니다.`; continue; }
    ok.push(f);
  }
  return { ok, error };
}

/** 긴 변 1200px, JPEG 0.75로 압축. 읽기/로드 실패도 reject 처리합니다. */
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.onload = (event) => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
      img.onload = () => {
        const maxDim = 1200;
        let { width, height } = img;
        if (width > height) {
          if (width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height); height = maxDim;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("압축에 실패했습니다."))), "image/jpeg", 0.75);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}