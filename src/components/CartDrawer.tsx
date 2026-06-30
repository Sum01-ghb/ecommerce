"use client";

import React from "react";
import { useCartStore } from "@/store/useCartStore";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export default function CartDrawer() {
  const { isOpen, items, setIsOpen, updateQuantity, removeFromCart } = useCartStore();

  if (!isOpen) return null;

  const totalCents = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const formattedSubtotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalCents / 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md flex flex-col h-full bg-light-100 shadow-2xl border-l border-light-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-light-300">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-dark-900" />
              <h2 className="text-body-medium font-medium text-dark-900">Shopping Cart</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-sm p-1.5 text-dark-500 hover:bg-light-200 hover:text-dark-900 transition-colors"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
                <div className="rounded-full bg-light-200 p-6">
                  <ShoppingBag size={36} className="text-light-400" />
                </div>
                <div>
                  <p className="text-body-medium text-dark-900">Your cart is empty</p>
                  <p className="text-caption text-dark-700 mt-1">
                    Add items to begin your order.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-sm border border-light-400 px-5 py-2.5 text-caption hover:bg-light-200 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 border-b border-light-300 pb-6 last:border-0 last:pb-0"
                >
                  {/* Thumbnail */}
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-sm bg-light-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between gap-2">
                      <p className="text-caption font-medium text-dark-900 line-clamp-2">{item.name}</p>
                      <p className="text-caption font-medium text-dark-900 whitespace-nowrap">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format((item.price * item.quantity) / 100)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Qty controls */}
                      <div className="flex items-center border border-light-400 rounded-sm">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 text-dark-700 hover:text-dark-900"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-3 text-caption text-dark-900">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 text-dark-700 hover:text-dark-900"
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-dark-500 hover:text-red transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-light-300 p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-body text-dark-700">Subtotal</span>
                <span className="text-body-medium font-medium text-dark-900">{formattedSubtotal}</span>
              </div>
              <p className="text-footnote text-dark-500">
                Shipping and taxes calculated at checkout.
              </p>
              <button
                onClick={() => alert("Checkout is a demo feature.")}
                className="w-full rounded-sm bg-dark-900 py-3.5 text-caption font-medium text-light-100 hover:bg-black transition-colors"
              >
                Checkout
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="w-full rounded-sm border border-light-400 py-3 text-caption text-dark-900 hover:bg-light-200 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
