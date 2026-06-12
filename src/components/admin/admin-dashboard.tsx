"use client";

import React, { useState, useMemo } from "react";
import { useStore, Product } from "@/context/store-context";
import { formatMoney } from "@/lib/utils";
import { ShieldAlert, BarChart3, PackagePlus, ClipboardList, Plus, X, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function AdminDashboard() {
  const {
    session,
    products,
    orders,
    refreshProducts,
    refreshOrders,
    addToast
  } = useStore();

  const [activeTab, setActiveTab] = useState<"analytics" | "inventory" | "fulfillment">("analytics");
  const [isProductFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState(""); // String for input
  const [inventory, setInventory] = useState(""); // String for input
  const [featured, setFeatured] = useState(false);
  const [rating, setRating] = useState("4.5");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- ANALYTICS CALCULATIONS ---
  const stats = useMemo(() => {
    // Exclude CANCELLED orders from revenue totals
    const activeOrders = orders.filter((o) => o.status !== "CANCELLED");
    const totalSales = activeOrders.reduce((sum, o) => sum + o.total, 0);
    const orderCount = orders.length;
    const activeProductCount = products.length;
    const lowStockAlerts = products.filter((p) => p.inventory < 5).length;

    // Status breakdown counts
    const statusCounts: Record<string, number> = {
      PENDING: 0,
      PAID: 0,
      PACKING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    orders.forEach((o) => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      }
    });

    return {
      totalSales,
      orderCount,
      activeProductCount,
      lowStockAlerts,
      statusCounts,
    };
  }, [orders, products]);

  // If not admin, block dashboard
  if (!session || session.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4 rounded-[2rem] border border-dashed border-red-500/20 bg-red-500/5 max-w-lg mx-auto">
        <ShieldAlert className="h-12 w-12 text-error-brand mb-4 animate-bounce" />
        <h3 className="text-lg font-bold text-foreground">Access Denied</h3>
        <p className="mt-1.5 text-sm text-muted-txt">
          You do not have administrative privileges to access the admin portal controls. Please sign in with an administrator account.
        </p>
      </div>
    );
  }

  // Pre-fill form when editing
  function openEditProduct(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setCategory(product.category);
    setPrice((product.price / 100).toString());
    setInventory(product.inventory.toString());
    setFeatured(product.featured);
    setRating(product.rating.toString());
    setProductFormOpen(true);
  }

  function openCreateProduct() {
    setEditingProduct(null);
    setName("");
    setDescription("");
    setCategory("");
    setPrice("");
    setInventory("");
    setFeatured(false);
    setRating("4.5");
    setProductFormOpen(true);
  }

  // Submit Product Form (Create / Edit)
  async function handleProductSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !category.trim() || !price || !inventory) {
      addToast("Please fill in all product fields", "error");
      return;
    }

    setIsSubmitting(true);
    
    const parsedPrice = Math.round(parseFloat(price) * 100);
    const parsedInventory = parseInt(inventory, 10);
    const parsedRating = parseFloat(rating);

    const payload = {
      name,
      description,
      category,
      price: parsedPrice,
      inventory: parsedInventory,
      featured,
      rating: parsedRating,
    };

    try {
      const route = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
      const method = editingProduct ? "PATCH" : "POST";

      const response = await fetch(route, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save product");
      }

      addToast(
        editingProduct ? `Product "${name}" updated!` : `Product "${name}" created successfully!`,
        "success"
      );

      setProductFormOpen(false);
      await refreshProducts();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Error saving product", "error");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Delete Product handler
  async function handleProductDelete(productId: string, productName: string) {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      const response = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to delete product");
      }

      addToast(`Product "${productName}" deleted.`, "info");
      await refreshProducts();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to delete product", "error");
    }
  }

  // Toggle Featured/Spotlight status
  async function handleToggleFeatured(product: Product) {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !product.featured }),
      });

      if (!response.ok) throw new Error("Spotlight toggle failed");
      
      addToast(`Spotlight for "${product.name}" updated.`, "success");
      await refreshProducts();
    } catch {
      addToast("Failed to update spotlight status", "error");
    }
  }

  // Update Order Fulfillment Status
  async function handleUpdateOrderStatus(orderId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update order status");
      }

      addToast(`Order #${orderId.slice(0, 8).toUpperCase()} updated to ${newStatus}.`, "success");
      await refreshOrders();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Fulfillment update failed", "error");
    }
  }



  // Monthly revenue mock data combined with real totals for demo
  const salesChartData = [
    { month: "Jan", sales: 24000 },
    { month: "Feb", sales: 38000 },
    { month: "Mar", sales: 32000 },
    { month: "Apr", sales: 51000 },
    { month: "May", sales: 48000 },
    { month: "Jun", sales: stats.totalSales > 0 ? stats.totalSales : 12000 }, // Current month real/mocked
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      
      {/* Layout Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-brand pb-5">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-gold-brand" />
            Administrator Suite
          </h2>
          <p className="text-xs text-muted-txt mt-0.5">Manage stock, track client checkouts, and view statistics.</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-muted-bg/30 border border-border-brand p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "analytics"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-txt hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
          
          <button
            onClick={() => setActiveTab("inventory")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "inventory"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-txt hover:text-foreground"
            }`}
          >
            <PackagePlus className="h-4 w-4" />
            Catalog CRUD
          </button>
          
          <button
            onClick={() => setActiveTab("fulfillment")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === "fulfillment"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-txt hover:text-foreground"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            Fulfillment ({orders.filter((o) => o.status !== "DELIVERED" && o.status !== "CANCELLED").length})
          </button>
        </div>
      </div>

      {/* --- 1. TAB PANEL: ANALYTICS --- */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-fade-in-up">
          
          {/* Dashboard Metrics grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-card-border bg-card p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-txt">Total Revenue</span>
              <p className="mt-1.5 text-2xl font-bold text-foreground">{formatMoney(stats.totalSales)}</p>
              <div className="mt-2 text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> +14.2% from last month
              </div>
            </div>

            <div className="rounded-3xl border border-card-border bg-card p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-txt">Incoming Orders</span>
              <p className="mt-1.5 text-2xl font-bold text-foreground">{stats.orderCount}</p>
              <span className="mt-2 text-[10px] text-muted-txt block font-semibold">PostgreSQL-seeded data count</span>
            </div>

            <div className="rounded-3xl border border-card-border bg-card p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-txt">Catalog Count</span>
              <p className="mt-1.5 text-2xl font-bold text-foreground">{stats.activeProductCount}</p>
              <span className="mt-2 text-[10px] text-muted-txt block font-semibold">Active items in stock grid</span>
            </div>

            <div className="rounded-3xl border border-card-border bg-card p-5 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-txt">Low Stock Alerts</span>
              <p className="mt-1.5 text-2xl font-bold text-error-brand">{stats.lowStockAlerts}</p>
              <span className="mt-2 text-[10px] text-muted-txt block font-semibold">Products with inventory &lt; 5</span>
            </div>
          </div>

          {/* Premium Charts grid */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* SVG Revenue Line Area Chart */}
            <div className="rounded-[2rem] border border-card-border bg-card p-6 shadow-sm">
              <h4 className="font-bold text-foreground text-sm tracking-wide mb-4">Monthly Revenue Trends</h4>
              <div className="relative h-60 w-full">
                {/* SVG Area chart */}
                <svg className="h-full w-full" viewBox="0 0 500 220" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="40" y1="20" x2="480" y2="20" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                  <line x1="40" y1="70" x2="480" y2="70" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                  <line x1="40" y1="120" x2="480" y2="120" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                  <line x1="40" y1="170" x2="480" y2="170" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                  
                  {/* Area Fill */}
                  <path
                    d={`M 40,170 L 112,140 L 184,120 L 256,90 L 328,100 L 400,60 L 400,170 Z`}
                    fill="url(#grad-forest)"
                    className="opacity-20"
                  />
                  
                  {/* Line */}
                  <path
                    d={`M 40,170 L 112,140 L 184,120 L 256,90 L 328,100 L 400,60`}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Dots */}
                  <circle cx="40" cy="170" r="4.5" className="fill-gold-brand text-card border" />
                  <circle cx="112" cy="140" r="4.5" className="fill-gold-brand text-card border" />
                  <circle cx="184" cy="120" r="4.5" className="fill-gold-brand text-card border" />
                  <circle cx="256" cy="90" r="4.5" className="fill-gold-brand text-card border" />
                  <circle cx="328" cy="100" r="4.5" className="fill-gold-brand text-card border" />
                  <circle cx="400" cy="60" r="4.5" className="fill-gold-brand text-card border" />

                  {/* Gradients */}
                  <defs>
                    <linearGradient id="grad-forest" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--primary)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Months labels */}
                <div className="flex justify-between pl-8 pr-16 text-[10px] text-muted-txt font-bold uppercase tracking-wider mt-2">
                  {salesChartData.map((d) => (
                    <span key={d.month}>{d.month}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* SVG Order Status Breakdown grouped bars */}
            <div className="rounded-[2rem] border border-card-border bg-card p-6 shadow-sm">
              <h4 className="font-bold text-foreground text-sm tracking-wide mb-4">Order Fulfillment Breakdown</h4>
              <div className="space-y-4">
                {Object.entries(stats.statusCounts).map(([status, count]) => {
                  const maxCount = Math.max(...Object.values(stats.statusCounts), 1);
                  const percent = (count / maxCount) * 100;
                  
                  const colors: Record<string, string> = {
                    PENDING: "bg-yellow-500",
                    PAID: "bg-blue-500",
                    PACKING: "bg-purple-500",
                    SHIPPED: "bg-indigo-500",
                    DELIVERED: "bg-emerald-500",
                    CANCELLED: "bg-red-500",
                  };

                  return (
                    <div key={status} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-[10px] tracking-wider text-muted-txt">{status}</span>
                        <span className="text-foreground">{count} orders</span>
                      </div>
                      <div className="h-2.5 w-full bg-border-brand/40 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${colors[status] || "bg-slate-500"} rounded-full transition-all duration-700`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- 2. TAB PANEL: PRODUCT CRUD --- */}
      {activeTab === "inventory" && (
        <div className="space-y-4 animate-fade-in-up">
          
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-foreground text-sm">Product Catalog Registry</h4>
            <Button onClick={openCreateProduct} size="sm" className="rounded-xl">
              <Plus className="mr-1.5 h-4 w-4" /> Add Product
            </Button>
          </div>

          {/* Product Items Table Layout */}
          <div className="overflow-x-auto rounded-[2rem] border border-card-border bg-card">
            <table className="min-w-full text-left border-collapse text-sm">
              <thead className="bg-muted-bg/50 border-b border-border-brand text-xs font-bold text-muted-txt uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Product Info</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Spotlight</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-brand">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-muted-bg/10 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-foreground">{prod.name}</p>
                        <p className="text-xs text-muted-txt line-clamp-1 max-w-[240px]">{prod.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{prod.category}</Badge>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {formatMoney(prod.price)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${prod.inventory < 5 ? "text-error-brand" : "text-foreground"}`}>
                        {prod.inventory}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleFeatured(prod)}
                        className={`rounded-full px-2.5 py-0.5 text-2xs font-bold uppercase transition-all ${
                          prod.featured 
                            ? "bg-gold-brand-light text-gold-brand border border-gold-brand/20" 
                            : "bg-muted-bg text-muted-txt border border-border-brand"
                        }`}
                      >
                        {prod.featured ? "Spotlit" : "Plain"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 shrink-0">
                      <button
                        onClick={() => openEditProduct(prod)}
                        className="text-gold-brand hover:text-gold-brand-hover text-xs font-semibold p-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleProductDelete(prod.id, prod.name)}
                        className="text-error-brand hover:text-red-700 text-xs font-semibold p-1"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* --- 3. TAB PANEL: FULFILLMENT --- */}
      {activeTab === "fulfillment" && (
        <div className="space-y-4 animate-fade-in-up">
          <h4 className="font-bold text-foreground text-sm">Customer Order Pipeline</h4>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-muted-txt bg-card rounded-[2rem] border border-dashed border-border-brand">
              No orders placed on the system.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[2rem] border border-card-border bg-card">
              <table className="min-w-full text-left border-collapse text-sm">
                <thead className="bg-muted-bg/50 border-b border-border-brand text-xs font-bold text-muted-txt uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Order Ref</th>
                    <th className="px-6 py-4">Customer Email</th>
                    <th className="px-6 py-4">Total Charge</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Advance Pipeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-brand">
                  {orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-muted-bg/10 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-foreground uppercase">#{ord.id.slice(0, 8)}</span>
                        <span className="block text-[10px] text-muted-txt">{new Date(ord.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground truncate max-w-[150px]">{ord.user?.email ?? "Guest User"}</p>
                        <p className="text-[10px] text-muted-txt truncate max-w-[150px]">{ord.user?.name}</p>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        {formatMoney(ord.total)}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="status" statusType={ord.status}>
                          {ord.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                          className="rounded-xl border border-border-brand bg-card px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-primary-brand cursor-pointer"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PAID">PAID</option>
                          <option value="PACKING">PACKING</option>
                          <option value="SHIPPED">SHIPPED</option>
                          <option value="DELIVERED">DELIVERED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* --- FORM OVERLAY DRAWERS: CREATE / EDIT PRODUCT --- */}
      {isProductFormOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setProductFormOpen(false)} />
          
          <div className="relative w-full max-w-lg rounded-[2rem] border border-card-border bg-card p-6 shadow-2xl animate-scale-up z-10 md:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setProductFormOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1.5 text-muted-txt hover:bg-muted-bg hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-xl font-bold text-foreground mb-6">
              {editingProduct ? `Edit "${editingProduct.name}"` : "Create Catalog Entry"}
            </h3>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <Input
                label="Product Name"
                placeholder="Aurora Sneaker"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Category"
                placeholder="Footwear"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Price (USD)"
                  placeholder="99.99"
                  type="number"
                  step="0.01"
                  min="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />

                <Input
                  label="Inventory Count"
                  placeholder="20"
                  type="number"
                  min="0"
                  value={inventory}
                  onChange={(e) => setInventory(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Average Rating"
                  placeholder="4.5"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  required
                />

                <div className="flex flex-col justify-end pb-1.5">
                  <label className="flex items-center gap-2 rounded-2xl border border-border-brand bg-muted-bg/30 px-4 py-3 text-xs font-semibold text-muted-txt select-none cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="h-4 w-4 rounded border-border-brand text-gold-brand focus:ring-gold-brand"
                    />
                    Feature Spotlight
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-txt">
                  Product Description
                </label>
                <textarea
                  placeholder="Provide a comprehensive product description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="input-field text-sm"
                  required
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setProductFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                  Save Product
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
