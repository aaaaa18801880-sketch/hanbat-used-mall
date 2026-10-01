"use client";

import { useRef } from "react";
import Script from "next/script";

export default function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=oc9co55lfd"
        onLoad={() => {
          const naver = (window as any).naver;
          if (mapRef.current && naver) {
            // 대전 중구 중촌동 144 좌표
            const location = new naver.maps.LatLng(36.335503, 127.406981);
            
            // 지도 화면에 띄우기
            const map = new naver.maps.Map(mapRef.current, {
              center: location,
              zoom: 16, // 확대 정도 (숫자가 클수록 확대됨)
              minZoom: 10,
            });
            
            // 빨간색 핀(마커) 꽂기
            new naver.maps.Marker({
              position: location,
              map: map,
            });
          }
        }}
      />
      <div ref={mapRef} className="absolute inset-0 h-full w-full border-0 bg-[#EFECE6]" />
    </>
  );
}