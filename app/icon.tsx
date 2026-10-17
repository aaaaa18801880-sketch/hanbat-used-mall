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
          background: "#0E1A2B",
          borderRadius: "14px",
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="8" y="9" width="5.5" height="22" rx="1.2" fill="#FFFFFF" />
          <rect x="26.5" y="9" width="5.5" height="22" rx="1.2" fill="#FFFFFF" />
          <path
            d="M20 9.5L8 17.5V21.8L20 13.8L32 21.8V17.5L20 9.5Z"
            fill="#D9531E"
          />
          <rect x="15.5" y="19.5" width="3.8" height="3.8" rx="0.8" fill="#D9531E" />
          <rect x="20.7" y="19.5" width="3.8" height="3.8" rx="0.8" fill="#D9531E" />
          <rect x="15.5" y="24.7" width="3.8" height="3.8" rx="0.8" fill="#FFFFFF" />
          <rect x="20.7" y="24.7" width="3.8" height="3.8" rx="0.8" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}