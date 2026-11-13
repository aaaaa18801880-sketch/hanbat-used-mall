"use client";

import { useEffect, useState } from "react";
import { isAuthorizedAdminUser, supabase } from "./supabase";

/**
 * Subscribe to the Supabase auth session and return whether the current user is an authorized admin.
 */
export function useIsAdminSession(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (active) {
        setIsAdmin(isAuthorizedAdminUser(session?.user));
      }
    };

    void syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (active) {
          setIsAdmin(isAuthorizedAdminUser(session?.user));
        }
      }
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return isAdmin;
}
