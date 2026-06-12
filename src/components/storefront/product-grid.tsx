"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/context/store-context";
import { ProductCard } from "./product-card";
import { SlidersHorizontal, SearchX } from "lucide-react";

export function ProductGrid() {
  const { products, loading, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory } = useStore();
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");

  // Get dynamic categories list
  const categories = useMemo(() => {
    const list = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(list)];
  }, [products]);

  // Filter and Sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by Category
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filter by Search Query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // Sort products
    result.sort((a, b) => {
      if (sortBy === "featured") {
        // Featured first, then newest
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return b.id.localeCompare(a.id);
      }
      if (sortBy === "price-asc") {
        return a.price - b.price;
      }
      if (sortBy === "price-desc") {
        return b.price - a.price;
      }
      if (sortBy === "rating") {
        return b.rating - a.rating;
      }
      return 0;
    });

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      
      {/* Category Selection Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border-brand pb-5">
        
        {/* Categories Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold tracking-wide border transition-all shrink-0 cursor-pointer ${
                selectedCategory === category
                  ? "bg-primary-brand border-primary-brand text-primary-brand-foreground shadow-sm scale-95"
                  : "bg-card border-border-brand text-muted-txt hover:text-foreground hover:border-muted-txt"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Catalog Control Actions */}
        <div className="flex items-center gap-3">
          
          <SlidersHorizontal className="h-4.5 w-4.5 text-muted-txt" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-2xl border border-border-brand bg-card px-3.5 py-2 text-sm font-semibold text-foreground outline-none focus:border-primary-brand cursor-pointer"
          >
            <option value="featured">Featured First</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          
        </div>

      </div>

      {/* Main Grid View */}
      {loading ? (
        // Loading Skeletons
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[380px] rounded-[2rem] border border-card-border bg-card/40 p-4 animate-pulse space-y-4"
            >
              <div className="aspect-[4/3] w-full rounded-2xl bg-muted-bg" />
              <div className="h-5 w-1/3 rounded-md bg-muted-bg" />
              <div className="h-7 w-3/4 rounded-md bg-muted-bg" />
              <div className="h-10 rounded-md bg-muted-bg" />
            </div>
          ))}
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
        // Empty State
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-[2rem] border border-dashed border-border-brand bg-card/30">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted-bg text-muted-txt mb-4">
            <SearchX className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No products found</h3>
          <p className="mt-1 text-sm text-muted-txt max-w-sm">
            We couldn&apos;t find any products matching your active criteria. Try broadening your query or selecting another category.
          </p>
          {(searchQuery || selectedCategory !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="mt-4 text-sm font-semibold text-gold-brand hover:underline"
            >
              Clear filters and search
            </button>
          )}
        </div>
      ) : (
        // Cards Grid
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

    </div>
  );
}
