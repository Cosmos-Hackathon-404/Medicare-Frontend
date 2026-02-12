'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const heroImages = [
  {
    src: '/medical.png',
    alt: 'Medical consultation',
  },
  {
    src: '/medical_cleaned.png',
    alt: 'Healthcare services',
  },
]

export function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fade, setFade] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false)
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % heroImages.length)
        setFade(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-primary/5 flex items-center">
      <div className="max-w-7xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="relative z-30 space-y-6">
            <div className="inline-block">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-medium">
                ✨ AI-Powered Healthcare
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-tight text-balance">
              An Intelligent AI Layer Between Doctor and Patient
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed text-balance">
              Medicare AI automates clinical documentation, summarizes medical reports, and maintains persistent patient memory — eliminating the need to repeat your medical history.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="gap-2 group" asChild>
                <Link href="/sign-up">
                  Get Started
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <Link href="/sign-in">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 pt-6">
              <div className="flex gap-3 items-start">
                <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground">Instant Documentation</p>
                  <p className="text-sm text-muted-foreground">AI generates clinical notes in seconds</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-foreground">Secure & Private</p>
                  <p className="text-sm text-muted-foreground">Enterprise-grade security standards</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Rotating Medical Illustration */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full h-[28rem] flex items-center justify-center">
              <Image
                src={heroImages[currentIndex].src}
                alt={heroImages[currentIndex].alt}
                width={500}
                height={450}
                className={`object-contain transition-opacity duration-400 select-none ${fade ? 'opacity-100' : 'opacity-0'}`}
                unoptimized
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
