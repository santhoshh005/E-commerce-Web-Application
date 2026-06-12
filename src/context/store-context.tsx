"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type UserRole = "ADMIN" | "USER";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  inventory: number;
  featured: boolean;
  rating: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
  };
};

export type Order = {
  id: string;
  userId: string;
  status: "PENDING" | "PAID" | "PACKING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  subtotal: number;
  shippingFee: number;
  total: number;
  createdAt: string;
  updatedAt: string;
  user?: SessionUser;
  items: OrderItem[];
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type JoinedCartItem = {
  productId: string;
  quantity: number;
  product: Product;
};

export type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

type StoreContextType = {
  session: SessionUser | null;
  setSession: (user: SessionUser | null) => void;
  loading: boolean;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  cart: CartItem[];
  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartItems: JoinedCartItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setCheckoutOpen: (open: boolean) => void;
  isAuthOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  authMode: "login" | "register";
  setAuthMode: (mode: "login" | "register") => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  toasts: Toast[];
  addToast: (message: string, type?: "success" | "error" | "info") => void;
  removeToast: (id: string) => void;
  refreshOrders: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  activeView: "store" | "dashboard" | "admin";
  setActiveView: (view: "store" | "dashboard" | "admin") => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;

  if (!response.ok) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload;
}

let toastIdCounter = 0;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // UI visibility states
  const [isCartOpen, setCartOpen] = useState(false);
  const [isCheckoutOpen, setCheckoutOpen] = useState(false);
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const savedTheme = window.localStorage.getItem("santhosh-theme") as "light" | "dark" | null;
    if (savedTheme) return savedTheme;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return prefersDark ? "dark" : "light";
  });
  
  // Search and Category filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeView, setActiveView] = useState<"store" | "dashboard" | "admin">("store");
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    const savedCart = window.localStorage.getItem("santhosh-cart");
    if (savedCart) {
      try {
        return JSON.parse(savedCart) as CartItem[];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(true);

  // Sync theme with DOM document element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Save cart to local storage
  useEffect(() => {
    window.localStorage.setItem("santhosh-cart", JSON.stringify(cart));
  }, [cart]);

  // Hoist refresh utilities so they are defined when called inside effects
  const refreshOrders = async () => {
    try {
      const { orders: fetchedOrders } = await fetchJson<{ orders: Order[] }>("/api/orders");
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error refreshing orders:", error);
    }
  };

  const refreshProducts = async () => {
    try {
      const { products: catalog } = await fetchJson<{ products: Product[] }>("/api/products");
      setProducts(catalog);
    } catch (error) {
      console.error("Error refreshing products:", error);
    }
  };

  // Fetch catalog & auth status
  useEffect(() => {
    async function bootstrap() {
      try {
        const [{ products: catalog }, { user }] = await Promise.all([
          fetchJson<{ products: Product[] }>("/api/products"),
          fetchJson<{ user: SessionUser | null }>("/api/auth/me"),
        ]);

        setProducts(catalog);
        setSession(user);

        if (user) {
          const { orders: fetchedOrders } = await fetchJson<{ orders: Order[] }>("/api/orders");
          setOrders(fetchedOrders);
        }
      } catch (error) {
        console.error("Store initialization error:", error);
      } finally {
        setLoading(false);
      }
    }

    void bootstrap();
  }, []);

  // Fetch orders when session changes (deferred with setTimeout to satisfy linter rules)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!session) {
        setOrders([]);
      } else {
        void refreshOrders();
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [session]);

  // Toast System
  const addToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = String(++toastIdCounter);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Theme Toggle
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    window.localStorage.setItem("santhosh-theme", newTheme);
  };

  // Cart operations
  const addToCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const existingItem = cart.find((item) => item.productId === productId);
    const currentQuantity = existingItem ? existingItem.quantity : 0;

    // Check inventory
    if (product.inventory <= currentQuantity) {
      addToast(`Cannot add more than ${product.inventory} items (insufficient inventory)`, "error");
      return;
    }

    addToast(`Added "${product.name}" to cart`, "success");

    setCart((currentCart) => {
      const hasItem = currentCart.some((item) => item.productId === productId);
      if (hasItem) {
        return currentCart.map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...currentCart, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
    if (product) {
      addToast(`Removed "${product.name}" from cart`, "info");
    }
  };

  const updateCartItem = (productId: string, quantity: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    // Check inventory
    if (product.inventory < quantity) {
      addToast(`Only ${product.inventory} units available in stock`, "error");
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Memoized Cart Calculations
  const cartItems = useMemo(
    () =>
      cart
        .map((entry) => {
          const product = products.find((item) => item.id === entry.productId);
          if (!product) return null;
          return { ...entry, product };
        })
        .filter((entry): entry is JoinedCartItem => Boolean(entry)),
    [cart, products]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const shippingFee = useMemo(
    () => (subtotal >= 15000 || subtotal === 0 ? 0 : 1200),
    [subtotal]
  );

  const total = useMemo(() => subtotal + shippingFee, [subtotal, shippingFee]);

  return (
    <StoreContext.Provider
      value={{
        session,
        setSession,
        loading,
        products,
        setProducts,
        orders,
        setOrders,
        cart,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        cartItems,
        subtotal,
        shippingFee,
        total,
        isCartOpen,
        setCartOpen,
        isCheckoutOpen,
        setCheckoutOpen,
        isAuthOpen,
        setAuthOpen,
        authMode,
        setAuthMode,
        selectedProduct,
        setSelectedProduct,
        theme,
        toggleTheme,
        toasts,
        addToast,
        removeToast,
        refreshOrders,
        refreshProducts,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        activeView,
        setActiveView,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}
