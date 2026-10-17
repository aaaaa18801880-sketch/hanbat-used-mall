import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFFFF",
          borderRadius: "14px",
          border: "2px solid #E4E0D8",
        }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 64 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left Navy Pillar (Top & Bottom) */}
          <path d="M8 14L21 7V24L8 32V14Z" fill="#0E1A2B" />
          <path d="M8 39L21 31V56H8V39Z" fill="#0E1A2B" />
          {/* Right Navy Pillar (Top & Bottom) */}
          <path d="M56 14L43 7V24L56 32V14Z" fill="#0E1A2B" />
          <path d="M56 39L43 31V56H56V39Z" fill="#0E1A2B" />
          {/* Orange Roof Chevron */}
          <path d="M32 16L8 31V38L32 23L56 38V31L32 16Z" fill="#D9531E" />
          {/* 4 Orange Window Squares */}
          <rect x="25" y="31" width="6" height="6" rx="1.2" fill="#D9531E" />
          <rect x="33" y="31" width="6" height="6" rx="1.2" fill="#D9531E" />
          <rect x="25" y="39" width="6" height="6" rx="1.2" fill="#D9531E" />
          <rect x="33" y="39" width="6" height="6" rx="1.2" fill="#D9531E" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}