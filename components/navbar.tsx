'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/shared/theme-toggle'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="fixed w-full top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="hidden sm:block font-semibold text-foreground">Medicare AI</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground text-sm transition">
              Features
            </a>
            <a href="#benefits" className="text-muted-foreground hover:text-foreground text-sm transition">
              How It Works
            </a>
            <a href="#team" className="text-muted-foreground hover:text-foreground text-sm transition">
              Team
            </a>
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <SignedOut>
              <Button variant="outline" size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Get Started</Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button variant="outline" size="sm" asChild>
                <Link href="/onboarding">Dashboard</Link>
              </Button>
              <UserButton />
            </SignedIn>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border pt-4">
            <a href="#features" className="block py-2 text-muted-foreground hover:text-foreground">
              Features
            </a>
            <a href="#benefits" className="block py-2 text-muted-foreground hover:text-foreground">
              How It Works
            </a>
            <a href="#team" className="block py-2 text-muted-foreground hover:text-foreground mb-4">
              Team
            </a>
            <div className="flex flex-col gap-2">
              <SignedOut>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button size="sm" asChild className="w-full">
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button size="sm" asChild className="w-full">
                  <Link href="/onboarding">Dashboard</Link>
                </Button>
              </SignedIn>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
