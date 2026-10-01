"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

export default function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 스크립트가 로드되었고, div 요소가 준비되었을 때만 실행
    if (isLoaded && mapRef.current && (window as any).naver && (window as any).naver.maps) {
      const naver = (window as any).naver;
      const location = new naver.maps.LatLng(36.335503, 127.406981); // 매장 좌표
      
      const map = new naver.maps.Map(mapRef.current, {
        center: location,
        zoom: 16,
        minZoom: 10,
      });
      
      new naver.maps.Marker({
        position: location,
        map: map,
      });
    }
  }, [isLoaded]);

  return (
    <>
      {/* 💡 핵심: 네이버 서버에 "나 hanbatmall.com 이니까 문 열어!"라고 신분을 밝히는 태그 */}
      <meta name="referrer" content="no-referrer-when-downgrade" />
      
      {/* 네이버 지도 API 불러오기 */}
      <Script 
        strategy="afterInteractive"
        src="https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=oc9co55lfd"
        onLoad={() => setIsLoaded(true)}
      />
      
      {/* 지도가 그려질 도화지 */}
      <div ref={mapRef} className="absolute inset-0 h-full w-full border-0 bg-[#EFECE6]" />
    </>
  );
}