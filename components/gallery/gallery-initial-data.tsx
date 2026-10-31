"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ProductItem } from "../products/product-card";

const GalleryInitialDataContext = createContext<ProductItem[] | null>(null);

export function GalleryInitialDataProvider({
  products,
  children,
}: {
  products: ProductItem[];
  children: ReactNode;
}) {
  return (
    <GalleryInitialDataContext.Provider value={products}>
      {children}
    </GalleryInitialDataContext.Provider>
  );
}

export function useGalleryInitialProducts(): ProductItem[] | null {
  return useContext(GalleryInitialDataContext);
}
