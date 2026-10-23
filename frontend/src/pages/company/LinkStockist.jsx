import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { api } from '@/api/client';
import { Card, Button, Input, Modal, Table, Badge, Spinner } from '@/components/ui';

export default function LinkStockist() {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDist, setSelectedDist] = useState(null);
  const [secretKey, setSecretKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadDistributors = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/distributors?limit=10000');
      setDistributors(data.data?.items || data.data || []);
    } catch (err) {
      console.error('Failed to load distributors', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDistributors(); }, [loadDistributors]);

  const handleLink = async (e) => {
    e.preventDefault();
    if (!selectedDist || !secretKey) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await api.post('/distributors/link', { distributorId: selectedDist._id, secretKey });
      setSuccessMsg(`Successfully linked ${selectedDist.name} with stockist vendor!`);
      setSelectedDist(null);
      setSecretKey('');
      loadDistributors();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify secret code');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Link Stockist</h1>
          <p className="text-sm text-slate-500">Link your outlets/distributors with stockist vendors using secret keys</p>
        </div>
      </div>

      {successMsg && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{successMsg}</div>}

      <Card>
        <Table
          columns={['Outlet / Distributor Name', 'Phone', 'Address', 'Status', 'Link Status', 'Action']}
          data={distributors}
          renderRow={(d) => (
            <tr key={d._id} className="hover:bg-slate-50 text-sm">
              <td className="table-td font-semibold text-blue-600">
                <Link to={`/company/distributors/${d._id}`} className="hover:underline">
                  {d.name}
                </Link>
              </td>
              <td className="table-td">{d.phone || '—'}</td>
              <td className="table-td">{d.address || '—'}</td>
              <td className="table-td"><Badge color={d.status === 'ACTIVE' ? 'green' : 'gray'}>{d.status}</Badge></td>
              <td className="table-td">
                {d.isLinked ? (
                  <Badge color="emerald" className="flex items-center gap-1 w-fit"><CheckCircle2 className="h-3.5 w-3.5" /> Linked</Badge>
                ) : (
                  <Badge color="yellow">Not Linked</Badge>
                )}
              </td>
              <td className="table-td">
                {d.isLinked ? (
                  <span className="text-xs font-bold text-emerald-600">Linked</span>
                ) : (
                  <Button size="sm" onClick={() => { setSelectedDist(d); setSecretKey(''); setError(''); }}>
                    <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Link
                  </Button>
                )}
              </td>
            </tr>
          )}
        />
      </Card>

      <Modal open={!!selectedDist} onClose={() => setSelectedDist(null)} title={`Link Stockist for ${selectedDist?.name}`}>
        {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleLink} className="space-y-4">
          <p className="text-xs text-slate-500">
            Enter the 18-digit secret key provided by the stockist vendor to establish a secure link.
          </p>
          <Input
            label="Secret Code *"
            required
            placeholder="e.g. aB3!dF8#jK2@mP5$qR"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setSelectedDist(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Verify & Link</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
