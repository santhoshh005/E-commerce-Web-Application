"use client";

import React, { useState } from "react";
import { useStore } from "@/context/store-context";
import { formatMoney, getProductImage } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Package, User, Mail, ShieldCheck } from "lucide-react";

export function UserDashboard() {
  const { session, orders } = useStore();
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 px-4 rounded-[2rem] border border-dashed border-border-brand bg-card">
        <User className="h-12 w-12 text-muted-txt mb-4" />
        <h3 className="text-lg font-bold text-foreground">Sign in required</h3>
        <p className="mt-1 text-sm text-muted-txt max-w-xs">
          Please sign in to access your order history, profile details, and fulfillment tracking.
        </p>
      </div>
    );
  }

  function toggleExpandOrder(id: string) {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  }

  // Define steps for visual timeline
  const statusSteps = [
    { label: "Ordered", status: "PENDING" },
    { label: "Payment Paid", status: "PAID" },
    { label: "Packing", status: "PACKING" },
    { label: "In Transit", status: "SHIPPED" },
    { label: "Delivered", status: "DELIVERED" },
  ];

  function getStepIndex(status: string) {
    if (status === "CANCELLED") return -1;
    return statusSteps.findIndex((step) => step.status === status);
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      
      {/* Account Profile header card */}
      <section className="rounded-[2.5rem] border border-card-border bg-card p-6 shadow-sm md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4.5">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary-brand text-2xl font-bold text-primary-brand-foreground shadow-md">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">{session.name}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 mt-1 text-sm text-muted-txt">
              <span className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 shrink-0" />
                {session.email}
              </span>
              <span className="hidden sm:inline text-border-brand">&#8226;</span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                Role: {session.role}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border-brand px-4 py-3 text-xs bg-muted-bg/30 md:max-w-xs leading-normal text-muted-txt">
          Welcome to your Santhosh Dashboard! Below you can track fulfillment timelines and access order history details.
        </div>
      </section>

      {/* Orders List Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5 text-gold-brand" />
          Order History
          <span className="text-xs font-semibold text-muted-txt">
            ({orders.length} orders placed)
          </span>
        </h3>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-[2rem] border border-dashed border-border-brand bg-card/45">
            <Package className="h-10 w-10 text-muted-txt mb-3 animate-pulse" />
            <h4 className="text-base font-bold text-foreground">No orders placed yet</h4>
            <p className="mt-1 text-sm text-muted-txt max-w-xs">
              Place your first order by browsing our catalogs and checking out.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const stepIndex = getStepIndex(order.status);
              const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={order.id}
                  className="overflow-hidden rounded-[2rem] border border-card-border bg-card shadow-sm transition-all duration-300"
                >
                  {/* Collapsed Header */}
                  <div
                    onClick={() => toggleExpandOrder(order.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:p-6 cursor-pointer select-none hover:bg-muted-bg/10 transition-colors"
                  >
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-4 sm:gap-8">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-txt block">
                          Order ID
                        </span>
                        <span className="font-bold text-foreground text-sm uppercase">
                          #{order.id.slice(0, 8)}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-txt block">
                          Date Placed
                        </span>
                        <span className="font-semibold text-foreground text-sm">
                          {orderDate}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-txt block">
                          Total Charging
                        </span>
                        <span className="font-bold text-foreground text-sm">
                          {formatMoney(order.total)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <Badge variant="status" statusType={order.status}>
                        {order.status}
                      </Badge>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-txt transition-transform duration-300 ${
                          isExpanded ? "rotate-180 text-foreground" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Accordion Panel */}
                  {isExpanded && (
                    <div className="border-t border-border-brand bg-muted-bg/5 p-5 md:p-6 space-y-6 animate-fade-in-up">
                      
                      {/* 1. Progress Timeline Indicator */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-txt">
                          Fulfillment Tracking
                        </h4>

                        {order.status === "CANCELLED" ? (
                          <div className="rounded-2xl border border-red-500/10 bg-red-500/5 p-4 text-sm font-semibold text-error-brand">
                            This order was cancelled. Please contact customer support for further information.
                          </div>
                        ) : (
                          <div className="relative pt-2 pb-6 px-2">
                            {/* Horizontal Line connector */}
                            <div className="absolute top-5 left-8 right-8 h-1 bg-border-brand -z-10 dark:bg-muted" />
                            
                            {/* Line Filled up to current step */}
                            <div 
                              className="absolute top-5 left-8 h-1 bg-gold-brand -z-10 transition-all duration-700" 
                              style={{ 
                                width: stepIndex <= 0 ? "0%" : `${(stepIndex / (statusSteps.length - 1)) * 100}%` 
                              }}
                            />

                            {/* Timeline checkpoints */}
                            <div className="flex justify-between">
                              {statusSteps.map((step, idx) => {
                                const isActive = idx <= stepIndex;
                                const isCurrent = idx === stepIndex;

                                return (
                                  <div key={idx} className="flex flex-col items-center gap-2">
                                    <div
                                      className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-500 ${
                                        isActive
                                          ? "bg-gold-brand border-gold-brand text-white scale-110 shadow-md"
                                          : "bg-card border-border-brand text-muted-txt"
                                      } ${isCurrent ? "ring-4 ring-gold-brand/20 dark:ring-gold-brand/10" : ""}`}
                                    >
                                      {idx + 1}
                                    </div>
                                    <span
                                      className={`text-[10px] font-bold tracking-wide text-center uppercase ${
                                        isActive ? "text-foreground font-extrabold" : "text-muted-txt"
                                      }`}
                                    >
                                      {step.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. Order Items Listing */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-txt">
                          Purchased Items
                        </h4>

                        <div className="space-y-3">
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-4 rounded-2xl border border-card-border bg-card p-3 shadow-sm"
                            >
                              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-muted-bg border border-border-brand">
                                <img
                                  src={getProductImage(item.product.name)}
                                  alt={item.product.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>

                              <div className="flex-1 flex items-center justify-between gap-4 text-sm">
                                <div>
                                  <p className="font-bold text-foreground truncate max-w-[180px] sm:max-w-xs">
                                    {item.product.name}
                                  </p>
                                  <p className="text-xs text-muted-txt">
                                    Quantity: {item.quantity} · {formatMoney(item.unitPrice)} each
                                  </p>
                                </div>
                                <span className="font-bold text-foreground">
                                  {formatMoney(item.lineTotal)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 3. Shipping Invoice details summary */}
                      <div className="rounded-2xl border border-border-brand bg-card p-4 space-y-2 text-xs text-muted-txt">
                        <div className="flex justify-between">
                          <span>Items Subtotal:</span>
                          <span className="font-semibold text-foreground">{formatMoney(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping Fee:</span>
                          <span className="font-semibold text-foreground">
                            {order.shippingFee === 0 ? "Free Shipping" : formatMoney(order.shippingFee)}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-border-brand pt-2 mt-2 font-bold text-foreground">
                          <span className="text-sm">Grand Total Charged:</span>
                          <span className="text-sm text-gold-brand">{formatMoney(order.total)}</span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
