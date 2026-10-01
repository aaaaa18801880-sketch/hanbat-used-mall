"use client";

import { useEffect, useRef } from "react";

export default function NaverMap() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. 지도 그리는 함수
    const initMap = () => {
      // @ts-ignore
      if (!mapRef.current || !window.naver) return;
      // @ts-ignore
      const location = new window.naver.maps.LatLng(36.335503, 127.406981);
      // @ts-ignore
      const map = new window.naver.maps.Map(mapRef.current, {
        center: location,
        zoom: 16, // 숫자 조절로 확대/축소 가능
        minZoom: 10,
      });
      // @ts-ignore
      new window.naver.maps.Marker({
        position: location,
        map: map,
      });
    };

    // 2. 이미 로드되었는지 확인 후 스크립트 강제 주입
    // @ts-ignore
    if (window.naver && window.naver.maps) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=oc9co55lfd";
      script.async = true;
      script.onload = initMap;
      document.head.appendChild(script);
    }
  }, []);

  return <div ref={mapRef} className="absolute inset-0 h-full w-full border-0 bg-[#EFECE6]" />;
}