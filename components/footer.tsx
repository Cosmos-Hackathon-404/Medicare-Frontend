import { Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-secondary text-secondary-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-secondary font-bold">M</span>
              </div>
              <span className="font-bold">Medicare AI</span>
            </div>
            <p className="text-sm opacity-80">
              Transforming healthcare with intelligent clinical documentation and patient record management.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="opacity-75 hover:opacity-100 transition">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="opacity-75 hover:opacity-100 transition">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="opacity-75 hover:opacity-100 transition">
                  Security
                </a>
              </li>
              <li>
                <a href="#" className="opacity-75 hover:opacity-100 transition">
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="opacity-75 hover:opacity-100 transition">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="opacity-75 hover:opacity-100 transition">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="opacity-75 hover:opacity-100 transition">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="opacity-75 hover:opacity-100 transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href="mailto:info@medicareai.com" className="opacity-75 hover:opacity-100 transition">
                  info@medicareai.com
                </a>
              </li>
              <li className="flex gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href="tel:+1234567890" className="opacity-75 hover:opacity-100 transition">
                  +1 (234) 567-890
                </a>
              </li>
              <li className="flex gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="opacity-75">San Francisco, CA</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-secondary-foreground/20 my-8"></div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p className="opacity-75">
            © {currentYear} Medicare AI. All rights reserved.
          </p>

          <div className="flex gap-6">
            <a href="#" className="opacity-75 hover:opacity-100 transition">
              Privacy Policy
            </a>
            <a href="#" className="opacity-75 hover:opacity-100 transition">
              Terms of Service
            </a>
            <a href="#" className="opacity-75 hover:opacity-100 transition">
              HIPAA Notice
            </a>
            <a href="#" className="opacity-75 hover:opacity-100 transition">
              Compliance
            </a>
          </div>

          <div className="flex gap-4">
            <a href="#" className="opacity-75 hover:opacity-100 transition" aria-label="Twitter">
              𝕏
            </a>
            <a href="#" className="opacity-75 hover:opacity-100 transition" aria-label="LinkedIn">
              in
            </a>
            <a href="#" className="opacity-75 hover:opacity-100 transition" aria-label="GitHub">
              gh
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
