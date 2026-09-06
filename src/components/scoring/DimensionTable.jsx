import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { DIMENSION_SOURCES } from '@/lib/scoring';

export default function DimensionTable({ rows, onRowChange, onDeleteRow }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No scoring dimensions configured yet. Add one below to build your weighted score.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-4 font-medium">Dimension</th>
            <th className="py-2 pr-4 font-medium">Description</th>
            <th className="py-2 pr-4 font-medium">Weight (%)</th>
            <th className="py-2 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || 'new-' + idx} className="border-b last:border-0">
              <td className="py-3 pr-4">
                <Input
                  value={row.name}
                  onChange={(e) => onRowChange(idx, { name: e.target.value })}
                  className="font-medium text-primary"
                />
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{DIMENSION_SOURCES[row.key] || '—'}</td>
              <td className="py-3 pr-4">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={row.weight}
                  onChange={(e) => onRowChange(idx, { weight: Number(e.target.value) || 0 })}
                  className="w-24"
                />
              </td>
              <td className="py-3">
                <Button variant="ghost" size="icon" onClick={() => onDeleteRow(idx)}>
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}