import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 48,
  height: 48,
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
          background: "#0b4b8b",
          borderRadius: "10px",
          fontSize: "30px",
        }}
      >
        ⚡
      </div>
    ),
    {
      ...size,
    }
  );
}