"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

function Header() {
  const path = usePathname();

  const navItem = (href: string, label: string) => (
    <Link href={href}>
      <motion.li
        whileHover={{ y: -1 }}
        transition={{ duration: 0.15 }}
        className={`relative cursor-pointer text-sm font-medium transition-colors ${
          path === href
            ? "text-indigo-600"
            : "text-gray-600 hover:text-indigo-600"
        }`}
      >
        {label}
        {path === href && (
          <span className="absolute -bottom-2 left-0 h-[2px] w-full rounded-full bg-indigo-600" />
        )}
      </motion.li>
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/logo.svg" width={36} height={20} alt="logo" />
            <span className="hidden sm:block text-sm font-semibold tracking-tight text-gray-800">
              Mock Interview AI
            </span>
          </Link>
        </div>

        <ul className="hidden md:flex items-center gap-8">
          {navItem("/dashboard", "Dashboard")}
          {navItem("/#how-it-works", "How it works")}
        </ul>

        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </div>
    </header>
  );
}

export default Header;
