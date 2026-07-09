import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RefreshCw, Shield, Users, Zap, Star, MapPin, ChevronRight, Smartphone, Camera, Heart } from "lucide-react";
import heroMockup from "@/assets/hero-mockup.png";
import { getToken } from "@/lib/api";

const CATEGORIES = [
  { icon: "📱", label: "Electronics", count: "2.3k" },
  { icon: "👕", label: "Clothing", count: "4.1k" },
  { icon: "📚", label: "Books", count: "1.8k" },
  { icon: "🏠", label: "Home & Kitchen", count: "3.2k" },
  { icon: "🎮", label: "Toys & Games", count: "1.5k" },
  { icon: "🌱", label: "Plants", count: "890" },
];

const STATS = [
  { value: "12,500+", label: "Items Traded" },
  { value: "8,200+", label: "Active Traders" },
  { value: "45+", label: "Cities" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: <Camera className="w-7 h-7" />,
    title: "Upload Your Item",
    description: "Snap a photo, tag your item, and set your trade preferences in seconds.",
  },
  {
    step: "02",
    icon: <RefreshCw className="w-7 h-7" />,
    title: "Swipe to Browse",
    description: "Browse items near you. Swipe right for what you want, left to pass.",
  },
  {
    step: "03",
    icon: <Heart className="w-7 h-7" />,
    title: "Match & Trade",
    description: "When it's mutual, chat and arrange the swap. No money involved.",
  },
];

const TESTIMONIALS = [
  {
    name: "Maria Santos",
    location: "Quezon City, PH",
    rating: 5,
    text: "Traded my old textbooks for a barely-used blender. This is how shopping should work!",
    avatar: "👩‍🦱",
  },
  {
    name: "Budi Santoso",
    location: "Jakarta, ID",
    rating: 5,
    text: "Got my kid's school supplies swapped for some garden tools I wasn't using. Amazing community.",
    avatar: "👨‍🦳",
  },
  {
    name: "Thuy Nguyen",
    location: "Ho Chi Minh City, VN",
    rating: 5,
    text: "The swipe interface is so addictive! Found a vintage camera in exchange for my art prints.",
    avatar: "👩",
  },
];

const FEATURED_ITEMS = [
  { emoji: "📱", name: "iPhone 12 Pro", condition: "Like New", trader: "Alex M.", rating: 4.9, wants: "Gaming Setup" },
  { emoji: "🎸", name: "Acoustic Guitar", condition: "Good", trader: "Sarah K.", rating: 4.7, wants: "Art Supplies" },
  { emoji: "👟", name: "Nike Air Max 90", condition: "Gently Used", trader: "Jun R.", rating: 5.0, wants: "Books" },
  { emoji: "📷", name: "Canon DSLR", condition: "Like New", trader: "Priya S.", rating: 4.8, wants: "Clothes" },
];

