import { Check } from 'lucide-react';

const showcases = [
  {
    title: 'Advanced Workforce Management',
    desc: 'Manage your entire team from one place. From basic profiles to complex hierarchy and role-based access control, Business Sarthi gives you total control.',
    points: ['Employee profile management', 'Department-wise organization', 'Role-based permissions'],
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=2070',
    reverse: false,
  },
  {
    title: 'Real-time GPS Tracking',
    desc: 'Stop wondering where your field staff is. Get live updates, view route history, and analyze movement patterns to optimize field operations.',
    points: ['Live map view', 'Route playback history', 'Geofenced check-ins'],
    image: 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=2070',
    reverse: true,
  },
  {
    title: 'Precision Sales Monitoring',
    desc: 'Monitor sales targets and achievements as they happen. Empower your sales team with a mobile-first entry system and managers with deep analytics.',
    points: ['Instant sales submission', 'Target vs Achievement', 'Product-wise analytics'],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426',
    reverse: false,
  },
];

export default function FeatureShowcase() {
  return (
    <section className="py-24 overflow-hidden">
      <div className="section-container space-y-32">
        {showcases.map((s, idx) => (
          <div key={s.title} className={`flex flex-col lg:flex-row items-center gap-16 ${s.reverse ? 'lg:flex-row-reverse' : ''}`}>
            <div className="flex-1 w-full">
              <div className="relative group">
                 <div className="absolute inset-0 bg-primary-600 rounded-2xl transform translate-x-4 translate-y-4 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-300" />
                 <img
                   src={s.image}
                   alt={s.title}
                   className="rounded-2xl shadow-xl w-full aspect-video object-cover"
                 />
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-3xl font-bold text-slate-900 mb-6">{s.title}</h3>
              <p className="lead mb-8 text-lg">{s.desc}</p>
              <ul className="space-y-4">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="text-slate-700 font-medium">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
