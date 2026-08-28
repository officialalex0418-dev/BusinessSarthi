import { XCircle } from 'lucide-react';

const problems = [
  'Manual attendance tracking errors',
  'Scattered employee information',
  'Difficult sales monitoring',
  'Poor visibility into performance',
  'Inventory management challenges',
  'Complex manual reporting',
  'Communication gaps between teams',
];

export default function ProblemSection() {
  return (
    <section className="py-24">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="h2 mb-6">
              Running a business shouldn't mean managing endless spreadsheets.
            </h2>
            <p className="lead mb-8">
              Legacy systems and manual processes slow down your growth. Business Sarthi eliminates
              operational friction so you can focus on what matters most — growing your business.
            </p>
            <div className="space-y-4">
              {problems.map((problem) => (
                <div key={problem} className="flex items-center gap-3">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span className="text-slate-700 font-medium">{problem}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
             <div className="bg-primary-600 rounded-2xl aspect-square lg:aspect-auto lg:h-[500px] shadow-2xl flex items-center justify-center p-8 text-white overflow-hidden">
                <div className="text-center z-10">
                   <h3 className="text-3xl font-bold mb-4">The Solution is Sarthi</h3>
                   <p className="text-primary-100 text-lg">Your intelligent partner in business management.</p>
                </div>
                {/* Abstract background shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl -ml-32 -mb-32" />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
