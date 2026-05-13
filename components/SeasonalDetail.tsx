
import React from 'react';
import { ClimateStats, MonthlyClimateData } from '../types';
import { degToCardinal } from '../services/climateService';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line
} from 'recharts';

interface Props {
  data: ClimateStats;
  type: 'sunny' | 'rainy' | 'winter';
}

const SeasonalDetail: React.FC<Props> = ({ data, type }) => {
  const months = data.monthlyData.filter(m => {
    if (type === 'sunny') return m.isSunny;
    if (type === 'rainy') return m.isRainy;
    return m.isWinter;
  });

  const getSeasonTheme = () => {
    switch (type) {
      case 'sunny': return { 
        color: '#f59e0b', 
        label: 'Sunlight & UV Intensity', 
        icon: '☀️',
        description: 'Analysis of peak solar radiation and UV exposure levels.'
      };
      case 'rainy': return { 
        color: '#3b82f6', 
        label: 'Rainfall & Moisture', 
        icon: '🌧️',
        description: 'Tracking precipitation patterns and atmospheric humidity.'
      };
      case 'winter': return { 
        color: '#6366f1', 
        label: 'Cooler Period & Thermal Profile', 
        icon: '❄️',
        description: 'Reviewing the thermal minimums and prevailing seasonal winds.'
      };
    }
  };

  const theme = getSeasonTheme();

  return (
    <div className="space-y-10 fade-in">
      {/* Seasonal Analytics Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{theme.icon}</span>
            <div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{theme.label}</h3>
              <p className="text-slate-400 text-sm font-medium">{theme.description}</p>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-0.5">Classification</span>
            <span className="text-xs font-bold text-slate-700">
              {type === 'winter' && data.monthlyData.every(m => m.tempAvg > 15) ? 'Relative Coolest Period' : 'Distinct Seasonal Period'}
            </span>
          </div>
        </div>

        <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
          <ResponsiveContainer width="100%" height="100%" debounce={1}>
            {type === 'sunny' ? (
              <AreaChart data={months}>
                <defs>
                  <linearGradient id="colorSun" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Area name="Solar Energy" type="monotone" dataKey="solarIntensity" stroke="#f59e0b" strokeWidth={4} fill="url(#colorSun)" />
                <Area name="UV Index" type="monotone" dataKey="uvIndex" stroke="#ef4444" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            ) : type === 'rainy' ? (
              <BarChart data={months}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} unit="mm" />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '20px', border: 'none'}} />
                <Bar name="Rainfall" dataKey="rainfall" fill="#3b82f6" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            ) : (
              <LineChart data={months}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} unit="°" />
                <Tooltip contentStyle={{borderRadius: '20px', border: 'none'}} />
                <Line name="Avg Temp" type="monotone" dataKey="tempAvg" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#6366f1' }} />
                <Line name="Min Temp" type="monotone" dataKey="tempMin" stroke="#94a3b8" strokeWidth={2} strokeDasharray="3 3" dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {months.map(m => (
          <MonthCard key={m.month} data={m} type={type} />
        ))}
      </div>
    </div>
  );
};

const MonthCard: React.FC<{data: MonthlyClimateData, type: string}> = ({ data, type }) => {
  const getTheme = () => {
    if (type === 'sunny') return { bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-100', icon: '☀️', chart: '#f59e0b' };
    if (type === 'rainy') return { bg: 'bg-blue-50', text: 'text-blue-900', border: 'border-blue-100', icon: '🌧️', chart: '#3b82f6' };
    return { bg: 'bg-indigo-50', text: 'text-indigo-900', border: 'border-indigo-100', icon: '❄️', chart: '#6366f1' };
  };

  const theme = getTheme();
  const cardinal = degToCardinal(data.windDir);

  const getUvSeverity = (uv: number) => {
    if (uv >= 11) return 'text-purple-600';
    if (uv >= 8) return 'text-red-600';
    if (uv >= 6) return 'text-orange-600';
    if (uv >= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`${theme.bg} ${theme.border} border-2 p-7 rounded-[2.5rem] shadow-sm hover:shadow-md transition-all group`}>
      <div className="flex justify-between items-center mb-6">
        <div>
           <h3 className={`text-3xl font-black ${theme.text}`}>{data.month}</h3>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Monthly Segment</p>
        </div>
        <span className="text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform">{theme.icon}</span>
      </div>

      <div className="mb-6 bg-black/5 rounded-2xl p-4">
        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400 mb-2">
          <span>{data.tempMin}° (Min)</span>
          <span>{data.tempMax}° (Max)</span>
        </div>
        <div className="h-2 w-full bg-black/5 rounded-full relative overflow-hidden">
          <div 
            className="absolute h-full rounded-full transition-all duration-1000"
            style={{ 
              backgroundColor: theme.chart,
              left: `${Math.max(0, (data.tempMin + 10) * 2)}%`,
              width: `${Math.max(10, (data.tempMax - data.tempMin) * 2)}%`
            }}
          />
        </div>
        <div className="flex justify-center mt-2">
          <span className="text-[10px] font-black uppercase text-slate-400">Heat Range</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-2 border-b border-black/5">
          <span className="text-slate-500 text-sm font-semibold">Most Likely Temp</span>
          <span className="text-slate-800 font-black text-lg">{data.tempAvg}°C</span>
        </div>
        <DetailRow label="Monthly High" value={`${data.tempMax}°C`} />
        <DetailRow label="Monthly Low" value={`${data.tempMin}°C`} />
        
        {type === 'rainy' && (
          <>
            <DetailRow label="Precipitation" value={`${data.rainfall} mm`} />
            <DetailRow label="Wet Days" value={`${data.rainyDays} days`} />
          </>
        )}

        {type === 'sunny' && (
          <>
            <DetailRow label="Peak Hours" value={`${data.peakSunHours} hrs`} />
            <div className="flex justify-between items-center py-2 border-b border-black/5">
              <span className="text-slate-500 text-sm font-medium">UV Index</span>
              <span className={`font-black ${getUvSeverity(data.uvIndex)}`}>{data.uvIndex}</span>
            </div>
          </>
        )}

        <DetailRow label="Humidity" value={`${data.humidity}%`} />
        
        <div className="flex justify-between items-center pt-2 mt-2 border-t border-black/5">
          <span className="text-slate-500 text-sm font-semibold">Wind Speed</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-800 font-black">{data.windSpeed} km/h {cardinal}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{label: string, value: string}> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-black/5 last:border-0">
    <span className="text-slate-500 text-sm font-medium">{label}</span>
    <span className="text-slate-800 font-bold">{value}</span>
  </div>
);

export default SeasonalDetail;
