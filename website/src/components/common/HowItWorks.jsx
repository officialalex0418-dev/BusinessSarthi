const steps = [
  {
    num: '01',
    title: 'Create Your Business',
    desc: 'Register your company and set up your workspace in minutes.',
  },
  {
    num: '02',
    title: 'Add Your Team',
    desc: 'Invite employees, assign roles, and set departments.',
  },
  {
    num: '03',
    title: 'Manage Operations',
    desc: 'Track attendance, sales, and inventory effortlessly.',
  },
  {
    num: '04',
    title: 'Track & Grow',
    desc: 'Use real-time data to optimize performance and scale.',
  },
];

export default function HowItWorks() {
  return (
    <section className="py-24 bg-slate-900 text-white">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold sm:text-4xl mb-4">How Business Sarthi Works</h2>
          <p className="text-slate-400 text-lg">
            A simple, streamlined process to digitalize your business management.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="relative p-6 bg-slate-800/50 rounded-2xl border border-slate-700 hover:border-primary-500 transition-colors group">
              <span className="text-4xl font-black text-slate-700 mb-4 block group-hover:text-primary-500 transition-colors">
                {s.num}
              </span>
              <h3 className="text-xl font-bold mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>

              {/* Connector line for desktop */}
              {s.num !== '04' && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-[2px] bg-slate-700 -z-10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
