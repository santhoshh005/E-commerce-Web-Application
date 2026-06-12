"use client";

import React, { useEffect, useRef } from "react";
import { useStore } from "@/context/store-context";
import { formatMoney, getProductImage } from "@/lib/utils";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CartDrawer() {
  const {
    isCartOpen,
    setCartOpen,
    cartItems,
    updateCartItem,
    removeFromCart,
    subtotal,
    shippingFee,
    total,
    session,
    setAuthOpen,
    setAuthMode,
    setCheckoutOpen
  } = useStore();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Close cart drawer on escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCartOpen(false);
      }
    }
    if (isCartOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartOpen, setCartOpen]);

  if (!isCartOpen) return null;

  // Free shipping threshold calculations ($150 = 15000 cents)
  const FREE_SHIPPING_THRESHOLD = 15000;
  const rawSubtotal = subtotal;
  const isFreeShipping = rawSubtotal >= FREE_SHIPPING_THRESHOLD;
  const amountToFreeShipping = FREE_SHIPPING_THRESHOLD - rawSubtotal;
  const progressPercent = Math.min((rawSubtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);

  function handleCheckoutClick() {
    setCartOpen(false);
    if (!session) {
      setAuthMode("login");
      setAuthOpen(true);
    } else {
      setCheckoutOpen(true);
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer Panel */}
      <div 
        ref={drawerRef}
        className="absolute inset-y-0 right-0 flex max-w-full pl-10"
      >
        <div className="w-screen max-w-md transform border-l border-card-border bg-card shadow-2xl transition-all duration-300 animate-slide-in-right flex flex-col justify-between h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-brand px-6 py-5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-gold-brand" />
              <h2 className="text-lg font-bold text-foreground">Your Basket</h2>
              <span className="rounded-full bg-muted-bg px-2 py-0.5 text-xs font-semibold text-muted-txt">
                {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            </div>
            <button
              onClick={() => setCartOpen(false)}
              className="rounded-full p-1.5 text-muted-txt hover:bg-muted-bg hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Contents */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            
            {/* Free Shipping Tracker */}
            {cartItems.length > 0 && (
              <div className="rounded-2xl bg-muted-bg/30 p-4 border border-border-brand/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Truck className="h-4.5 w-4.5 text-gold-brand shrink-0" />
                  {isFreeShipping ? (
                    <span>Congratulations! You qualify for <span className="text-emerald-600">Free Shipping</span></span>
                  ) : (
                    <span>Add <span className="font-bold text-gold-brand">{formatMoney(amountToFreeShipping)}</span> more for Free Shipping</span>
                  )}
                </div>
                <div className="h-2 w-full rounded-full bg-border-brand overflow-hidden">
                  <div 
                    className="h-full bg-gold-brand transition-all duration-500 rounded-full" 
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            {cartItems.length === 0 ? (
              /* Empty Basket Layout */
              <div className="flex flex-col items-center justify-center text-center py-20">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted-bg text-muted-txt mb-4">
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-foreground">Your basket is empty</h3>
                <p className="mt-1.5 text-sm text-muted-txt max-w-[240px]">
                  Fill it with beautiful items from our storefront catalog.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-6"
                  onClick={() => setCartOpen(false)}
                >
                  Continue Shopping
                </Button>
              </div>
            ) : (
              /* Cart list items */
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex gap-4 rounded-2xl border border-card-border p-3 bg-card"
                  >
                    {/* Item Image */}
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted-bg border border-border-brand">
                      <img
                        src={getProductImage(item.product.name)}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Item details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-foreground line-clamp-1">
                            {item.product.name}
                          </h4>
                          <span className="text-[10px] uppercase font-bold text-muted-txt tracking-wider">
                            {item.product.category}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="text-muted-txt hover:text-error-brand transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Quantities and Line Price */}
                      <div className="flex items-center justify-between mt-2">
                        
                        {/* Selector */}
                        <div className="flex items-center rounded-xl border border-border-brand p-0.5 bg-muted-bg/30">
                          <button
                            onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                            className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-card text-muted-txt transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                            className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-card text-muted-txt transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Price */}
                        <span className="text-sm font-bold text-foreground">
                          {formatMoney(item.product.price * item.quantity)}
                        </span>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkout Block */}
          {cartItems.length > 0 && (
            <div className="border-t border-border-brand bg-muted-bg/10 p-6 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-txt">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-txt">
                  <span>Shipping</span>
                  <span className="font-semibold text-foreground">
                    {shippingFee === 0 ? "Free" : formatMoney(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-foreground border-t border-border-brand pt-2 mt-2">
                  <span>Total</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleCheckoutClick}
                  className="w-full text-sm font-bold"
                >
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                {!session && (
                  <p className="text-[10px] text-center text-muted-txt font-semibold uppercase tracking-wider">
                    Sign in is required to complete orders
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
