import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Cell 
} from 'recharts';
import { BarChart3, TrendingUp, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';

const COLORS = ['var(--primary)', 'var(--secondary)', 'var(--accent)', 'var(--border-color)', 'var(--bg-card)'];

export function Analytics() {
  const { clients } = useApp();
  // Calculate sources
  const sourceCount = clients.reduce((acc, client) => {
    const source = client.source || 'Outros';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceData = Object.entries(sourceCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => (b.value as number) - (a.value as number));

  // Mock time data for revenue trend
  const revenueData = [
    { month: 'Jan', revenue: 12000, leads: 45 },
    { month: 'Fev', revenue: 19000, leads: 52 },
    { month: 'Mar', revenue: 15000, leads: 38 },
    { month: 'Abr', revenue: 22000, leads: 65 },
    { month: 'Mai', revenue: 28000, leads: 72 },
    { month: 'Jun', revenue: 35000, leads: 89 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="text-primary" size={28} />
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-text-main tracking-wide">Relatórios e Análises</h2>
          <p className="text-text-sec mt-1 text-sm">Métricas detalhadas de conversão e crescimento.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Revenue Trend */}
        <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color shadow-xl">
          <h3 className="text-lg font-medium text-text-main mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Evolução de Receita
          </h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-sec)" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--text-sec)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val/1000}k`} width={35} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                  itemStyle={{ color: 'var(--primary)' }}
                  formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Receita']}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ fill: 'var(--bg-main)', stroke: 'var(--primary)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: 'var(--primary)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Lead Sources */}
        <div className="bg-bg-sidebar p-6 rounded-2xl border border-border-color shadow-xl">
          <h3 className="text-lg font-medium text-text-main mb-6 flex items-center gap-2">
            <Users size={18} className="text-primary" />
            Origem dos Leads
          </h3>
          <div className="h-64 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-sec)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-sec)" fontSize={10} tickLine={false} axisLine={false} width={70} />
                <Tooltip 
                  cursor={{ fill: 'var(--bg-card)' }}
                  contentStyle={{ backgroundColor: 'var(--bg-main)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }}
                  itemStyle={{ color: 'var(--primary)' }}
                />
                <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]}>
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
