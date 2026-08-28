import {
  Users, CalendarCheck, MapPin, TrendingUp,
  Boxes, FileSpreadsheet, Wallet, BarChart3,
  Bell, ShieldAlert, Globe2, Sparkles
} from 'lucide-react';

const features = [
  {
    title: 'Employee Management',
    desc: 'Centralized directory for roles, profiles, and hierarchy.',
    icon: Users,
  },
  {
    title: 'Attendance Tracking',
    desc: 'GPS-verified check-ins, working hours, and history.',
    icon: CalendarCheck,
  },
  {
    title: 'Live Location Tracking',
    desc: 'Real-time staff movement, route playback, and heatmaps.',
    icon: MapPin,
  },
  {
    title: 'Sales Performance',
    desc: 'Track submissions, targets, and field activity real-time.',
    icon: TrendingUp,
  },
  {
    title: 'Inventory & Stock',
    desc: 'Manage SKUs, stock levels, and distributor movements.',
    icon: Boxes,
  },
  {
    title: 'Leave Management',
    desc: 'Full workflow for leave applications and approvals.',
    icon: FileSpreadsheet,
  },
  {
    title: 'Payroll Automation',
    desc: 'Auto-generate salary slips from attendance data.',
    icon: Wallet,
  },
  {
    title: 'Deep Analytics',
    desc: 'Comprehensive reports on every aspect of business.',
    icon: BarChart3,
  },
  {
    title: 'Smart Notifications',
    desc: 'Keep everyone informed with automated alerts.',
    icon: Bell,
  },
  {
    title: 'Audit Logs',
    desc: 'Maintain full transparency with activity records.',
    icon: ShieldAlert,
  },
  {
    title: 'Multi-tenant Setup',
    desc: 'Isolated, secure environments for each company.',
    icon: Globe2,
  },
  {
    title: 'Modern UI/UX',
    desc: 'Beautifully designed dashboard for effortless use.',
    icon: Sparkles,
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="h2 mb-4 text-primary-600">Powerful Features</h2>
          <p className="lead">
            Every tool you need to streamline operations, empower your team, and accelerate growth.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center mb-5 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
