import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import {
  Shield, Pill, Store, Hospital, TestTube, QrCode, FileSpreadsheet,
  Bell, TrendingUp, ArrowRight, CheckCircle, Leaf,
} from 'lucide-react';

const features = [
  { icon: <Pill className="h-6 w-6" />, title: 'Medicine Tracking', description: 'Track all your medicines with expiry alerts and low stock warnings.' },
  { icon: <Store className="h-6 w-6" />, title: 'Pharmacy Integration', description: 'Automatic medicine tracking when you purchase from connected pharmacies.' },
  { icon: <Hospital className="h-6 w-6" />, title: 'Hospital Connect', description: 'Hospitals can track inventory and view patient medication adherence.' },
  { icon: <TestTube className="h-6 w-6" />, title: 'Blood Test Booking', description: 'Book blood tests at diagnostic centers with easy scheduling.' },
  { icon: <QrCode className="h-6 w-6" />, title: 'QR Code Scanning', description: 'Quickly add medicines by scanning QR codes on packaging.' },
  { icon: <FileSpreadsheet className="h-6 w-6" />, title: 'CSV Billing Upload', description: 'Pharmacies can bulk upload billing data via CSV files.' },
  { icon: <Bell className="h-6 w-6" />, title: 'Smart Notifications', description: 'Get alerts for expiring medicines, low stock, and appointments.' },
  { icon: <TrendingUp className="h-6 w-6" />, title: 'Adherence Tracking', description: 'Track medication adherence with detailed analytics.' },
];

const benefits = [
  'Never miss a dose with smart reminders',
  'Reduce medicine waste with expiry tracking',
  'Seamless pharmacy and hospital integration',
  'Book blood tests in seconds',
  'Real-time inventory management',
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative overflow-hidden gradient-hero">
        <div className="container relative z-10 py-20 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <Leaf className="h-4 w-4" />
              Healthcare Impact Platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your Digital{' '}
              <span className="text-gradient">Healthcare Vault</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              MediVault connects patients, pharmacies, hospitals, and diagnostic centers
              in one seamless ecosystem. Track medicines, book tests, and never miss a dose.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="xl" asChild>
                <Link to="/register">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="xl" variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">Everything You Need</h2>
            <p className="mt-4 text-muted-foreground">A comprehensive healthcare management platform.</p>
          </div>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="transition-all hover:shadow-elevated">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">{feature.icon}</div>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card py-20">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold">Why Choose MediVault?</h2>
              <p className="mt-4 text-muted-foreground">Reduce medicine waste and improve medication adherence across the healthcare ecosystem.</p>
              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-safe" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild><Link to="/register">Start Tracking Now</Link></Button>
              </div>
            </div>
            <div className="relative">
              <Card className="overflow-hidden shadow-elevated">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 border-b border-border pb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Medicine Waste Reduction</p>
                      <p className="text-xs text-muted-foreground">Impact Metric</p>
                    </div>
                  </div>
                  <div className="py-8 text-center">
                    <p className="text-5xl font-bold text-safe">Track</p>
                    <p className="mt-2 text-muted-foreground">Your Medicines & Save from Expiry</p>
                  </div>
                  <p className="text-center text-sm text-muted-foreground">Sign up to start making a real healthcare impact</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <Card className="overflow-hidden bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
              <p className="mx-auto mt-4 max-w-xl opacity-90">Join MediVault today and take control of your healthcare journey.</p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" variant="secondary" asChild><Link to="/register">Create Free Account</Link></Button>
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t border-border bg-card py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold">MediVault</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2025 MediVault. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
