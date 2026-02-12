import { Card } from '@/components/ui/card'
import { UserPlus, CalendarCheck, Mic, FileSearch } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    step: '1',
    title: 'Create Your Account',
    description: 'Sign up as a doctor or patient in seconds. Complete a quick profile setup to get started.',
  },
  {
    icon: CalendarCheck,
    step: '2',
    title: 'Book an Appointment',
    description: 'Patients browse available doctors by specialization and book appointments in available time slots.',
  },
  {
    icon: Mic,
    step: '3',
    title: 'AI-Powered Sessions',
    description: 'During consultations, AI records and transcribes the session, generating clinical notes automatically.',
  },
  {
    icon: FileSearch,
    step: '4',
    title: 'Smart Reports & Context',
    description: 'Upload medical reports for AI analysis. Share your complete medical history with new doctors seamlessly.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-secondary/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in minutes. Medicare AI streamlines the entire healthcare workflow from booking to follow-up.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((item, index) => {
            const Icon = item.icon
            return (
              <Card
                key={index}
                className="p-6 border border-border hover:border-primary/50 transition-all group relative"
              >
                <div className="absolute top-4 right-4 text-5xl font-bold text-primary/10">
                  {item.step}
                </div>
                <div className="mb-4 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
