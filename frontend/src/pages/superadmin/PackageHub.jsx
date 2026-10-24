import { Link } from 'react-router-dom';
import { Building2, Store, ChevronRight } from 'lucide-react';
import { Card, CardBody } from '@/components/ui';

export default function PackageHub() {
  const options = [
    { title: 'Company Package', desc: 'Create, edit, and delete subscription packages for registered companies', icon: Building2, to: 'company', color: 'text-blue-600 bg-blue-50' },
    { title: 'Stockist Package', desc: 'Create, edit, and delete subscription packages for registered stockists', icon: Store, to: 'stockist', color: 'text-emerald-600 bg-emerald-50' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Package Management Hub</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {options.map((opt) => (
          <Link key={opt.title} to={opt.to}>
            <Card className="hover:border-primary-500 transition-colors">
              <CardBody className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${opt.color}`}>
                  <opt.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{opt.title}</h3>
                  <p className="text-xs text-slate-500">{opt.desc}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
