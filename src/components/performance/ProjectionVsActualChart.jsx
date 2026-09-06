import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function ProjectionVsActualChart({ data, label, format = (v) => (v ?? 0).toLocaleString(), height = 280 }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-sm text-muted-foreground" style={{ height }}>
        No comparable data yet — record actual results for launched campaigns.
      </div>
    );
  }
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={data.length > 4 ? -12 : 0} height={40} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={format} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="projected" name={`Projected ${label}`} fill="#94a3b8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="actual" name={`Actual ${label}`} fill="#006450" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}