"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWallet } from "@/contexts/wallet-context"

function truncateAddress(address: string): string {
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { account, disconnectWallet } = useWallet()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    setIsMenuOpen(false)
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : ""
        }`}
      >
        <nav className="flex items-center justify-between px-6 py-4 my-0 md:px-12 md:py-5">
          {/* Logo */}

          {/* Desktop Navigation */}

          {/* Spacer to push wallet info to far right */}
          <div className="flex-1" />

          {/* Wallet Info & Logout - Desktop */}
          {account && (
            <div className="hidden md:flex items-center gap-3 ml-auto">
              <span className="font-mono text-sm text-muted-foreground">
                {truncateAddress(account)}
              </span>
              <button
                onClick={disconnectWallet}
                className="px-3 py-1.5 text-xs font-mono tracking-wider uppercase border border-white/20 rounded-full hover:bg-white/10 transition-colors duration-300"
                title="Disconnect Wallet"
              >
                Logout
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5 ml-auto"
            aria-label="Toggle menu"
          >
            <motion.span
              animate={isMenuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
              className="w-6 h-px bg-foreground origin-center"
            />
            <motion.span
              animate={isMenuOpen ? { opacity: 0, x: -10 } : { opacity: 1, x: 0 }}
              className="w-6 h-px bg-foreground"
            />
            <motion.span
              animate={isMenuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
              className="w-6 h-px bg-foreground origin-center"
            />
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-lg md:hidden"
          >
            <nav className="flex flex-col items-center justify-center h-full gap-8">
              {account && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col items-center gap-4 mt-8"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-muted-foreground">
                      {truncateAddress(account)}
                    </span>
                    <button
                      onClick={disconnectWallet}
                      className="px-3 py-1.5 text-xs font-mono tracking-wider uppercase border border-white/20 rounded-full hover:bg-white/10 transition-colors duration-300"
                    >
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
