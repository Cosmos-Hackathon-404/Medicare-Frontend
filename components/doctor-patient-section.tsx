'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stethoscope, User, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { LoginModal } from './login-modal'

export function DoctorPatientSection() {
  const [loginType, setLoginType] = useState<'doctor' | 'patient' | null>(null)

  return (
    <>
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-secondary/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Designed for Both Doctors and Patients
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored experiences for each role with powerful tools to improve healthcare delivery and patient care.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Doctor Card */}
            <Card className="p-8 border border-border hover:border-primary/50 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition -z-0"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition">
                  <Stethoscope className="w-7 h-7 text-primary" />
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-4">For Doctors</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">
                      <strong>Auto-generate notes</strong> from patient interactions using AI
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">
                      <strong>Access unified records</strong> across all patient visits
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">
                      <strong>Get AI-powered insights</strong> for better diagnosis
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">
                      <strong>Reduce documentation time</strong> by up to 80%
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">
                      <strong>Collaborate seamlessly</strong> with other healthcare providers
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => setLoginType('doctor')}
                  className="w-full gap-2 group/btn"
                >
                  Doctor Login <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition" />
                </Button>
              </div>
            </Card>

            {/* Patient Card */}
            <Card className="p-8 border border-border hover:border-accent/50 transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition -z-0"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition">
                  <User className="w-7 h-7 text-accent" />
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-4">For Patients</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">
                      <strong>Never repeat your history</strong> across different doctors
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">
                      <strong>Access all your records</strong> in one secure place
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">
                      <strong>Understand your health</strong> with simplified summaries
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">
                      <strong>Share your data</strong> with authorized healthcare providers
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-accent font-bold mt-1">✓</span>
                    <span className="text-muted-foreground">
                      <strong>Complete privacy control</strong> over your medical information
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => setLoginType('patient')}
                  variant="outline"
                  className="w-full gap-2 group/btn border-accent/20 hover:border-accent"
                >
                  Patient Portal <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition" />
                </Button>
              </div>
            </Card>
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
