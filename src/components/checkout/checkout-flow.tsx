"use client";

import React, { useState } from "react";
import { useStore, Order } from "@/context/store-context";
import { formatMoney, getProductImage } from "@/lib/utils";
import { X, CreditCard, MapPin, CheckCircle2, Lock, ArrowLeft, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import confetti from "canvas-confetti";

export function CheckoutFlow() {
  const {
    isCheckoutOpen,
    setCheckoutOpen,
    cartItems,
    subtotal,
    shippingFee,
    total,
    clearCart,
    refreshOrders,
    refreshProducts,
    addToast
  } = useStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Shipping, 2: Payment, 3: Processing, 4: Success
  
  // Shipping Form States
  const [shippingName, setShippingName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");
  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});

  // Payment Form States
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  // Placed Order States
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  if (!isCheckoutOpen) return null;

  // Mask and format card number
  function handleCardNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    setCardNumber(formatted);
  }

  // Mask and format expiry
  function handleExpiryChange(e: React.ChangeEvent<HTMLInputElement>) {
    let value = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    setCardExpiry(value);
  }

  // Handle Card Type recognition
  function getCardType(number: string) {
    const cleanNumber = number.replace(/\s/g, "");
    if (cleanNumber.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(cleanNumber)) return "Mastercard";
    if (/^3[47]/.test(cleanNumber)) return "Amex";
    return "Unknown";
  }

  const cardType = getCardType(cardNumber);

  // Validate Shipping Details
  function validateShipping() {
    const errors: Record<string, string> = {};
    if (!shippingName.trim()) errors.name = "Full name is required";
    if (!address.trim()) errors.address = "Street address is required";
    if (!city.trim()) errors.city = "City is required";
    if (!stateCode.trim()) errors.state = "State is required";
    if (!zip.trim() || zip.length < 5) errors.zip = "Valid Zip Code is required";
    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Validate Payment Details
  function validatePayment() {
    const errors: Record<string, string> = {};
    if (!cardName.trim()) errors.cardName = "Cardholder name is required";
    if (cardNumber.replace(/\s/g, "").length !== 16) errors.cardNumber = "Valid 16-digit card number is required";
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) errors.cardExpiry = "Expiry date must be MM/YY";
    if (cardCvv.length < 3) errors.cardCvv = "CVV code is required";
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Proceed to Payment Step
  function handleShippingSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (validateShipping()) {
      setStep(2);
    }
  }

  // Submit Order and Process Payment Transaction
  async function handlePaymentSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validatePayment()) return;

    setStep(3);

    // Simulate payment process delay (2 seconds)
    setTimeout(async () => {
      try {
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Transaction failed");
        }

        setCreatedOrder(data.order);
        clearCart();
        await Promise.all([refreshOrders(), refreshProducts()]);
        
        // Success celebration confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        
        addToast("Order placed successfully!", "success");
        setStep(4);
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Payment processing failed", "error");
        setStep(2); // Go back to payment page to retry
      }
    }, 2000);
  }

  function handleClose() {
    setCheckoutOpen(false);
    setStep(1);
    setCreatedOrder(null);
    setShippingName("");
    setAddress("");
    setCity("");
    setStateCode("");
    setZip("");
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      {/* Checkout Box */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2rem] border border-card-border bg-card shadow-2xl animate-scale-up z-10">
        
        {/* Header (Hide in step 3/4) */}
        {step < 3 && (
          <div className="flex items-center justify-between border-b border-border-brand px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">Secure Checkout</h2>
              <p className="text-xs text-muted-txt">Complete your order with end-to-end security encryption.</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-1.5 text-muted-txt hover:bg-muted-bg hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-[1.2fr_0.8fr] h-full max-h-[85vh] overflow-y-auto">
          
          {/* Main Form Area */}
          <div className="p-6 md:p-8 flex flex-col justify-between">
            {step === 1 && (
              /* Step 1: Shipping Details Form */
              <form onSubmit={handleShippingSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-gold-brand" />
                  <h3 className="font-bold text-foreground">1. Shipping Details</h3>
                </div>

                <Input
                  label="Recipient Full Name"
                  placeholder="John Doe"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  error={shippingErrors.name}
                  required
                />

                <Input
                  label="Street Address"
                  placeholder="123 Luxury Avenue, Apt 4B"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  error={shippingErrors.address}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    placeholder="New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    error={shippingErrors.city}
                    required
                  />
                  <Input
                    label="State / Province"
                    placeholder="NY"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    error={shippingErrors.state}
                    required
                  />
                </div>

                <Input
                  label="Zip / Postal Code"
                  placeholder="10001"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  error={shippingErrors.zip}
                  required
                />

                <div className="pt-4 flex justify-end">
                  <Button type="submit">
                    Continue to Payment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              /* Step 2: Payment Details Form */
              <form onSubmit={handlePaymentSubmit} className="space-y-4 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-5 w-5 text-gold-brand" />
                  <h3 className="font-bold text-foreground">2. Payment Details</h3>
                </div>

                <Input
                  label="Cardholder Name"
                  placeholder="JOHN DOE"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  error={paymentErrors.cardName}
                  required
                />

                <div className="relative">
                  <Input
                    label="Card Number"
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    error={paymentErrors.cardNumber}
                    required
                  />
                  {cardNumber.length > 0 && (
                    <span className="absolute right-4 top-10.5 text-xs font-bold text-gold-brand border border-gold-brand/20 bg-gold-brand-light px-2 py-0.5 rounded-lg">
                      {cardType}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Expiry Date"
                    placeholder="MM/YY"
                    value={cardExpiry}
                    onChange={handleExpiryChange}
                    error={paymentErrors.cardExpiry}
                    required
                  />
                  <Input
                    label="CVV"
                    type="password"
                    placeholder="•••"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                    error={paymentErrors.cardCvv}
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-muted-txt hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <Button type="submit">
                    <Lock className="mr-2 h-4 w-4" />
                    Pay {formatMoney(total)}
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              /* Step 3: Transaction Processing Loader */
              <div className="flex flex-col items-center justify-center text-center py-16 h-full animate-scale-up">
                <Loader2 className="h-12 w-12 text-gold-brand animate-spin mb-4" />
                <h3 className="text-lg font-bold text-foreground">Processing Secure Payment</h3>
                <p className="mt-1 text-sm text-muted-txt max-w-[280px]">
                  Please do not reload the page or close the window. We are finalizing your billing.
                </p>
                <div className="mt-8 flex items-center gap-2 rounded-full bg-emerald-500/5 border border-emerald-500/10 px-3.5 py-1.5 text-xs text-emerald-600 font-semibold">
                  <ShieldCheck className="h-4 w-4" /> Bank-grade 256-bit encryption
                </div>
              </div>
            )}

            {step === 4 && createdOrder && (
              /* Step 4: Success Screen */
              <div className="flex flex-col items-center justify-center text-center py-6 h-full animate-scale-up">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 dark:bg-emerald-900/20 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Payment Successful!</h3>
                <p className="mt-1.5 text-sm text-muted-txt max-w-[320px]">
                  Thank you for shopping at Santhosh. Your order has been placed and is currently being processed.
                </p>
                
                <div className="mt-6 rounded-2xl bg-muted-bg/30 p-4 border border-border-brand w-full text-left space-y-2 text-xs">
                  <div className="flex justify-between font-semibold text-foreground">
                    <span>Order Reference:</span>
                    <span className="font-bold text-gold-brand">{createdOrder.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-muted-txt">
                    <span>Total Amount Charged:</span>
                    <span className="font-semibold text-foreground">{formatMoney(createdOrder.total)}</span>
                  </div>
                  <div className="flex justify-between text-muted-txt">
                    <span>Deliver to:</span>
                    <span className="font-semibold text-foreground">{shippingName}</span>
                  </div>
                  <div className="text-[10px] text-muted-txt border-t border-border-brand pt-2 mt-2 leading-relaxed">
                    A confirmation invoice has been sent to your email. You can check order fulfillment details in your personal dashboard.
                  </div>
                </div>

                <Button onClick={handleClose} className="w-full mt-6">
                  Back to Store
                </Button>
              </div>
            )}

          </div>

          {/* Checkout Summary Sidebar (Hide in step 4/Processing) */}
          {step < 3 && (
            <div className="bg-muted-bg/30 border-l border-border-brand p-6 flex flex-col justify-between hidden md:flex">
              <div>
                <h4 className="font-bold text-foreground mb-4">Order Summary</h4>
                <div className="space-y-3 overflow-y-auto max-h-[40vh] pr-1">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex gap-3 text-xs">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border-brand bg-white">
                        <img
                          src={getProductImage(item.product.name)}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{item.product.name}</p>
                        <p className="text-muted-txt">Qty: {item.quantity} × {formatMoney(item.product.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border-brand pt-4 mt-6 space-y-2 text-xs">
                <div className="flex justify-between text-muted-txt">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-txt">
                  <span>Shipping</span>
                  <span className="font-semibold text-foreground">
                    {shippingFee === 0 ? "Free" : formatMoney(shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-foreground border-t border-border-brand pt-2 mt-2">
                  <span>Total</span>
                  <span className="text-base text-gold-brand">{formatMoney(total)}</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
