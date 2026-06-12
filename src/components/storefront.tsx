"use client";

import React from "react";
import { StoreProvider, useStore } from "@/context/store-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductModal } from "@/components/storefront/product-modal";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { AuthModal } from "@/components/auth/auth-modal";
import { UserDashboard } from "@/components/profile/user-dashboard";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Toasts } from "@/components/ui/toasts";

function StorefrontContent() {
  const { activeView, loading, selectedProduct } = useStore();

  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-background text-foreground transition-colors duration-300">
      
      {/* Background aesthetics */}
      <div className="subtle-grid absolute inset-0 opacity-60 pointer-events-none" />
      <div className="blur-blob left-[-10rem] top-[-8rem] h-80 w-80 bg-emerald-950/5 dark:bg-emerald-950/20" />
      <div className="blur-blob right-[-8rem] top-28 h-72 w-72 bg-gold-brand/5 dark:bg-gold-brand/10" />

      {/* Navigation */}
      <Navbar />

      {/* Main Viewport */}
      {loading ? (
        /* Loader spinner on bootstrap */
        <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] z-10">
          <svg
            className="h-10 w-10 animate-spin text-gold-brand"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="mt-3 text-xs font-bold uppercase tracking-widest text-muted-txt">
            Connecting Secure Session...
          </span>
        </div>
      ) : (
        <main className="relative flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 z-10">
          {activeView === "store" && <ProductGrid />}
          {activeView === "dashboard" && <UserDashboard />}
          {activeView === "admin" && <AdminDashboard />}
        </main>
      )}

      {/* Footer */}
      <Footer />

      {/* Modals & Slide-overs Overlay Layer */}
      <ProductModal key={selectedProduct?.id ?? "none"} />
      <CartDrawer />
      <CheckoutFlow />
      <AuthModal />
      
      {/* Toast popup layer */}
      <Toasts />
    </div>
  );
}

export default function Storefront() {
  return (
    <StoreProvider>
      <StorefrontContent />
    </StoreProvider>
  );
}
