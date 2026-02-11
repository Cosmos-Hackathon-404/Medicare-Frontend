'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Shield, Zap } from 'lucide-react'
import { useState } from 'react'
import { LoginModal } from './login-modal'

export function Hero() {
  const [loginType, setLoginType] = useState<'doctor' | 'patient' | null>(null)

  return (
    <>
      <section className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-background to-accent/5 flex items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-block">
                <span className="px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-sm font-medium">
                  ✨ AI-Powered Healthcare
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl font-bold text-foreground leading-tight text-balance">
                Bridge the Gap Between Doctors and Patients
              </h1>

              <p className="text-xl text-muted-foreground leading-relaxed text-balance">
                Medicare AI automates clinical documentation, summarizes medical reports, and maintains persistent patient memory — eliminating the need to repeat your medical history.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  onClick={() => setLoginType('doctor')}
                  className="gap-2 group"
                >
                  Doctor Access
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLoginType('patient')}
                  className="gap-2 border-border"
                >
                  Patient Portal
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 pt-6">
                <div className="flex gap-3 items-start">
                  <Zap className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">Instant Documentation</p>
                    <p className="text-sm text-muted-foreground">AI generates clinical notes in seconds</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-semibold text-foreground">HIPAA Compliant</p>
                    <p className="text-sm text-muted-foreground">Enterprise-grade security standards</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Visual Element */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-full h-96">
                {/* Gradient Background Blob */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl transform rotate-6"></div>
                
                {/* Card Stack Effect */}
                <div className="absolute inset-0 bg-card rounded-2xl border border-border shadow-lg p-6 transform -rotate-3 z-10">
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-32 bg-accent/10 rounded-lg mt-6"></div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-card rounded-2xl border border-border shadow-lg p-6 transform rotate-3 z-20">
                  <div className="h-3 bg-primary rounded-full w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-4/5"></div>
                    <div className="h-16 bg-primary/10 rounded-lg mt-4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {loginType && (
        <LoginModal
          type={loginType}
          onClose={() => setLoginType(null)}
        />
      )}
    </>
  )
}
