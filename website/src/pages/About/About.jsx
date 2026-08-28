import { siteConfig } from '../../config/site';

const values = [
  { title: 'Simple', desc: 'Powerful software should be easy to use. We build tools that require zero learning curve.' },
  { title: 'Smart', desc: 'Automated insights and intelligence that help you make better business decisions.' },
  { title: 'Connected', desc: 'Breaking silos between field staff, managers, and office operations.' },
  { title: 'Scalable', desc: 'Designed to grow with your business, from 5 employees to 5,000.' },
];

export default function About() {
  return (
    <div className="pt-20">
      {/* Header */}
      <section className="bg-slate-50 py-24">
        <div className="section-container text-center max-w-3xl">
          <h1 className="text-4xl font-extrabold text-slate-900 sm:text-5xl mb-6">
            Empowering businesses through <span className="text-primary-600">intelligence</span>
          </h1>
          <p className="lead text-lg">
            Business Sarthi was founded with a single mission: to simplify complex business operations
            through modern, cloud-based technology.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-slate-600 text-lg mb-6 leading-relaxed">
                We believe that running a business should be about strategy and growth, not managing
                repetitive manual tasks and fighting with spreadsheets.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed">
                Business Sarthi provides a unified platform that connects every part of your
                organization — from field staff tracking to payroll management — giving you the
                visibility and control you need to succeed in a data-driven world.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl">
               <img
                 src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=2070"
                 alt="Our Team"
               />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="section-container">
           <h2 className="text-3xl font-bold text-center mb-16">Why {siteConfig.name}?</h2>
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
             {values.map(v => (
               <div key={v.title} className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary-500 transition-colors group">
                 <h3 className="text-xl font-bold mb-4 group-hover:text-primary-400">{v.title}</h3>
                 <p className="text-slate-400 text-sm leading-relaxed">{v.desc}</p>
               </div>
             ))}
           </div>
        </div>
      </section>
    </div>
  );
}
