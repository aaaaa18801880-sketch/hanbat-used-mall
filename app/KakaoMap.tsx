"use client";

import { useEffect } from "react";

export default function KakaoMap() {
  useEffect(() => {
    const scriptId = "daum-roughmap-loader";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const renderMap = () => {
      // @ts-ignore
      if (window.daum && window.daum.roughmap) {
        // @ts-ignore
        new window.daum.roughmap.Lander({
          "timestamp" : "1790852883762",
          "key" : "2ioee5nxg9f",
          "mapWidth" : "100%",
          "mapHeight" : "100%"
        }).render();
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.charset = "UTF-8";
      script.src = "https://t1.kakaocdn.net/kakaomapweb/roughmap/loader/prod/roughmapLoader.js";
      script.async = true;
      script.onload = renderMap;
      document.head.appendChild(script);
    } else {
      renderMap();
    }
  }, []);

  return (
    <div className="absolute inset-0 h-full w-full bg-[#EFECE6] overflow-hidden">
      <div id="daumRoughmapContainer1790852883762" className="root_daum_roughmap root_daum_roughmap_landing w-full h-full" />
      <style jsx global>{`
        .root_daum_roughmap {
          width: 100% !important;
          height: 100% !important;
        }
        .wrap_roughmap {
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </div>
  );
}