"use client";

import React, { useState } from "react";
import { KeyRound } from "lucide-react";

import { useStore } from "@/context/store-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm() {
  const { addToast } = useStore();
  const [isOpen, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not change password");
      }

      addToast("Password updated.", "success");
      reset();
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-card-border bg-card p-6 shadow-sm md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-gold-brand" aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold text-foreground">Password</h3>
            <p className="text-xs text-muted-txt">Change the password you use to sign in.</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={isOpen}
          aria-controls="change-password-form"
          onClick={() => {
            if (isOpen) reset();
            setOpen(!isOpen);
          }}
        >
          {isOpen ? "Cancel" : "Change password"}
        </Button>
      </div>

      {isOpen && (
        <form id="change-password-form" onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-3" noValidate>
          <Input
            id="current-password"
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            id="new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
          <Input
            id="confirm-password"
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {error && (
            <p role="alert" className="md:col-span-3 text-xs font-semibold text-error-brand">
              {error}
            </p>
          )}
          <div className="md:col-span-3">
            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
              Update password
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
