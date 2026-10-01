"use client";

import { useEffect } from "react";

export default function KakaoMap() {
  useEffect(() => {
    // 1. 이미 지도가 그려져 있는지 확인 (중복 실행으로 인한 충돌 방지)
    const container = document.getElementById("daumRoughmapContainer1790852883762");
    if (container && container.innerHTML.trim() !== "") {
      return;
    }

    // 2. 카카오 지도 로더 스크립트 동적 생성
    const script = document.createElement("script");
    script.charset = "UTF-8";
    script.src = "https://t1.kakaocdn.net/kakaomapweb/roughmap/loader/prod/roughmapLoader.js";
    script.async = true;

    script.onload = () => {
      // @ts-ignore
      if (window.daum && window.daum.roughmap) {
        // @ts-ignore
        new window.daum.roughmap.Lander({
          "timestamp" : "1790852883762",
          "key" : "2ioee5nxg9f",
          "mapWidth" : "640",
          "mapHeight" : "500"
        }).render();
      }
    };

    document.body.appendChild(script);
  }, []);

  return (
    <div className="absolute inset-0 h-full w-full bg-[#EFECE6] overflow-hidden">
      {/* 카카오 맵이 그려질 타겟 div */}
      <div id="daumRoughmapContainer1790852883762" className="root_daum_roughmap root_daum_roughmap_landing w-full h-full"></div>
      
      {/* 카카오 맵 내부의 고정된 크기를 화면 와이드 비율에 맞게 강제 확장하는 CSS */}
      <style jsx global>{`
        .root_daum_roughmap {
          width: 100% !important;
          height: 100% !important;
        }
        .wrap_roughmap {
          width: 100% !important;
          height: 100% !important;
        }
        .root_daum_roughmap iframe {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}