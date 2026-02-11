'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { LoginModal } from './login-modal'

export function CTA() {
  const [loginType, setLoginType] = useState<'doctor' | 'patient' | null>(null)

  return (
    <>
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 via-transparent to-accent/10">
        <div className="max-w-4xl mx-auto">
          <Card className="p-12 border border-border bg-gradient-to-br from-card to-card/50 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-0"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-foreground text-center mb-6">
                Ready to Transform Healthcare?
              </h2>
              <p className="text-lg text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
                Join thousands of healthcare professionals using Medicare AI to streamline documentation and improve patient care.
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                    For Doctors
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex gap-2 text-muted-foreground text-sm">
                      <span className="text-accent">✓</span>
                      Instant clinical notes
                    </li>
                    <li className="flex gap-2 text-muted-foreground text-sm">
                      <span className="text-accent">✓</span>
                      Patient history access
                    </li>
                    <li className="flex gap-2 text-muted-foreground text-sm">
                      <span className="text-accent">✓</span>
                      AI-powered insights
                    </li>
                    <li className="flex gap-2 text-muted-foreground text-sm">
                      <span className="text-accent">✓</span>
                      Team collaboration
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                    For Patients
                  </h3>
                  <ul className="space-y-2">
                    <li className="flex gap-2 text-muted-foreground text-sm">
                      <span className="text-accent">✓</span>
                      Complete health records
                    </li>
                    <li className="flex gap-2 text-muted-foreground text-sm">
                      <span className="text-accent">✓</span>
                      Never repeat your history
                    </li>
                    <li className="flex gap-2 text-muted-foreground text-sm">
                      <span className="text-accent">✓</span>
                      Easy record sharing
                    </li>
                    <li className="flex gap-2 text-muted-foreground text-sm">
                      <span className="text-accent">✓</span>
                      Full privacy control
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => setLoginType('doctor')}
                  className="gap-2 group"
                >
                  Get Started as Doctor
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLoginType('patient')}
                  className="gap-2 border-border"
                >
                  Get Started as Patient
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                No credit card required. Start with your free account today.
              </p>
            </div>
          </Card>
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
