"use client";

import React from "react";
import Link from "next/link";
import { type AnalyticsEventName, trackEvent } from "../../lib/site";

type TrackedLinkProps = Omit<React.ComponentProps<typeof Link>, "onClick"> & {
  eventName: AnalyticsEventName;
  eventParams?: Parameters<typeof trackEvent>[1];
};

export function TrackedLink({
  eventName,
  eventParams,
  ...props
}: TrackedLinkProps) {
  return (
    <Link
      {...props}
      onClick={() => trackEvent(eventName, eventParams)}
    />
  );
}
