// 파일 경로: app/sell/page.tsx
import { redirect } from "next/navigation";

export default function SellRedirectPage() {
  redirect("/purchase");
}
