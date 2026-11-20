"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { ICON, Icon } from "../../lib/icons";
import { notifyAdminAuthChanged } from "../../lib/admin-auth";
import { Modal } from "./ui-primitives";

export function AdminLoginModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const handleClose = () => {
    setAdminPassword("");
    onClose();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const { supabase, isAuthorizedAdminUser } = await import("../../lib/supabase");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminEmail.trim(),
        password: adminPassword,
      });
      if (error) {
        toast.error("로그인 실패: " + error.message);
        return;
      }
      if (!isAuthorizedAdminUser(data.user)) {
        await supabase.auth.signOut();
        toast.error("관리자 권한이 없습니다.");
        return;
      }
      notifyAdminAuthChanged();
      toast.success("관리자 권한이 확인되었습니다.");
      setAdminPassword("");
      onClose();
      onSuccess?.();
    } catch {
      toast.error("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      label="관리자 로그인"
      panelClassName="max-w-sm"
    >
      <form
        onSubmit={handleAdminLogin}
        className="w-full rounded-2xl bg-[#FAF9F6] p-6 sm:p-8 shadow-2xl border border-[#E2DDD3]"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-hb-lg font-bold text-[#141A23]">
            관리자 로그인
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#F1F3F6] text-[#334155] active:scale-[0.96] transition-[background-color,transform]"
          >
            <Icon d={ICON.close} />
          </button>
        </div>
        <label className="hb-label" htmlFor="admin-shared-modal-email">
          이메일
        </label>
        <input
          id="admin-shared-modal-email"
          name="username"
          type="email"
          autoComplete="username"
          spellCheck={false}
          required
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          className="hb-input mt-1 mb-4"
        />
        <label className="hb-label" htmlFor="admin-shared-modal-pw">
          비밀번호
        </label>
        <input
          id="admin-shared-modal-pw"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          className="hb-input mt-1"
        />
        <button
          type="submit"
          disabled={loggingIn}
          className="hb-btn-primary mt-6 h-11 w-full text-hb-sm active:scale-[0.96]"
        >
          {loggingIn ? "로그인 중…" : "로그인"}
        </button>
      </form>
    </Modal>
  );
}
