import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

export function CTA() {
  return (
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
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  For Doctors
                </h3>
                <ul className="space-y-2">
                  {['Instant clinical notes', 'Patient history access', 'AI-powered insights', 'Team collaboration'].map((item) => (
                    <li key={item} className="flex gap-2 text-muted-foreground text-sm">
                      <span className="text-primary">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  For Patients
                </h3>
                <ul className="space-y-2">
                  {['Complete health records', 'Never repeat your history', 'Easy record sharing', 'Full privacy control'].map((item) => (
                    <li key={item} className="flex gap-2 text-muted-foreground text-sm">
                      <span className="text-accent">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2 group" asChild>
                <Link href="/sign-up">
                  Get Started Free
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

            <p className="text-center text-sm text-muted-foreground mt-6">
              No credit card required. Start with your free account today.
            </p>
          </div>
        </Card>
      </div>
    </section>
  )
}
