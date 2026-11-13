// 파일 경로: app/sell/page.tsx
import { permanentRedirect } from "next/navigation";

export default function SellRedirectPage() {
  permanentRedirect("/purchase");
}
