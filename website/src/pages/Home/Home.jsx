import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Users, TrendingUp, Boxes, ShieldCheck, Zap,
  MapPin, CalendarCheck, FileSpreadsheet, Wallet, FileText,
  BarChart3, ShieldAlert, Globe, Rocket, CheckCircle2, Play
} from 'lucide-react';
import { siteConfig } from '../../config/site';
import ThreeDCard from '../../components/common/ThreeDCard';
import MotionSection from '../../components/common/MotionSection';

const features = [
  {
    title: 'Live Tracking',
    desc: 'Background GPS pings with 30/60/120 min intervals, route playback, and heatmaps.',
    icon: MapPin,
    color: 'text-blue-600 bg-blue-50'
  },
  {
    title: 'GPS Attendance',
    desc: 'Verify check-ins with geofencing, device info logging, and monthly automated summaries.',
    icon: CalendarCheck,
    color: 'text-emerald-600 bg-emerald-50'
  },
  {
    title: 'Leave Management',
    desc: 'Digitalized paid, sick, and unpaid leave workflows with real-time balance tracking.',
    icon: FileSpreadsheet,
    color: 'text-rose-600 bg-rose-50'
  },
  {
    title: 'Sales Tracker',
    desc: 'Monitor field submissions, set monthly targets, and analyze performance by product.',
    icon: TrendingUp,
    color: 'text-amber-600 bg-amber-50'
  },
  {
    title: 'Inventory & Vendors',
    desc: 'Manage SKUs, per-tenant stock movements, and suppliers in one synchronized ledger.',
    icon: Boxes,
    color: 'text-indigo-600 bg-indigo-50'
  },
  {
    title: 'Automated Payroll',
    desc: 'Auto-generate salary from attendance with automated allowance and deduction logic.',
    icon: Wallet,
    color: 'text-sky-600 bg-sky-50'
  },
  {
    title: 'Real-time Pulse',
    desc: 'Socket.io powered dashboards for live maps, activity feeds, and instant notifications.',
    icon: Zap,
    color: 'text-purple-600 bg-purple-50'
  },
  {
    title: 'Deep Analytics',
    desc: 'Export high-fidelity Excel and PDF reports for attendance, sales, and financial audits.',
    icon: BarChart3,
    color: 'text-slate-600 bg-slate-50'
  }
];

const steps = [
  { step: '01', title: 'Onboard Company', desc: 'Set up your multi-tenant workspace and organization structure.' },
  { step: '02', title: 'Deploy Field Staff', desc: 'Assign packages, devices, and tracking intervals for your team.' },
  { step: '03', title: 'Monitor Real-time', desc: 'Watch your operations unfold on live maps and data dashboards.' },
  { step: '04', title: 'Automate Reports', desc: 'Auto-generate payroll, sales insights, and performance audits.' }
];

