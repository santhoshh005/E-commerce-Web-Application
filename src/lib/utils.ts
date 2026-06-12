export const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatMoney(value: number) {
  return currency.format(value / 100);
}

export const productImageMap: Record<string, string> = {
  "Aurora Knit Sneaker":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  "Northstar Field Jacket":
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80",
  "Form Studio Backpack":
    "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80",
  "Mono Desk Lamp":
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
  "Terra Ceramic Mug Set":
    "/terra-ceramic-mug.png",
  "Pulse Wireless Earbuds":
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80",
};

export function getProductImage(productName: string) {
  return productImageMap[productName] ?? "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=900&q=80";
}
