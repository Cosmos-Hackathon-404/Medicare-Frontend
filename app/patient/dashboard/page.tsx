import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { Features } from '@/components/features'
import { DoctorPatientSection } from '@/components/doctor-patient-section'
import { Benefits } from '@/components/benefits'
import { Team } from '@/components/team'
import { CTA } from '@/components/cta'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <Features />
      <DoctorPatientSection />
      <Benefits />
      <Team />
      <CTA />
      <Footer />
    </main>
  )
}
