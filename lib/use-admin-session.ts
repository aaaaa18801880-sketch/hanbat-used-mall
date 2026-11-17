"use client";

import { useEffect, useState } from "react";
import {
  hasSupabaseSessionToken,
  subscribeAdminAuthSignal,
} from "./admin-auth";

/**
 * Subscribe to the Supabase auth session only when an auth session token exists or sign-in triggers.
 */
export function useIsAdminSession(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribeAuth: (() => void) | null = null;
    let attachPromise: Promise<void> | null = null;

    const attachSupabaseAuth = () => {
      if (attachPromise || !active) return;
      attachPromise = import("./supabase")
        .then(async ({ isAuthorizedAdminUser, supabase }) => {
          if (!active) return;
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (active) {
            setIsAdmin(isAuthorizedAdminUser(session?.user));
          }

          const { data: authListener } = supabase.auth.onAuthStateChange(
            (_event, nextSession) => {
              if (active) {
                setIsAdmin(isAuthorizedAdminUser(nextSession?.user));
              }
            }
          );
          if (!active) {
            authListener.subscription.unsubscribe();
          } else {
            unsubscribeAuth = () => authListener.subscription.unsubscribe();
          }
        })
        .catch(() => {
          attachPromise = null;
        });
    };

    if (hasSupabaseSessionToken()) {
      attachSupabaseAuth();
    }

    const unsubscribeSignal = subscribeAdminAuthSignal(() => {
      if (hasSupabaseSessionToken()) {
        attachSupabaseAuth();
      } else if (active) {
        setIsAdmin(false);
      }
    });

    return () => {
      active = false;
      unsubscribeSignal();
      unsubscribeAuth?.();
    };
  }, []);

  return isAdmin;
}