export default function Homepage() {
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const goToApp = () => navigate(getToken() ? "/swipe" : "/login");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 glass">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-black text-primary-foreground">
            P
          </div>
          <span className="font-black text-lg tracking-tight">PeekPick</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
          <a href="#categories" className="hover:text-foreground transition-colors">Categories</a>
          <a href="#community" className="hover:text-foreground transition-colors">Community</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/login")}
            className="hidden md:block text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={goToApp}
            className="bg-primary text-primary-foreground text-sm font-bold px-5 py-2 rounded-full hover:bg-primary-glow transition-all duration-200 shadow-green hover:scale-105"
          >
            Start Trading
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/3 blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-surface-elevated border border-primary/30 rounded-full px-4 py-2 mb-8 animate-fade-slide-up">
            <span className="w-2 h-2 rounded-full bg-primary pulse-green" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Now Live Across Southeast Asia</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-6 animate-fade-slide-up" style={{ animationDelay: "0.1s" }}>
            Turn what you{" "}
            <span className="gradient-text">don't need</span>
            <br />
            into what you{" "}
            <span className="text-foreground">do.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 font-medium leading-relaxed animate-fade-slide-up" style={{ animationDelay: "0.2s" }}>
            No money. Just swap. The circular economy marketplace built for Southeast Asia's communities.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-slide-up" style={{ animationDelay: "0.3s" }}>
            <button
              onClick={goToApp}
              className="group flex items-center gap-3 bg-primary text-primary-foreground font-bold text-lg px-8 py-4 rounded-full shadow-green hover:bg-primary-glow hover:scale-105 transition-all duration-200 w-full sm:w-auto justify-center"
            >
              Join the Beta
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/swipe")}
              className="flex items-center gap-3 bg-surface-elevated border border-border text-foreground font-bold text-lg px-8 py-4 rounded-full hover:border-primary/50 hover:bg-surface-hover transition-all duration-200 w-full sm:w-auto justify-center"
            >
              <Smartphone className="w-5 h-5" />
              Browse Items
            </button>
          </div>

          {/* Hero mockup */}
          <div className="animate-float">
            <img
              src={heroMockup}
              alt="PeekPick app interface showing swipe cards"
              className="w-full max-w-3xl mx-auto rounded-2xl shadow-card"
            />
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative z-10 w-full max-w-2xl mx-auto mt-12">
          <div className="grid grid-cols-3 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center bg-surface-elevated rounded-2xl p-4 border border-border">
                <div className="text-2xl md:text-3xl font-black gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">Simple Process</p>
            <h2 className="text-4xl md:text-5xl font-black">How PeekPick Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative group">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-primary/40 to-transparent z-10 translate-x-4" />
                )}
                <div className="bg-surface-elevated border border-border rounded-2xl p-8 hover:border-primary/40 transition-all duration-300 hover:shadow-green group-hover:translate-y-[-4px]">
                  <div className="text-xs font-black text-primary/50 mb-4 tracking-widest">{step.step}</div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 px-6 bg-surface border-y border-border">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          {[
            { icon: <Shield className="w-5 h-5" />, label: "Verified Traders" },
            { icon: <Star className="w-5 h-5" />, label: "5-Star Reviews" },
            { icon: <MapPin className="w-5 h-5" />, label: "Local Meetups" },
            { icon: <Users className="w-5 h-5" />, label: "Community-First" },
            { icon: <Zap className="w-5 h-5" />, label: "Instant Matching" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm font-medium">
              <span className="text-primary">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* Category Showcase */}
      <section id="categories" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">Browse by Category</p>
              <h2 className="text-4xl md:text-5xl font-black">What's Being Traded</h2>
            </div>
            <button
              onClick={() => navigate("/swipe")}
              className="hidden md:flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
            >
              Browse All <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Category pills */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-12">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => navigate("/swipe")}
                className="flex items-center gap-4 bg-surface-elevated hover:bg-surface-hover border border-border hover:border-primary/40 rounded-2xl p-5 text-left transition-all duration-200 group"
              >
                <span className="text-3xl">{cat.icon}</span>
                <div>
                  <div className="font-bold text-foreground group-hover:text-primary transition-colors">{cat.label}</div>
                  <div className="text-xs text-muted-foreground">{cat.count} items</div>
                </div>
              </button>
            ))}
          </div>

          {/* Featured item cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FEATURED_ITEMS.map((item) => (
              <div
                key={item.name}
                className="bg-surface-elevated border border-border rounded-2xl overflow-hidden hover:border-primary/40 transition-all duration-200 cursor-pointer group"
                onClick={() => navigate("/swipe")}
              >
                <div className="h-32 bg-gradient-to-br from-surface-hover to-surface flex items-center justify-center text-5xl">
                  {item.emoji}
                </div>
                <div className="p-4">
                  <div className="text-xs text-primary font-semibold mb-1">{item.condition}</div>
                  <div className="font-bold text-sm mb-2 group-hover:text-primary transition-colors">{item.name}</div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>⭐ {item.rating}</span>
                    <span className="text-primary/70">wants {item.wants}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="community" className="py-24 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-primary text-sm font-bold uppercase tracking-widest mb-3">Real Stories</p>
            <h2 className="text-4xl md:text-5xl font-black">Traders e PeekPick</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="bg-surface-elevated border border-border rounded-2xl p-6 hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground/90 leading-relaxed mb-6 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-xl">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {t.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="relative bg-surface-elevated border border-primary/20 rounded-3xl p-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="text-5xl mb-6">🔄</div>
              <h2 className="text-4xl md:text-5xl font-black mb-4">Ready to Trade?</h2>
              <p className="text-muted-foreground text-lg mb-8">
                Join thousands of traders across Southeast Asia exchanging goods, reducing waste, and building community.
              </p>
              <button
                onClick={goToApp}
                className="group inline-flex items-center gap-3 bg-primary text-primary-foreground font-bold text-xl px-10 py-5 rounded-full shadow-green hover:bg-primary-glow hover:scale-105 transition-all duration-200"
              >
                Start Trading Free
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-muted-foreground text-sm mt-4">No money. No fees. Just community.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-black text-primary-foreground">P</div>
                <span className="font-black text-lg">PeekPick</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">The circular economy marketplace for Southeast Asia.</p>
            </div>
            {[
              { title: "Product", links: ["How it Works", "Browse Items", "List an Item", "Pricing"] },
              { title: "Community", links: ["Blog", "Events", "Groups", "Guidelines"] },
              { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
            ].map((col) => (
              <div key={col.title}>
                <div className="font-bold text-sm mb-4">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-muted-foreground text-sm hover:text-primary transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025 PeekPick. Built for Southeast Asia 🌏</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms</a>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
