"use client";

import React, { useState } from "react";
import { useStore } from "@/context/store-context";
import { formatMoney, getProductImage } from "@/lib/utils";
import { X, Star, ShoppingBag, Plus, Minus, ShieldCheck, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function ProductModal() {
  const { selectedProduct, setSelectedProduct, addToCart, cart, updateCartItem, addToast } = useStore();
  const [quantity, setQuantity] = useState(1);

  if (!selectedProduct) return null;

  const cartItem = cart.find((item) => item.productId === selectedProduct.id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;
  const availableInventory = selectedProduct.inventory - cartQuantity;
  const isOutOfStock = selectedProduct.inventory === 0;

  const handleIncrement = () => {
    if (quantity >= availableInventory) {
      addToast(`Only ${selectedProduct.inventory} units in total stock (already have ${cartQuantity} in cart)`, "error");
      return;
    }
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    if (quantity > availableInventory) {
      addToast("Requested quantity exceeds available stock", "error");
      return;
    }

    if (cartItem) {
      updateCartItem(selectedProduct.id, cartQuantity + quantity);
    } else {
      // Add first time, then update if quantity > 1
      addToCart(selectedProduct.id);
      if (quantity > 1) {
        updateCartItem(selectedProduct.id, quantity);
      }
    }
    
    addToast(`Added ${quantity} of "${selectedProduct.name}" to cart`, "success");
    setSelectedProduct(null);
  };

  // Mock Reviews
  const mockReviews = [
    {
      id: 1,
      author: "Sarah M.",
      rating: 5,
      date: "2 weeks ago",
      text: `Absolutely outstanding quality. Exceeded my expectations, and the shipping was prompt. Definitely buying again!`,
    },
    {
      id: 2,
      author: "David K.",
      rating: 4.5,
      date: "1 month ago",
      text: `Very durable construction and elegant look. Matches the website pictures exactly. Recommended.`,
    },
  ];

  const renderStars = (rating: number) => {
    const stars = [];
    for (let index = 1; index <= 5; index++) {
      stars.push(
        <Star
          key={index}
          className={`h-4 w-4 shrink-0 ${
            index <= Math.floor(rating) ? "fill-gold-brand text-gold-brand" : "text-border-brand"
          }`}
        />
      );
    }
    return stars;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={() => setSelectedProduct(null)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-card-border bg-card p-6 shadow-2xl animate-scale-up z-10 md:p-8">
        
        {/* Close Button */}
        <button
          onClick={() => setSelectedProduct(null)}
          className="absolute right-5 top-5 rounded-full p-2 text-muted-txt hover:bg-muted-bg hover:text-foreground transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Responsive Grid */}
        <div className="grid gap-6 md:grid-cols-2 mt-4">
          
          {/* Product Image Cover */}
          <div className="relative aspect-[4/3] md:aspect-square overflow-hidden rounded-2xl bg-muted-bg border border-border-brand">
            <img
              src={getProductImage(selectedProduct.name)}
              alt={selectedProduct.name}
              className="h-full w-full object-cover"
            />
            {selectedProduct.featured && (
              <Badge variant="gold" className="absolute left-4 top-4">
                Featured Product
              </Badge>
            )}
          </div>

          {/* Product details */}
          <div className="flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Category & Title */}
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-txt block">
                  {selectedProduct.category}
                </span>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  {selectedProduct.name}
                </h2>
              </div>

              {/* Rating and Price */}
              <div className="flex items-center gap-3">
                <div className="flex">{renderStars(selectedProduct.rating)}</div>
                <span className="text-sm font-semibold text-foreground">
                  {selectedProduct.rating.toFixed(1)} Rating
                </span>
              </div>

              <div className="text-3xl font-extrabold text-foreground">
                {formatMoney(selectedProduct.price)}
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed text-muted-txt">
                {selectedProduct.description}
              </p>

              {/* Logistics Badges */}
              <div className="grid grid-cols-2 gap-3 py-2">
                <div className="flex items-center gap-2 text-xs text-muted-txt">
                  <Truck className="h-4.5 w-4.5 text-gold-brand" />
                  <span>Free shipping over $150</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-txt">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                  <span>100% Secure Checkout</span>
                </div>
              </div>

            </div>

            {/* Cart Interactive Flow */}
            <div className="mt-6 space-y-4 border-t border-border-brand pt-4">
              
              {/* Stock Indicator */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">Availability</span>
                {isOutOfStock ? (
                  <span className="font-bold text-error-brand">Sold Out</span>
                ) : availableInventory === 0 ? (
                  <span className="font-semibold text-muted-txt">All available stock in cart</span>
                ) : (
                  <span className="font-semibold text-emerald-600">
                    In Stock ({selectedProduct.inventory} available)
                  </span>
                )}
              </div>

              {/* Add actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                
                {/* Quantity Adjuster */}
                {!isOutOfStock && availableInventory > 0 && (
                  <div className="flex items-center justify-between rounded-2xl border border-border-brand p-1.5 shrink-0 bg-muted-bg/30">
                    <button
                      onClick={handleDecrement}
                      disabled={quantity <= 1}
                      className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-card hover:text-foreground text-muted-txt transition-colors disabled:opacity-30"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-bold text-foreground">
                      {quantity}
                    </span>
                    <button
                      onClick={handleIncrement}
                      disabled={quantity >= availableInventory}
                      className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-card hover:text-foreground text-muted-txt transition-colors disabled:opacity-30"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Add to cart */}
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || availableInventory === 0}
                  className="w-full"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {isOutOfStock ? "Out of Stock" : availableInventory === 0 ? "Already in Cart" : "Add to Cart"}
                </Button>

              </div>
            </div>

          </div>
        </div>

        {/* Review Section */}
        <div className="mt-8 border-t border-border-brand pt-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Customer Reviews</h3>
          <div className="space-y-4">
            {mockReviews.map((rev) => (
              <div key={rev.id} className="rounded-2xl border border-card-border bg-muted-bg/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{rev.author}</span>
                  <span className="text-xs text-muted-txt">{rev.date}</span>
                </div>
                <div className="flex mt-1">{renderStars(rev.rating)}</div>
                <p className="mt-2 text-sm text-muted-txt italic">&quot;{rev.text}&quot;</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
