import { ShoppingBag, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-card-border bg-card/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-brand text-primary-brand-foreground shadow-sm">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <span className="text-md font-bold tracking-tight text-foreground font-sans">
              SANTHOSH <span className="text-gold-brand">STORE</span>
            </span>
          </div>

          {/* Core Tech stack info */}
          <p className="text-xs text-muted-txt text-center sm:text-left">
            Built with <span className="font-semibold text-foreground">Next.js App Router</span>,{" "}
            <span className="font-semibold text-foreground">Prisma Client</span>,{" "}
            <span className="font-semibold text-foreground">Tailwind CSS v4</span>, and{" "}
            <span className="font-semibold text-foreground">SQLite</span>.
          </p>

          {/* External mock/developer link */}
          <div className="flex items-center gap-4 text-muted-txt">
            <span className="flex items-center gap-1 text-xs">
              Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> by Santhosh
            </span>
          </div>

        </div>

        <div className="mt-8 border-t border-border-brand pt-6 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-txt">
            &copy; {new Date().getFullYear()} Santhosh Storefront. All rights reserved. Registered demonstration model.
          </p>
        </div>
      </div>
    </footer>
  );
}