export default function Home() {
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);

  return (
    <div className="bg-brand-bg selection:bg-brand-accent selection:text-white overflow-x-hidden">

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-mesh">
        <div className="section-container relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200 shadow-sm mb-8">
               <span className="flex h-2 w-2 rounded-full bg-brand-accent animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">The Operations Brain for Business</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-brand-dark tracking-tighter leading-[0.9] mb-8">
              Field Teams.<br />
              <span className="text-gradient">Fully Optimized.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-500 font-medium mb-12 leading-relaxed">
              Business Sarthi is the cloud-native engine for tracking attendance, location, and operations. Move beyond spreadsheets to a connected SaaS ecosystem.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
               <a href={siteConfig.links.register} className="btn btn-primary px-10 py-5 text-sm">
                  Get Started Free
               </a>
               <button className="btn btn-outline px-10 py-5 text-sm gap-2">
                  <Play className="h-4 w-4 fill-current" /> Watch Demo
               </button>
            </div>

            <div className="mt-16 flex items-center gap-8 grayscale opacity-50">
               <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Trusted Architecture</p>
               <div className="flex gap-8 items-center">
                  <ShieldCheck className="h-5 w-5" />
                  <Globe className="h-5 w-5" />
                  <Zap className="h-5 w-5" />
               </div>
            </div>
          </motion.div>

          <div className="relative h-[600px] hidden lg:block perspective-1000">
             {/* 3D Floating Panels Illustration */}
             <motion.div
                animate={{
                  y: [0, -20, 0],
                  rotateY: [10, 15, 10],
                  rotateX: [5, 0, 5]
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-20 right-0 w-[450px] h-[350px] glass-card p-4 preserve-3d"
             >
                <div className="w-full h-full rounded-2xl bg-slate-900 overflow-hidden shadow-2xl relative">
                   <div className="absolute inset-0 bg-grid opacity-20" />
                   <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex gap-2">
                         <div className="h-2 w-2 rounded-full bg-red-500/50" />
                         <div className="h-2 w-2 rounded-full bg-yellow-500/50" />
                         <div className="h-2 w-2 rounded-full bg-green-500/50" />
                      </div>
                      <div className="h-4 w-24 bg-white/10 rounded-full" />
                   </div>
                   <div className="p-4 space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                         {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 border border-white/5" />)}
                      </div>
                      <div className="h-32 rounded-xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
                         <BarChart3 className="h-8 w-8 text-brand-accent animate-pulse" />
                      </div>
                   </div>
                </div>
             </motion.div>

             <motion.div
                animate={{
                  y: [20, 40, 20],
                  rotateY: [-10, -5, -10],
                  rotateX: [-5, 0, -5]
                }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-10 right-20 w-[300px] h-[400px] glass-card p-3 preserve-3d z-20"
             >
                <div className="w-full h-full rounded-3xl bg-white shadow-xl overflow-hidden flex flex-col">
                   <div className="h-12 bg-slate-50 border-b flex items-center px-4">
                      <div className="h-5 w-5 rounded-full bg-brand-accent/20" />
                   </div>
                   <div className="p-4 flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center"><Users className="h-5 w-5" /></div>
                         <div className="flex-1 space-y-2"><div className="h-2 w-2/3 bg-slate-100 rounded-full"/><div className="h-2 w-1/3 bg-slate-50 rounded-full"/></div>
                      </div>
                      <div className="space-y-2 pt-4">
                         {[1,2,3,4].map(i => (
                           <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50">
                              <div className="h-2 w-20 bg-slate-100 rounded-full" />
                              <div className="h-2 w-8 bg-brand-accent/20 rounded-full" />
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="p-4 bg-brand-accent text-white text-center font-black text-[10px] uppercase tracking-widest">Submit Task</div>
                </div>
             </motion.div>
          </div>
        </div>

        {/* Backdrop Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-[120px] -z-10" />
      </section>

      {/* Trust Bar */}
      <section className="py-12 border-y border-slate-100 bg-white">
        <div className="section-container flex flex-wrap justify-center md:justify-between items-center gap-12">
           <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-brand-accent" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Bank-Grade Security</span>
           </div>
           <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">52/52 Endpoints Verified</span>
           </div>
           <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-brand-accent" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Real-time Deployment</span>
           </div>
           <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-slate-400" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Multi-Tenant Architecture</span>
           </div>
        </div>
      </section>

      {/* The Portals */}
      <MotionSection className="py-32 bg-white">
        <div className="section-container">
           <div className="text-center max-w-3xl mx-auto mb-24">
              <h2 className="text-4xl md:text-6xl font-black text-brand-dark tracking-tighter mb-6 uppercase italic">The Unified Platform</h2>
              <p className="text-xl text-slate-500 font-medium">Three distinct interfaces designed for every level of your organization.</p>
           </div>
           <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: 'Super Admin', desc: 'Platform-level control to manage companies, packages, and support infrastructure.', icon: ShieldAlert, border: 'border-slate-100' },
                { title: 'Company Panel', desc: 'Command center for business owners to run operations, sales, and payroll.', icon: BarChart3, border: 'border-brand-accent/20 bg-brand-accent/[0.02]' },
                { title: 'Staff App', desc: 'Mobile-first PWA for field employees to submit sales, tracking, and attendance.', icon: Rocket, border: 'border-slate-100' },
              ].map((portal, i) => (
                <ThreeDCard key={i} intensity={10}>
                   <div className={`p-10 rounded-[3rem] border ${portal.border} transition-all duration-500 hover:shadow-premium group`}>
                      <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 group-hover:bg-brand-accent group-hover:text-white transition-all duration-500">
                         <portal.icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-2xl font-black text-brand-dark mb-4 uppercase tracking-tight italic">{portal.title}</h3>
                      <p className="text-slate-500 font-medium leading-relaxed">{portal.desc}</p>
                   </div>
                </ThreeDCard>
              ))}
           </div>
        </div>
      </MotionSection>

      {/* Feature Grid */}
      <section id="features" className="py-32 bg-brand-bg relative">
        <div className="section-container relative z-10">
           <div className="flex flex-col lg:flex-row items-end justify-between gap-12 mb-32">
              <div className="max-w-2xl">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent mb-6">Core Capabilities</p>
                 <h2 className="text-4xl md:text-7xl font-black text-brand-dark tracking-tighter leading-none uppercase italic">Precision Tracking.<br /><span className="text-slate-200 not-italic">Intelligent Growth.</span></h2>
              </div>
              <p className="text-xl text-slate-500 font-medium max-w-sm mb-4 border-l-4 border-brand-accent pl-6">
                Everything you need to digitalize field operations without the spreadsheet friction.
              </p>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-8 rounded-[2.5rem] bg-white border border-slate-100 hover:border-brand-accent/30 transition-all duration-500 shadow-sm hover:shadow-premium group"
                >
                   <div className={`h-14 w-14 rounded-2xl ${f.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                      <f.icon className="h-7 w-7" />
                   </div>
                   <h3 className="text-xl font-black text-brand-dark mb-3 uppercase tracking-tight">{f.title}</h3>
                   <p className="text-slate-500 text-sm font-medium leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* Dashboard Showcase */}
      <MotionSection className="py-32 bg-brand-dark text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
        <div className="section-container relative z-10">
           <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                 <h2 className="text-4xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-10 uppercase italic">Your Entire<br /><span className="text-brand-accent">Fleet, Visualized.</span></h2>
                 <p className="text-xl text-slate-400 font-medium mb-12 leading-relaxed">
                    Access a high-frequency real-time map that synchronizes background GPS data even while your team is offline. Complete route playback and movement analysis at your fingertips.
                 </p>
                 <div className="space-y-6">
                    {[
                      { l: 'Live Staff Active', v: '42', c: 'text-brand-accent' },
                      { l: 'Daily On-Time %', v: '96.4%', c: 'text-emerald-400' },
                      { l: 'Pending Clearances', v: '03', c: 'text-rose-400' },
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors">
                         <div className={`text-4xl font-black ${stat.c} tracking-tighter`}>{stat.v}</div>
                         <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{stat.l}</div>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="relative">
                 <div className="absolute inset-0 bg-brand-accent/20 blur-[150px] -z-10" />
                 <ThreeDCard intensity={5}>
                    <div className="glass-card p-4 border-white/10 bg-slate-900/80 shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                       <div className="aspect-[4/3] rounded-2xl bg-slate-800 overflow-hidden relative border border-white/5">
                          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2266&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale group-hover:grayscale-0 transition-all duration-1000" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                          {/* Pulsing Map Dots */}
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                             <div className="h-4 w-4 bg-brand-accent rounded-full animate-ping opacity-75" />
                             <div className="h-4 w-4 bg-brand-accent rounded-full absolute top-0" />
                          </div>
                          <div className="absolute top-1/4 right-1/4">
                             <div className="h-3 w-3 bg-emerald-400 rounded-full animate-ping opacity-75 [animation-delay:1s]" />
                             <div className="h-3 w-3 bg-emerald-400 rounded-full absolute top-0" />
                          </div>

                          <div className="absolute bottom-6 left-6 right-6 p-4 glass rounded-xl flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-brand-accent flex items-center justify-center text-[10px] font-black">LS</div>
                                <div className="space-y-1"><div className="h-2 w-16 bg-white/20 rounded-full"/><div className="h-1.5 w-8 bg-white/10 rounded-full"/></div>
                             </div>
                             <div className="text-[10px] font-black text-brand-accent tracking-widest">TRACKING ACTIVE</div>
                          </div>
                       </div>
                    </div>
                 </ThreeDCard>
              </div>
           </div>
        </div>
      </MotionSection>

      {/* How it Works */}
      <section className="py-32 bg-white relative">
        <div className="section-container">
           <div className="text-center max-w-3xl mx-auto mb-32">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent mb-6">Execution Path</p>
              <h2 className="text-4xl md:text-7xl font-black text-brand-dark tracking-tighter uppercase italic leading-none">The Path to <br /><span className="text-slate-200 not-italic">Automation.</span></h2>
           </div>
           <div className="grid md:grid-cols-4 gap-12 relative">
              {/* Connecting Line */}
              <div className="absolute top-12 left-0 w-full h-0.5 bg-slate-50 hidden md:block" />
              {steps.map((s, i) => (
                <div key={i} className="relative z-10 space-y-8 group">
                   <div className="h-24 w-24 rounded-[2rem] bg-white border-2 border-slate-100 flex items-center justify-center text-3xl font-black text-slate-200 group-hover:border-brand-accent group-hover:text-brand-accent transition-all duration-500 group-hover:scale-110 shadow-sm">
                      {s.step}
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">{s.title}</h3>
                      <p className="text-slate-500 font-medium text-sm leading-relaxed">{s.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 bg-brand-bg relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-mesh opacity-50 -z-10" />
        <div className="section-container relative z-10">
           <div className="text-center max-w-3xl mx-auto mb-24">
              <h2 className="text-4xl md:text-6xl font-black text-brand-dark tracking-tighter mb-6 uppercase italic">Platform Tiers</h2>
              <p className="text-xl text-slate-500 font-medium">Select the deployment scale that fits your organization.</p>
           </div>
           <div className="grid lg:grid-cols-3 gap-8 items-start">
              {[
                { name: 'Starter', price: '9', l: 'Ideal for teams under 10 members.', f: ['Up to 10 Employees', 'GPS Attendance', 'Basic Dashboard', 'Email Support'] },
                { name: 'Growth', price: '29', l: 'The engine for scaling field teams.', f: ['Up to 50 Employees', 'Live Location Tracking', 'Inventory & Sales', 'Priority Support'], popular: true },
                { name: 'Enterprise', price: '59', l: 'Custom limits and advanced analytics.', f: ['500+ Employees', 'Advanced API Access', 'Custom Exports', 'Account Manager'] },
              ].map((tier, i) => (
                <ThreeDCard key={i} intensity={tier.popular ? 15 : 5}>
                   <div className={`p-12 rounded-[4rem] border transition-all duration-700 h-full flex flex-col group ${
                      tier.popular ? 'bg-brand-dark text-white border-brand-accent shadow-accent scale-105 z-10' : 'bg-white text-brand-dark border-slate-100 hover:border-brand-accent/20'
                   }`}>
                      {tier.popular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-accent px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Most Deployed</div>}
                      <h3 className="text-3xl font-black uppercase tracking-tighter italic mb-4">{tier.name}</h3>
                      <p className={`text-sm font-medium mb-12 ${tier.popular ? 'text-slate-400' : 'text-slate-400'}`}>{tier.l}</p>
                      <div className="flex items-baseline gap-2 mb-12">
                         <span className="text-sm font-black uppercase tracking-widest opacity-50">$</span>
                         <span className="text-7xl font-black tracking-tighter leading-none">{tier.price}</span>
                         <span className="text-sm font-black uppercase tracking-widest opacity-50">/mo</span>
                      </div>
                      <a href={siteConfig.links.register} className={`w-full py-6 rounded-3xl mb-12 text-xs font-black uppercase tracking-[0.2em] text-center transition-all ${
                         tier.popular ? 'bg-brand-accent text-white hover:bg-brand-accent/80' : 'bg-slate-900 text-white hover:bg-brand-accent'
                      }`}>Select Plan</a>
                      <div className="space-y-6 flex-1">
                         {tier.f.map((feat, j) => (
                           <div key={j} className="flex items-center gap-4 group/feat">
                              <CheckCircle2 className={`h-5 w-5 shrink-0 ${tier.popular ? 'text-brand-accent' : 'text-slate-200 group-hover/feat:text-brand-accent'} transition-colors`} />
                              <span className={`text-sm font-bold tracking-tight ${tier.popular ? 'text-slate-300' : 'text-slate-600'}`}>{feat}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </ThreeDCard>
              ))}
           </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-60 bg-white relative overflow-hidden">
        <div className="section-container relative z-10 text-center max-w-5xl">
           <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             whileInView={{ scale: 1, opacity: 1 }}
             transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
           >
              <h2 className="text-6xl md:text-9xl font-black text-brand-dark tracking-tighter leading-none mb-12 uppercase italic">Deploy<br /><span className="text-gradient">Intelligence.</span></h2>
              <p className="text-2xl md:text-4xl text-slate-400 font-medium max-w-3xl mx-auto mb-16 tracking-tight">Stop fighting manual friction. Start running your business with absolute precision.</p>
              <a href={siteConfig.links.register} className="btn btn-primary px-16 py-8 text-lg rounded-[3rem] shadow-accent">
                 Get Started Now
              </a>
           </motion.div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 border-2 border-brand-accent/10 rounded-full -ml-32 blur-2xl" />
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 border-2 border-brand-accent/10 rounded-full -mr-32 blur-2xl" />
      </section>

      {/* Simple Professional Footer */}
      <footer className="py-20 bg-brand-bg border-t border-slate-100">
        <div className="section-container">
           <div className="grid lg:grid-cols-12 gap-20 mb-24">
              <div className="lg:col-span-4 space-y-10">
                 <div className="flex flex-col -gap-1">
                    <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">Business<span className="text-brand-accent">Sarthi</span></span>
                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300 mt-2">The Operations Brain</span>
                 </div>
                 <p className="text-slate-400 font-medium leading-relaxed">Modern SaaS infrastructure for field operations management, attendance, and payroll automation.</p>
              </div>
              <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-12">
                 {[
                   { t: 'Platform', l: ['Features', 'Solutions', 'Security', 'FAQ'] },
                   { t: 'Operations', l: ['GPS Tracking', 'Attendance', 'Payroll', 'Inventory'] },
                   { t: 'Company', l: ['About Us', 'Contact', 'Terms', 'Privacy'] },
                   { t: 'Deploy', l: ['Login', 'Register', 'Partner', 'Book Demo'] },
                 ].map((col, i) => (
                   <div key={i} className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">{col.t}</h4>
                      <ul className="space-y-4">
                         {col.l.map(link => (
                           <li key={link}><a href="#" className="text-sm font-bold text-slate-600 hover:text-brand-accent transition-colors">{link}</a></li>
                         ))}
                      </ul>
                   </div>
                 ))}
              </div>
           </div>
           <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">© 2026 Business Sarthi. Deployment Successful.</span>
              <div className="flex gap-12">
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 cursor-pointer hover:text-brand-dark transition-colors italic decoration-brand-accent decoration-2 underline-offset-4 underline">NEP</span>
                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 cursor-pointer hover:text-brand-dark transition-colors italic">ENG</span>
              </div>
           </div>
        </div>
      </footer>

    </div>
  );
}
