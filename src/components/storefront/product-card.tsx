"use client";

import React from "react";
import { Product, useStore } from "@/context/store-context";
import { formatMoney, getProductImage } from "@/lib/utils";
import { Star, Plus, Eye, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, setSelectedProduct, cart } = useStore();

  const isOutOfStock = product.inventory === 0;
  
  // Find quantity already in cart
  const cartItem = cart.find((item) => item.productId === product.id);
  const cartQuantity = cartItem ? cartItem.quantity : 0;
  const isLimitReached = product.inventory <= cartQuantity;

  // Render rating stars
  const renderStars = (rating: number) => {
    const stars = [];
    const floor = Math.floor(rating);
    const hasHalf = rating % 1 !== 0;

    for (let index = 1; index <= 5; index++) {
      if (index <= floor) {
        stars.push(
          <Star key={index} className="h-3.5 w-3.5 fill-gold-brand text-gold-brand shrink-0" />
        );
      } else if (index === floor + 1 && hasHalf) {
        stars.push(
          <div key={index} className="relative inline-block text-gold-brand shrink-0">
            <Star className="h-3.5 w-3.5 text-border-brand" />
            <div className="absolute top-0 left-0 w-1/2 overflow-hidden">
              <Star className="h-3.5 w-3.5 fill-gold-brand text-gold-brand" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={index} className="h-3.5 w-3.5 text-border-brand shrink-0" />
        );
      }
    }
    return stars;
  };

  return (
    <article className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-card-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl">
      
      {/* Image container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted-bg">
        <img
          src={getProductImage(product.name)}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Hover overlay actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-primary-brand/10 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
          <button
            onClick={() => setSelectedProduct(product)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary-brand shadow-lg transition-transform hover:scale-110 active:scale-95 dark:bg-card dark:text-foreground"
            title="Quick View"
          >
            <Eye className="h-5 w-5" />
          </button>
          
          <button
            disabled={isOutOfStock || isLimitReached}
            onClick={() => addToCart(product.id)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-brand text-white shadow-lg transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none hover:bg-gold-brand-hover"
            title="Add to Cart"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.featured && (
            <Badge variant="gold">
              Spotlight
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="danger">
              Sold Out
            </Badge>
          )}
          {!isOutOfStock && product.inventory < 5 && (
            <Badge variant="warning">
              Low Stock ({product.inventory})
            </Badge>
          )}
        </div>
      </div>

      {/* Info details */}
      <div className="flex-1 mt-4 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-txt">
              {product.category}
            </span>
            <div className="flex items-center gap-1">
              <div className="flex">{renderStars(product.rating)}</div>
              <span className="text-[10px] font-bold text-muted-txt">
                ({product.rating.toFixed(1)})
              </span>
            </div>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => setSelectedProduct(product)}
            className="mt-2 text-lg font-bold text-foreground hover:text-gold-brand cursor-pointer transition-colors line-clamp-1"
          >
            {product.name}
          </h3>

          {/* Product Description */}
          <p className="mt-1 text-xs text-muted-txt line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Footer with Price and Add Button */}
        <div className="mt-5 flex items-center justify-between border-t border-border-brand pt-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-txt block">
              Price
            </span>
            <span className="text-xl font-bold text-foreground">
              {formatMoney(product.price)}
            </span>
          </div>

          <button
            type="button"
            disabled={isOutOfStock || isLimitReached}
            onClick={() => addToCart(product.id)}
            className="flex items-center gap-1.5 rounded-xl bg-primary-brand px-3.5 py-2 text-xs font-semibold text-primary-brand-foreground transition-all hover:bg-primary-brand-hover active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {isOutOfStock ? "Sold Out" : isLimitReached ? "In Cart" : "Add to Cart"}
          </button>
        </div>
      </div>

    </article>
  );
}
