// 파일 경로: app/inquiry/page.tsx
import React from "react";
import { fetchInitialPublicInquiries } from "../../lib/server-inquiries";
import {
  InquiryBoardClient,
  type Inquiry,
} from "../../components/inquiry/inquiry-board-client";

export const dynamic = "force-dynamic";

export default async function InquiryBoardPage() {
  const { inquiries, loaded } = await fetchInitialPublicInquiries(200);

  return (
    <InquiryBoardClient
      initialInquiries={inquiries as Inquiry[]}
      initialLoaded={loaded}
    />
  );
}
