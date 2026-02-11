import { Card } from '@/components/ui/card'
import { Github, Linkedin, Mail } from 'lucide-react'

const teamMembers = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Chief Medical Officer',
    bio: 'Former cardiac surgeon with 15+ years in healthcare. MD from Stanford.',
    skills: ['Clinical Expertise', 'Product Strategy', 'Healthcare Compliance'],
  },
  {
    name: 'Alex Rodriguez',
    role: 'Lead AI Engineer',
    bio: 'ML specialist with 10+ years building healthcare AI systems. PhD in Computer Science.',
    skills: ['Machine Learning', 'NLP', 'System Architecture'],
  },
  {
    name: 'Emily Wong',
    role: 'Product Designer',
    bio: 'UX/UI designer focused on healthcare products. Experience at major healthtech companies.',
    skills: ['User Research', 'Healthcare UX', 'Design Systems'],
  },
  {
    name: 'Michael Patel',
    role: 'Backend Lead',
    bio: 'Senior engineer with expertise in HIPAA-compliant systems and cloud infrastructure.',
    skills: ['Security', 'Cloud Architecture', 'Database Design'],
  },
]

export function Team() {
  return (
    <section id="team" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-secondary/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Meet Our Team
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Healthcare professionals and technology experts dedicated to transforming clinical workflows.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {teamMembers.map((member, index) => (
            <Card
              key={index}
              className="p-6 border border-border hover:border-primary/50 transition-all group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition -z-0"></div>
              
              <div className="relative z-10">
                {/* Avatar Placeholder */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mb-4 flex items-center justify-center text-white font-bold text-xl">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>

                <h3 className="text-lg font-bold text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-sm text-accent font-semibold mb-3">
                  {member.role}
                </p>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                  {member.bio}
                </p>

                <div className="space-y-2 mb-4">
                  {member.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mr-2 mb-2"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                  <button className="text-muted-foreground hover:text-primary transition">
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button className="text-muted-foreground hover:text-primary transition">
                    <Github className="w-4 h-4" />
                  </button>
                  <button className="text-muted-foreground hover:text-primary transition">
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Company Values */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 pt-12 border-t border-border">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary mb-2">3+ Years</p>
            <p className="text-muted-foreground">Building healthcare AI solutions</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary mb-2">50+</p>
            <p className="text-muted-foreground">Healthcare institutions partnered</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary mb-2">1M+</p>
            <p className="text-muted-foreground">Hours of doctor time saved</p>
          </div>
        </div>
      </div>
    </section>
  )
}
