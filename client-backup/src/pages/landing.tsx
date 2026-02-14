import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import {
  ArrowRight,
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  Zap,
  Shield,
  Globe,
  Check,
  ChevronDown,
} from "lucide-react";
import heroImage from "../assets/images/hero-landing.png";
import featureDashboard from "../assets/images/feature-dashboard.png";
import featureInbox from "../assets/images/feature-inbox.png";
import featureCalendar from "../assets/images/feature-calendar.png";

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: "Unified Dashboard",
    description: "See all your bookings, messages, and property stats across every channel in one clean view.",
    image: featureDashboard,
  },
  {
    icon: MessageSquare,
    title: "Smart Inbox",
    description: "Respond to guests from Airbnb, Booking.com, and more without switching apps.",
    image: featureInbox,
  },
  {
    icon: CalendarDays,
    title: "Synced Calendar",
    description: "Block dates, prevent double-bookings, and manage availability across all channels instantly.",
    image: featureCalendar,
  },
];

const BENEFITS = [
  { icon: Globe, title: "Multi-Channel Sync", description: "Airbnb, Booking.com, Expedia, TripAdvisor connected in one place" },
  { icon: Zap, title: "Automated Messages", description: "Auto check-in instructions, welcome messages, and follow-ups" },
  { icon: Shield, title: "Double-Booking Protection", description: "Real-time calendar sync prevents overlapping reservations" },
];

const PLANS = [
  {
    key: "light",
    name: "Light",
    price: "Free",
    period: "",
    units: "1 unit",
    description: "Perfect for getting started",
    features: [
      "1 rental unit",
      "All channel connections",
      "Unified inbox",
      "Calendar sync",
      "Basic automation",
    ],
    popular: false,
  },
  {
    key: "growth",
    name: "Growth",
    price: "$19",
    period: "/mo",
    units: "Up to 5 units",
    description: "For growing hosts",
    features: [
      "Up to 5 rental units",
      "All channel connections",
      "Unified inbox",
      "Calendar sync",
      "Advanced automation",
      "Priority support",
      "Cleaning workflows",
    ],
    popular: true,
  },
  {
    key: "expanding",
    name: "Expanding",
    price: "$39",
    period: "/mo",
    units: "Up to 15 units",
    description: "For professional hosts",
    features: [
      "Up to 15 rental units",
      "All channel connections",
      "Unified inbox",
      "Calendar sync",
      "Full automation suite",
      "Priority support",
      "Cleaning workflows",
      "Maintenance tracking",
      "Team access",
    ],
    popular: false,
  },
];

export default function LandingPage() {
  useEffect(() => {
    document.documentElement.classList.add("landing-mode");
    return () => {
      document.documentElement.classList.remove("landing-mode");
    };
  }, []);

  const pricingRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="landing-page">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50" data-testid="nav-bar">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-primary" data-testid="text-logo">Hoster</h1>
          <div className="hidden sm:flex items-center gap-4">
            <button onClick={() => scrollTo(featuresRef)} className="text-sm font-medium text-muted-foreground transition-colors" data-testid="link-nav-features">Features</button>
            <button onClick={() => scrollTo(pricingRef)} className="text-sm font-medium text-muted-foreground transition-colors" data-testid="link-nav-pricing">Pricing</button>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" data-testid="button-nav-login">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" data-testid="button-nav-signup">Sign up</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-14 overflow-hidden" data-testid="section-hero">
        <div className="relative h-[85vh] min-h-[560px] max-h-[800px]">
          <img src={heroImage} alt="Beautiful vacation properties" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
            <div className="max-w-2xl">
              <p className="text-sm sm:text-base font-semibold text-white/80 mb-3 tracking-wide uppercase" data-testid="text-hero-subtitle">Short-Term Rental Management</p>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight" data-testid="text-hero-title">
                All your channels.{" "}
                <span className="text-primary">One calm dashboard.</span>
              </h2>
              <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
                Manage Airbnb, Booking.com, Expedia & TripAdvisor from a single app.
                Sync calendars, unify messages, automate check-ins.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup">
                  <Button size="lg" className="px-8 text-base font-bold" data-testid="button-hero-signup">
                    Get started free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" onClick={() => scrollTo(featuresRef)} className="px-8 text-base font-bold bg-white/10 backdrop-blur-sm border-white/30 text-white" data-testid="button-hero-features">
                  See how it works
                </Button>
              </div>
              <p className="mt-4 text-xs text-white/50">No credit card required. Free plan available.</p>
            </div>
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce">
            <ChevronDown className="h-6 w-6 text-white/50" />
          </div>
        </div>
      </section>

      <section className="py-10 bg-muted/50 border-b border-border/50 overflow-hidden">
        <div className="text-center mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Works with your favorite platforms</p>
        </div>
        <div className="relative">
          <div className="flex animate-marquee whitespace-nowrap gap-10 sm:gap-16">
            {[...Array(3)].flatMap((_, groupIdx) =>
              ["Airbnb", "Booking.com", "Expedia", "TripAdvisor"].map((name, i) => (
                <span
                  key={`${groupIdx}-${i}`}
                  className="text-sm sm:text-base font-bold text-muted-foreground/70 inline-block"
                  data-testid={groupIdx === 0 ? `text-channel-${name.toLowerCase().replace(".", "")}` : undefined}
                >
                  {name}
                </span>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {BENEFITS.map((b) => (
              <div key={b.title} className="text-center" data-testid={`benefit-${b.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-base mb-1.5">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={featuresRef} className="py-16 sm:py-24 bg-muted/30" data-testid="section-features">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Features</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Everything you need to host smarter</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">Powerful tools designed for solo hosts who manage properties across multiple booking platforms.</p>
          </div>
          <div className="space-y-20">
            {FEATURES.map((f, i) => (
              <div key={f.title} className={`flex flex-col ${i % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-8 md:gap-12`} data-testid={`feature-${i}`}>
                <div className="flex-1 max-w-md">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
                <div className="flex-1 w-full max-w-lg">
                  <img src={f.image} alt={f.title} className="w-full rounded-md shadow-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section ref={pricingRef} className="py-16 sm:py-24 bg-muted/30" data-testid="section-pricing">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Pricing</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-3 text-muted-foreground max-w-lg mx-auto">Start free and scale as you grow. No commissions, no hidden fees. Just a flat monthly subscription.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <Card
                key={plan.key}
                className={`relative ${plan.popular ? "border-primary border-2 shadow-lg" : ""}`}
                data-testid={`card-plan-${plan.key}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-6 sm:p-8">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                  <div className="mt-4 mb-6">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-4">{plan.units}</p>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup">
                    <Button
                      variant={plan.popular ? "default" : "outline"}
                      className="w-full"
                      data-testid={`button-plan-${plan.key}`}
                    >
                      {plan.price === "Free" ? "Start free" : "Get started"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-muted/50 border-t border-border py-10" data-testid="footer">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-primary">Hoster</h3>
              <p className="text-xs text-muted-foreground mt-1">Multi-channel rental management, simplified.</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <button onClick={() => scrollTo(featuresRef)} className="transition-colors" data-testid="link-footer-features">Features</button>
              <button onClick={() => scrollTo(pricingRef)} className="transition-colors" data-testid="link-footer-pricing">Pricing</button>
              <Link href="/login" className="transition-colors" data-testid="link-footer-login">Log in</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">Hoster. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
