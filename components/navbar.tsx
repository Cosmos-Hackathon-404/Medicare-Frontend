'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { LoginModal } from './login-modal'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [loginType, setLoginType] = useState<'doctor' | 'patient' | null>(null)

  return (
    <>
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
              <a href="#features" className="text-foreground hover:text-primary text-sm transition">
                Features
              </a>
              <a href="#benefits" className="text-foreground hover:text-primary text-sm transition">
                How It Works
              </a>
              <a href="#team" className="text-foreground hover:text-primary text-sm transition">
                Team
              </a>
            </div>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLoginType('patient')}
                className="border-border"
              >
                Patient Login
              </Button>
              <Button size="sm" onClick={() => setLoginType('doctor')}>
                Doctor Login
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="md:hidden pb-4 border-t border-border">
              <a href="#features" className="block py-2 text-foreground hover:text-primary">
                Features
              </a>
              <a href="#benefits" className="block py-2 text-foreground hover:text-primary">
                How It Works
              </a>
              <a href="#team" className="block py-2 text-foreground hover:text-primary mb-4">
                Team
              </a>
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoginType('patient')
                    setIsOpen(false)
                  }}
                  className="w-full border-border"
                >
                  Patient Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setLoginType('doctor')
                    setIsOpen(false)
                  }}
                  className="w-full"
                >
                  Doctor Login
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {loginType && (
        <LoginModal
          type={loginType}
          onClose={() => setLoginType(null)}
        />
      )}
    </>
  )
}
