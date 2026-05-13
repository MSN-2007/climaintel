
import React from 'react';
import { ClimateStats } from '../types';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Area
} from 'recharts';

interface Props {
  data: ClimateStats;
}

const Overview: React.FC<Props> = ({ data }) => {
  const sunnyMonths = data.monthlyData.filter(m => m.isSunny).map(m => m.month);
  const rainyMonths = data.monthlyData.filter(m => m.isRainy).map(m => m.month);
  const winterMonths = data.monthlyData.filter(m => m.isWinter).map(m => m.month);
  const windyMonths = data.monthlyData.filter(m => m.isWindy).map(m => m.month);

  return (
    <div className="space-y-8 fade-in">
      {/* Yearly Summary Pulse Chart */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Yearly Climate Pulse</h3>
            <p className="text-slate-400 text-sm font-medium">Temperature (°C) and Rainfall (mm) overlap</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span className="text-xs font-bold text-slate-500 uppercase">Rain</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-xs font-bold text-slate-500 uppercase">Temp</span>
            </div>
          </div>
        </div>
        
        <div className="h-[350px] w-full" style={{ minHeight: '350px' }}>
          <ResponsiveContainer width="100%" height="100%" debounce={1}>
            <ComposedChart data={data.monthlyData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} unit="°" />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} unit="mm" />
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar yAxisId="right" dataKey="rainfall" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} opacity={0.6} />
              <Area yAxisId="left" type="monotone" dataKey="tempAvg" fill="url(#colorPulse)" stroke="#ef4444" strokeWidth={4} dot={{r: 4, fill: '#ef4444'}} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SeasonCard 
          title="Sunny Period" 
          months={sunnyMonths} 
          icon="☀️" 
          color="bg-orange-500" 
          accent="text-orange-700" 
          bg="bg-orange-50"
          subtitle="Highest Solar Exposure"
        />
        <SeasonCard 
          title="Rainy Period" 
          months={rainyMonths} 
          icon="🌧️" 
          color="bg-blue-500" 
          accent="text-blue-700" 
          bg="bg-blue-50"
          subtitle="Peak Precipitation"
        />
        <SeasonCard 
          title="Cooler Period" 
          months={winterMonths} 
          icon="❄️" 
          color="bg-indigo-500" 
          accent="text-indigo-700" 
          bg="bg-indigo-50"
          subtitle="Thermal Minimums"
        />
        <SeasonCard 
          title="Windy Period" 
          months={windyMonths} 
          icon="🌬️" 
          color="bg-teal-500" 
          accent="text-teal-700" 
          bg="bg-teal-50"
          subtitle="Peak Gust Frequency"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label="Hottest Month" 
          value={data.summary.hottestMonth} 
          detail={`${data.monthlyData.find(m => m.month === data.summary.hottestMonth)?.tempMax || 0}°C Avg Max`}
          color="text-red-600"
        />
        <MetricCard 
          label="Coldest Month" 
          value={data.summary.coldestMonth} 
          detail={`${data.monthlyData.find(m => m.month === data.summary.coldestMonth)?.tempMin || 0}°C Avg Min`}
          color="text-blue-600"
        />
        <MetricCard 
          label="Rainiest Month" 
          value={data.summary.rainiestMonth} 
          detail={`${data.monthlyData.find(m => m.month === data.summary.rainiestMonth)?.rainfall || 0}mm Total`}
          color="text-cyan-600"
        />
      </div>
    </div>
  );
};

const SeasonCard: React.FC<{title: string, months: string[], icon: string, color: string, accent: string, bg: string, subtitle: string}> = ({
  title, months, icon, color, accent, bg, subtitle
}) => (
  <div className={`${bg} border border-white p-6 rounded-3xl shadow-sm hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1.5 transition-all duration-300 ease-out cursor-default group`}>
    <div className={`${color} w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-sm text-white group-hover:rotate-6 transition-transform duration-300`}>
      {icon}
    </div>
    <div className="mb-2">
      <h3 className={`text-xl font-bold ${accent} leading-tight`}>{title}</h3>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{subtitle}</span>
    </div>
    <p className="text-slate-600 text-sm font-medium leading-relaxed">
      {months.length > 0 ? months.join(', ') : 'Identifying patterns...'}
    </p>
  </div>
);

const MetricCard: React.FC<{label: string, value: string, detail: string, color: string}> = ({
  label, value, detail, color
}) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">{label}</span>
    <h4 className={`text-2xl font-black mt-1 ${color}`}>{value}</h4>
    <p className="text-slate-500 text-sm font-medium mt-1">{detail}</p>
  </div>
);

export default Overview;
