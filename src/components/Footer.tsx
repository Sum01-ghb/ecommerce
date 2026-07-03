import React from "react";
import Image from "next/image";
import Link from "next/link";

const FOOTER_SECTIONS = [
  {
    heading: "Featured",
    links: [
      { label: "Air Force 1", href: "#" },
      { label: "Jordan 1", href: "#" },
      { label: "Air Max 90", href: "#" },
      { label: "Air Max 97", href: "#" },
    ],
  },
  {
    heading: "Shoes",
    links: [
      { label: "All Shoes", href: "#" },
      { label: "Custom Shoes", href: "#" },
      { label: "Jordan Shoes", href: "#" },
      { label: "Running Shoes", href: "#" },
    ],
  },
  {
    heading: "Clothing",
    links: [
      { label: "All Clothing", href: "#" },
      { label: "Modest Wear", href: "#" },
      { label: "Hoodies & Pullovers", href: "#" },
      { label: "Shirts & Tops", href: "#" },
    ],
  },
  {
    heading: "Kids'",
    links: [
      { label: "Infant & Toddler Shoes", href: "#" },
      { label: "Kids' Shoes", href: "#" },
      { label: "Kids' Jordan Shoes", href: "#" },
      { label: "Kids' Basketball Shoes", href: "#" },
    ],
  },
];

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "#",
    icon: "/facebook.svg",
  },
  {
    label: "Instagram",
    href: "#",
    icon: "/instagram.svg",
  },
  {
    label: "X (Twitter)",
    href: "#",
    icon: "/x.svg",
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-dark-900 text-light-100">
      {}
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 pt-12 pb-8">
        <div className="grid grid-cols-2 gap-y-10 gap-x-6 sm:grid-cols-2 md:grid-cols-4">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h4 className="mb-4 text-caption font-medium text-light-100 uppercase tracking-wider">
                {section.heading}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-footnote text-dark-500 hover:text-light-100 transition-colors duration-150 cursor-pointer"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 py-5 flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          {}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            <Image
              src="/logo.svg"
              alt="Nike"
              width={48}
              height={18}
              className="invert brightness-0 filter opacity-70"
            />
            <p className="text-footnote text-dark-700">
              &copy; {year} Nike, Inc. All Rights Reserved.
            </p>
          </div>

          {}
          <div className="flex items-center gap-4">
            {SOCIAL_LINKS.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                aria-label={social.label}
                className="text-dark-500 hover:text-light-100 transition-colors duration-150 cursor-pointer"
              >
                <Image
                  src={social.icon}
                  alt={social.label}
                  width={20}
                  height={20}
                  className="invert brightness-0 filter opacity-60 hover:opacity-100 transition-opacity"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}