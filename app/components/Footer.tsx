// app/components/Footer.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dumbbell, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  ArrowRight,
  Heart,
  Shield,
  ChevronRight
} from 'lucide-react';
import { FaInstagram, FaFacebook, FaTwitter, FaYoutube } from 'react-icons/fa6';
import { motion } from 'framer-motion';

export default function Footer() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: {
      title: 'Company',
      links: [
        { label: 'About Us', href: '/about' },
        { label: 'Our Team', href: '/team' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press', href: '/press' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    services: {
      title: 'Services',
      links: [
        { label: 'Personal Training', href: '/services/personal-training' },
        { label: 'Group Classes', href: '/services/group-classes' },
        { label: 'Nutrition Plans', href: '/services/nutrition' },
        { label: 'Online Coaching', href: '/services/online-coaching' },
        { label: 'Fitness Assessment', href: '/services/assessment' },
      ],
    },
    support: {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '/help' },
        { label: 'FAQs', href: '/faqs' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Cookie Policy', href: '/cookies' },
      ],
    },
    members: {
      title: 'Members',
      links: [
        { label: 'Member Portal', href: '/login' },
        { label: 'Class Schedule', href: '/schedule' },
        { label: 'Membership Plans', href: '/plans' },
        { label: 'Book a Session', href: '/book' },
        { label: 'Refer a Friend', href: '/refer' },
      ],
    },
  };

  const contactInfo = [
    { icon: MapPin, text: '123 Fitness Street, Gym City, GC 12345' },
    { icon: Phone, text: '+1 (555) 123-4567' },
    { icon: Mail, text: 'info@gymstitch.com' },
    { icon: Clock, text: 'Open 24/7 - All Day, Every Day' },
  ];

  const socialLinks = [
    { icon: FaInstagram, href: 'https://instagram.com/gymstitch', label: 'Instagram' },
    { icon: FaFacebook, href: 'https://facebook.com/gymstitch', label: 'Facebook' },
    { icon: FaTwitter, href: 'https://twitter.com/gymstitch', label: 'Twitter' },
    { icon: FaYoutube, href: 'https://youtube.com/gymstitch', label: 'Youtube' },
  ];

  return (
    <footer className="relative bg-[var(--surface)] border-t border-[var(--border)]">
      {/* Top Gradient Line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/50 to-transparent" />

      {/* Newsletter Section */}
      <div className="border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">
                Subscribe to Our Newsletter
              </h3>
              <p className="text-sm text-[var(--muted)] mt-1">
                Get the latest updates, tips, and special offers directly to your inbox.
              </p>
            </div>
            <div className="flex w-full md:w-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 h-12 px-4 rounded-xl border border-[var(--field-border)] bg-[var(--field-background)] text-[var(--foreground)] placeholder:text-[var(--muted)] font-medium outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent)]/15 transition-all"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-12 px-6 rounded-xl bg-[var(--accent)] text-white font-semibold shadow-lg shadow-[var(--accent)]/20 hover:shadow-xl hover:shadow-[var(--accent)]/30 transition-all flex items-center gap-2"
              >
                Subscribe
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent)]/70 shadow-lg shadow-[var(--accent)]/20">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-[var(--foreground)]">
                GymStitch
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] mb-6 leading-relaxed">
              Your ultimate fitness destination. We provide world-class equipment, 
              expert trainers, and a supportive community to help you achieve your fitness goals.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              {contactInfo.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <item.icon className="h-4 w-4 text-[var(--accent)] mt-0.5 shrink-0" />
                  <span className="text-sm text-[var(--muted)]">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              {socialLinks.map((social, i) => (
                <motion.a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--field-background)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)]/30 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          {Object.values(footerLinks).map((section, i) => (
            <div key={i}>
              <h4 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <button
                      onClick={() => router.push(link.href)}
                      className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1 group"
                    >
                      <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[var(--muted)]">
              © {currentYear} GymStitch. All rights reserved.
            </p>
            
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push('/privacy')}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => router.push('/terms')}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Terms of Service
              </button>
              <button
                onClick={() => router.push('/cookies')}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                Cookie Policy
              </button>
            </div>

            <p className="text-sm text-[var(--muted)] flex items-center gap-1">
              Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> by GymStitch Team
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}