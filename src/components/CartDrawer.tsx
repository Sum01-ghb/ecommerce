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
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={() => setIsOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        {/* Panel */}
        <div className="w-screen max-w-md transform bg-white shadow-2xl dark:bg-neutral-950 flex flex-col h-full border-l border-neutral-200/50 dark:border-neutral-800/50 animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 dark:border-neutral-900">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-neutral-900 dark:text-white" />
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Shopping Cart</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-900 dark:hover:text-neutral-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="rounded-full bg-neutral-50 p-6 dark:bg-neutral-900">
                  <ShoppingBag size={40} className="text-neutral-300 dark:text-neutral-700" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Your cart is empty</p>
                  <p className="text-xs text-neutral-400">Add Nike select items to begin your order.</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-neutral-200 px-5 py-2.5 text-xs font-bold hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-neutral-100 pb-6 dark:border-neutral-900 last:border-b-0 last:pb-0">
                  {/* Thumbnail */}
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-neutral-50 dark:bg-neutral-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover object-center"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between text-sm font-bold text-neutral-900 dark:text-white">
                        <h3 className="line-clamp-1">{item.name}</h3>
                        <p className="ml-4 font-black">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format((item.price * item.quantity) / 100)}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-neutral-400">
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(item.price / 100)} each
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-neutral-200 dark:border-neutral-800 rounded-lg bg-neutral-50/55 dark:bg-neutral-900/55">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1.5 text-neutral-500 hover:text-black dark:hover:text-white"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-neutral-400 hover:text-red-500 transition-colors"
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
            <div className="border-t border-neutral-100 p-6 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-900/20">
              <div className="flex justify-between text-base font-bold text-neutral-900 dark:text-white mb-2">
                <span>Subtotal</span>
                <span className="font-black text-lg">{formattedSubtotal}</span>
              </div>
              <p className="text-xs text-neutral-400 mb-6">
                Shipping and taxes calculated at checkout.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => alert("Checkout flow is a demo feature.")}
                  className="flex w-full items-center justify-center rounded-xl bg-black py-4 text-sm font-bold text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors shadow-lg"
                >
                  Checkout Now
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="flex w-full items-center justify-center rounded-xl border border-neutral-200 bg-white py-3 text-sm font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-900 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
