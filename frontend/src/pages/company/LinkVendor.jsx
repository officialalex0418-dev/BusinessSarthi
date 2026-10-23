import { useEffect, useState, useCallback } from 'react';
import { Key, CheckCircle2 } from 'lucide-react';
import { api } from '@/api/client';
import { Card, Button, Table, Badge, Spinner } from '@/components/ui';

export default function LinkVendor() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  const loadVendors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/vendors?limit=10000');
      setVendors(data.data?.items || data.data || []);
    } catch (err) {
      console.error('Failed to load vendors', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadVendors(); }, [loadVendors]);

  const generateKey = async (id) => {
    setGeneratingId(id);
    try {
      const { data } = await api.post(`/vendors/${id}/generate-key`);
      const key = data.data.secretKey;
      setVendors(vendors.map(v => v._id === id ? { ...v, secretKey: key } : v));
      navigator.clipboard?.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 4000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate key');
    } finally {
      setGeneratingId(null);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Link Vendor</h1>
          <p className="text-sm text-slate-500">Generate secure 18-digit secret keys for vendors to allow companies to link with your stockist inventory.</p>
        </div>
      </div>

      {copiedKey && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-800 uppercase">Generated Secret Key (Copied to Clipboard!)</p>
            <p className="text-sm font-mono font-bold text-emerald-900 mt-1">{copiedKey}</p>
          </div>
          <Badge color="green">Ready to Share</Badge>
        </div>
      )}

      <Card>
        <Table
          columns={['Vendor Name', 'Phone', 'Address', 'Status', 'Link Status', 'Secret Key', 'Action']}
          data={vendors}
          renderRow={(v) => (
            <tr key={v._id} className="hover:bg-slate-50 text-sm">
              <td className="table-td font-semibold">{v.name}</td>
              <td className="table-td">{v.phone || '—'}</td>
              <td className="table-td">{v.address || '—'}</td>
              <td className="table-td"><Badge color={v.status === 'ACTIVE' ? 'green' : 'gray'}>{v.status}</Badge></td>
              <td className="table-td">
                {v.isLinked ? (
                  <Badge color="emerald" className="flex items-center gap-1 w-fit"><CheckCircle2 className="h-3.5 w-3.5" /> Linked</Badge>
                ) : (
                  <Badge color="yellow">Not Linked</Badge>
                )}
              </td>
              <td className="table-td font-mono text-xs">
                {v.secretKey ? (
                  <span className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-bold">{v.secretKey}</span>
                ) : (
                  <span className="text-slate-400 italic">Not generated</span>
                )}
              </td>
              <td className="table-td">
                <Button size="sm" loading={generatingId === v._id} onClick={() => generateKey(v._id)}>
                  <Key className="h-3.5 w-3.5 mr-1.5" /> {v.secretKey ? 'Regenerate Key' : 'Generate Key'}
                </Button>
              </td>
            </tr>
          )}
        />
      </Card>
    </div>
  );
}
