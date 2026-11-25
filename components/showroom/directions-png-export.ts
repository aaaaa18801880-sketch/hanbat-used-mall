// 파일 경로: components/showroom/directions-png-export.ts
"use client";

import toast from "react-hot-toast";
import { STORE, trackEvent } from "../../lib/site";
import {
  STORE_DIRECTION_PHOTO_STEPS,
  getStoreDirectionRoute,
  type DirectionRouteId,
} from "../../lib/store-directions";

async function fetchImageAsDataUrl(src: string): Promise<string | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function loadHtmlImage(src: string): Promise<HTMLImageElement | null> {
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  } catch {
    return null;
  }
}

/**
 * 건축·에디토리얼 오시는 길 브로슈어형 고해상도 PNG 저장
 * (정밀 약도 + 다크 네이비 주소바 + 3D 화살표 실사 골목 3단계 + 오시는 길/주차·문의 요약)
 */
export async function downloadBrandedDirectionsPng(
  svgEl: SVGSVGElement | null,
  activeRoute: DirectionRouteId
) {
  if (!svgEl) {
    toast.error("약도를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
    return;
  }

  try {
    const route = getStoreDirectionRoute(activeRoute);
    const cloned = svgEl.cloneNode(true) as SVGSVGElement;
    cloned.setAttribute("width", "1260");
    cloned.setAttribute("height", "735");

    const exteriorDataUrl = await fetchImageAsDataUrl("/store-exterior.jpg");
    if (exteriorDataUrl) {
      const imgs = cloned.querySelectorAll("image");
      imgs.forEach((node) => {
        node.setAttribute("href", exteriorDataUrl);
      });
    }

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(cloned);
    const svgBlob = new Blob([svgString], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const [mapImg, ...stepImgs] = await Promise.all([
      loadHtmlImage(url),
      ...STORE_DIRECTION_PHOTO_STEPS.map((step) =>
        loadHtmlImage(step.imageSrc)
      ),
    ]);
    URL.revokeObjectURL(url);
    if (!mapImg) {
      throw new Error("Map image failed to load");
    }

    const hasAllStepPhotos = stepImgs.every((img) => img !== null);
    const W = 1280;
    const pad = 44;
    const contentW = W - pad * 2;
    const headerH = 74;
    const mapH = Math.round((contentW * 490) / 840);
    const addrBarH = 72;
    const photoSectionH = hasAllStepPhotos ? 300 : 0;
    const infoAreaH = 216;
    const H = pad + headerH + mapH + addrBarH + photoSectionH + infoAreaH + pad;

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas context unavailable");
    }

    const traceRoundedRect = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    // 전체 웜 스톤 에디토리얼 캔버스
    ctx.fillStyle = "#FAFAF8";
    ctx.fillRect(0, 0, W, H);

    // 상단 브랜드 헤더 바
    ctx.fillStyle = "#C84312";
    ctx.fillRect(pad, pad + 6, 10, 10);
    ctx.fillStyle = "#141A23";
    ctx.textAlign = "left";
    ctx.font = "800 28px Pretendard, -apple-system, sans-serif";
    ctx.fillText(`${STORE.name} 오시는 길 약도`, pad + 22, pad + 20);

    ctx.fillStyle = "#475569";
    ctx.font = "600 18px Pretendard, -apple-system, sans-serif";
    ctx.fillText(
      `대전 중구 중촌동 144 · 1·2층 직영 전시장 · ${route.shortLabel} 기준`,
      pad,
      pad + 50
    );

    ctx.textAlign = "right";
    ctx.fillStyle = "#141A23";
    ctx.font = "800 24px Pretendard, -apple-system, sans-serif";
    ctx.fillText(STORE.tel, W - pad, pad + 22);
    ctx.fillStyle = "#64748B";
    ctx.font = "600 17px Pretendard, -apple-system, sans-serif";
    ctx.fillText(`${STORE.hours} (${STORE.closed})`, W - pad, pad + 49);

    // 약도 프레임 + 하단 딥 네이비 주소바
    const frameX = pad;
    const frameY = pad + headerH;
    const frameW = contentW;
    const frameH = mapH + addrBarH;
    const radius = 20;

    ctx.save();
    traceRoundedRect(frameX, frameY, frameW, frameH, radius);
    ctx.clip();
    ctx.drawImage(mapImg, frameX, frameY, frameW, mapH);

    // 하단 딥 네이비 주소바
    ctx.fillStyle = "#141A23";
    ctx.fillRect(frameX, frameY + mapH, frameW, addrBarH);

    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 24px Pretendard, -apple-system, sans-serif";
    ctx.fillText(STORE.roadAddress, frameX + 28, frameY + mapH + 45);

    ctx.textAlign = "right";
    ctx.fillStyle = "#CBD5E1";
    ctx.font = "600 19px Pretendard, -apple-system, sans-serif";
    ctx.fillText(
      `${STORE.addressNote} · 전용 주차 8대`,
      frameX + frameW - 28,
      frameY + mapH + 44
    );
    ctx.restore();

    traceRoundedRect(frameX, frameY, frameW, frameH, radius);
    ctx.strokeStyle = "#D4D1C7";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3D 화살표 실제 골목 진입 3단계 스트립
    if (hasAllStepPhotos) {
      const stripTop = frameY + frameH + 28;
      ctx.textAlign = "left";
      ctx.fillStyle = "#141A23";
      ctx.font = "800 21px Pretendard, -apple-system, sans-serif";
      ctx.fillText("실제 골목 진입 3단계 (3D 주행 방향 표시)", pad, stripTop + 18);

      const gap = 18;
      const cardW = Math.floor((contentW - gap * 2) / 3);
      const imgH = Math.round((cardW * 690) / 1200);
      const cardsY = stripTop + 34;

      STORE_DIRECTION_PHOTO_STEPS.forEach((step, idx) => {
        const img = stepImgs[idx];
        if (!img) return;
        const cx = pad + idx * (cardW + gap);
        const badgeColor = idx === 2 ? "#C84312" : "#2563EB";

        ctx.save();
        traceRoundedRect(cx, cardsY, cardW, imgH, 12);
        ctx.clip();
        ctx.drawImage(img, cx, cardsY, cardW, imgH);
        ctx.restore();

        traceRoundedRect(cx, cardsY, cardW, imgH, 12);
        ctx.strokeStyle = "#D4D1C7";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // 좌상단 스텝 번호 배지
        ctx.fillStyle = badgeColor;
        traceRoundedRect(cx + 10, cardsY + 10, 42, 26, 7);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.font = "800 16px Pretendard, -apple-system, sans-serif";
        ctx.fillText(step.stepNumber, cx + 31, cardsY + 29);

        ctx.textAlign = "left";
        ctx.fillStyle = "#141A23";
        ctx.font = "800 19px Pretendard, -apple-system, sans-serif";
        ctx.fillText(step.title, cx + 2, cardsY + imgH + 28);
      });
    }

    // 하단 2컬럼 에디토리얼 요약 (오시는 길 | 주차·방문 안내)
    const infoTop = frameY + frameH + photoSectionH + 34;
    ctx.beginPath();
    ctx.moveTo(pad, infoTop);
    ctx.lineTo(W - pad, infoTop);
    ctx.strokeStyle = "#E5E3DC";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const colGap = 40;
    const colW = (contentW - colGap) / 2;

    // 좌측: 오시는 길
    ctx.textAlign = "left";
    ctx.fillStyle = "#C84312";
    ctx.font = "800 16px Pretendard, -apple-system, sans-serif";
    ctx.fillText("오시는 길 핵심", pad, infoTop + 36);

    ctx.fillStyle = "#141A23";
    ctx.font = "700 20px Pretendard, -apple-system, sans-serif";
    ctx.fillText("주공하나마트 옆 골목 진입 → 끝까지 직진(약 2분)", pad, infoTop + 68);

    ctx.fillStyle = "#475569";
    ctx.font = "500 17px Pretendard, -apple-system, sans-serif";
    ctx.fillText(
      "철교(4.5m) 바로 앞 횡단보도 옆 골목으로 들어오면 초록색 중촌고가교 밑에",
      pad,
      infoTop + 100
    );
    ctx.fillText(
      "한밭중고전자 1·2층 직영 전시장과 파란색 간판이 바로 보입니다.",
      pad,
      infoTop + 126
    );

    // 우측: 주차 · 문의
    const rightX = pad + colW + colGap;
    ctx.fillStyle = "#1D4E89";
    ctx.font = "800 16px Pretendard, -apple-system, sans-serif";
    ctx.fillText("전용 주차 · 방문 안내", rightX, infoTop + 36);

    ctx.fillStyle = "#141A23";
    ctx.font = "700 20px Pretendard, -apple-system, sans-serif";
    ctx.fillText("매장 앞 전용 주차장 8대 · 1톤 화물 상차 가능", rightX, infoTop + 68);

    ctx.fillStyle = "#475569";
    ctx.font = "500 17px Pretendard, -apple-system, sans-serif";
    ctx.fillText(
      `지번 주소: ${STORE.jibunAddress} (${STORE.addressNote})`,
      rightX,
      infoTop + 100
    );
    ctx.fillText(
      `대표전화 ${STORE.tel}  ·  직통 ${STORE.mobile}`,
      rightX,
      infoTop + 126
    );

    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `${STORE.name}-오시는길-약도.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    trackEvent("download_store_directions_map");
    toast.success("오시는 길 약도 이미지(PNG)가 저장되었습니다.");
  } catch {
    toast.error("약도 이미지 저장에 실패했습니다. 다시 시도해 주세요.");
  }
}
