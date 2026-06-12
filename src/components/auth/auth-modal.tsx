"use client";

import React, { useState } from "react";
import { useStore } from "@/context/store-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Lock, Mail, User, Eye, EyeOff } from "lucide-react";

export function AuthModal() {
  const { isAuthOpen, setAuthOpen, authMode, setAuthMode, setSession, refreshOrders, addToast } = useStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isAuthOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    
    if (authMode === "register" && name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (password.length < (authMode === "register" ? 8 : 1)) {
      setError(authMode === "register" ? "Password must be at least 8 characters" : "Password is required");
      return;
    }

    setIsLoading(true);

    try {
      const payload = authMode === "login" ? { email, password } : { name, email, password };
      const route = authMode === "login" ? "/api/auth/login" : "/api/auth/register";

      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Authentication failed");
      }

      setSession(data.user);
      addToast(
        authMode === "login" ? `Welcome back, ${data.user.name}!` : `Account successfully created!`,
        "success"
      );
      setAuthOpen(false);
      
      // Clean forms
      setName("");
      setEmail("");
      setPassword("");
      
      // Refresh orders
      await refreshOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      addToast(err instanceof Error ? err.message : "Authentication failed", "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={() => setAuthOpen(false)}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-card-border bg-card p-6 shadow-2xl animate-scale-up z-10 md:p-8">
        <button
          onClick={() => setAuthOpen(false)}
          className="absolute right-5 top-5 rounded-full p-1.5 text-muted-txt hover:bg-muted-bg hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 mt-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {authMode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-1 text-sm text-muted-txt">
            {authMode === "login"
              ? "Sign in to access your orders, track packages, and check out."
              : "Register to place orders, save items to cart, and track fulfillment."}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm font-semibold text-error-brand animate-fade-in-up">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === "register" && (
            <div className="relative">
              <User className="absolute left-4 top-10.5 h-4 w-4 text-muted-txt" />
              <Input
                label="Full Name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ paddingLeft: "2.75rem" }}
                required
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-10.5 h-4 w-4 text-muted-txt" />
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ paddingLeft: "2.75rem" }}
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-10.5 h-4 w-4 text-muted-txt" />
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingLeft: "2.75rem", paddingRight: "2.75rem" }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-10.5 text-muted-txt hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            {authMode === "login" ? "Sign In" : "Register"}
          </Button>
        </form>

        <div className="mt-6 border-t border-border-brand pt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === "login" ? "register" : "login");
              setError("");
              setShowPassword(false);
            }}
            className="text-sm font-semibold text-gold-brand hover:text-gold-brand-hover transition-colors"
          >
            {authMode === "login"
              ? "Don't have an account? Register"
              : "Already have an account? Sign In"}
          </button>
        </div>

        {authMode === "login" && (
          <div className="mt-4 rounded-2xl border border-dashed border-gold-brand/20 bg-gold-brand-light p-4 text-xs leading-relaxed text-gold-brand dark:text-amber-400">
            <span className="font-bold">Demo Admin Credentials:</span>
            <br />
            Email: <span className="underline select-all">admin@santhosh.store</span>
            <br />
            Password: <span className="underline select-all">Admin123!</span>
          </div>
        )}
      </div>
    </div>
  );
}
