"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "@/context/store-context";
import { ShoppingBag, Search, Sun, Moon, LogOut, LayoutDashboard, Shield, ChevronDown, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const {
    session,
    setSession,
    setOrders,
    cartItems,
    setCartOpen,
    setAuthOpen,
    setAuthMode,
    theme,
    toggleTheme,
    searchQuery,
    setSearchQuery,
    activeView,
    setActiveView,
    addToast
  } = useStore();

  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [animateCart, setAnimateCart] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Total items in cart
  const cartItemsCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Trigger bounce animation when cart count changes
  useEffect(() => {
    if (cartItemsCount > 0) {
      const timeoutId = setTimeout(() => {
        setAnimateCart(true);
      }, 0);
      const timer = setTimeout(() => setAnimateCart(false), 400);
      return () => {
        clearTimeout(timeoutId);
        clearTimeout(timer);
      };
    }
  }, [cartItemsCount]);

  async function handleLogout() {
    setDropdownOpen(false);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");
      
      setSession(null);
      setOrders([]);
      setActiveView("store");
      addToast("You have been signed out.", "info");
    } catch {
      addToast("Failed to sign out.", "error");
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border bg-card/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <div 
          onClick={() => setActiveView("store")} 
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-brand text-primary-brand-foreground shadow-md transition-transform group-hover:scale-105">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-foreground font-sans">
              SANTHOSH
            </span>
            <span className="ml-1 text-xs font-bold text-gold-brand tracking-widest uppercase">
              Store
            </span>
          </div>
        </div>

        {/* Search Bar - hidden on mobile checkout but visible in storefront view */}
        <div className="hidden md:flex relative w-full max-w-md mx-6">
          <Search className="absolute left-4 top-3 h-4.5 w-4.5 text-muted-txt" />
          <input
            type="text"
            placeholder="Search our catalog (e.g. sneaker, jacket, ceramic)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeView !== "store") {
                setActiveView("store");
              }
            }}
            className="w-full rounded-2xl border border-border-brand bg-muted-bg/50 py-2.5 pl-11 pr-4 text-sm outline-none placeholder:text-muted-txt focus:bg-card focus:border-primary-brand focus:ring-2 focus:ring-primary-brand/10 transition-all text-foreground"
          />
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-4">
          
          {/* Mobile Search Icon Toggle */}
          <button 
            onClick={() => {
              setActiveView("store");
              addToast("Use the search bar to filter products", "info");
            }}
            className="p-2 md:hidden text-muted-txt hover:text-foreground hover:bg-muted-bg rounded-xl transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 text-muted-txt hover:text-foreground hover:bg-muted-bg rounded-2xl transition-all active:scale-95"
            aria-label="Toggle theme"
          >
            {!mounted ? (
              <Moon className="h-5 w-5" />
            ) : theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>

          {/* Cart Icon Trigger */}
          <button
            onClick={() => setCartOpen(true)}
            className={`relative p-2.5 text-muted-txt hover:text-foreground hover:bg-muted-bg rounded-2xl transition-all active:scale-95 ${
              animateCart ? "animate-bounce" : ""
            }`}
          >
            <ShoppingBag className="h-5 w-5 text-foreground" />
            {mounted && cartItemsCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gold-brand text-[10px] font-bold text-white shadow-md animate-scale-up">
                {cartItemsCount}
              </span>
            )}
          </button>

          {/* User Account Controls */}
          {session ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 rounded-2xl border border-border-brand bg-muted-bg/30 px-3 py-1.5 text-sm font-semibold hover:bg-muted-bg hover:border-muted-txt transition-all"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-brand text-xs font-bold text-primary-brand-foreground">
                  {session.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-foreground max-w-[100px] truncate">
                  {session.name.split(" ")[0]}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-txt transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Account Dropdown Menu */}
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-card-border bg-card p-2 shadow-xl animate-scale-up z-20">
                    <div className="border-b border-border-brand px-3 py-2.5">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-txt">Logged in as</p>
                      <p className="font-semibold text-foreground truncate">{session.name}</p>
                      <p className="text-xs text-muted-txt truncate">{session.email}</p>
                      {session.role === "ADMIN" && (
                        <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-gold-brand-light px-2 py-0.5 text-[10px] font-bold text-gold-brand border border-gold-brand/20">
                          <Shield className="h-3 w-3" /> Administrator
                        </span>
                      )}
                    </div>

                    <div className="p-1 space-y-0.5">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setActiveView("store");
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-muted-bg transition-colors ${
                          activeView === "store" ? "text-gold-brand bg-gold-brand-light/20" : "text-foreground"
                        }`}
                      >
                        <Compass className="h-4.5 w-4.5" /> Storefront
                      </button>

                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setActiveView("dashboard");
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-muted-bg transition-colors ${
                          activeView === "dashboard" ? "text-gold-brand bg-gold-brand-light/20" : "text-foreground"
                        }`}
                      >
                        <LayoutDashboard className="h-4.5 w-4.5" /> Order Dashboard
                      </button>

                      {session.role === "ADMIN" && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setActiveView("admin");
                          }}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-muted-bg transition-colors ${
                            activeView === "admin" ? "text-gold-brand bg-gold-brand-light/20" : "text-foreground"
                          }`}
                        >
                          <Shield className="h-4.5 w-4.5" /> Admin Portal
                        </button>
                      )}

                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-error-brand hover:bg-red-500/5 transition-colors"
                      >
                        <LogOut className="h-4.5 w-4.5" /> Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAuthMode("login");
                setAuthOpen(true);
              }}
              className="rounded-2xl"
            >
              Sign In
            </Button>
          )}

        </div>

      </div>
    </header>
  );
}
