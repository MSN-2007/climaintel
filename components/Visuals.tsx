
import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Legend, Cell, Radar, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { ClimateStats } from '../types';
import { degToCardinal } from '../services/climateService';

interface Props {
  data: ClimateStats;
}

const Visuals: React.FC<Props> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'seasonal'>('seasonal');
  const isSouthern = data.location.lat < 0;
  
  const getSeasonName = (monthIdx: number) => {
    if (isSouthern) {
      if ([11, 0, 1].includes(monthIdx)) return 'Summer';
      if ([2, 3, 4].includes(monthIdx)) return 'Autumn';
      if ([5, 6, 7].includes(monthIdx)) return 'Winter';
      return 'Spring';
    } else {
      if ([11, 0, 1].includes(monthIdx)) return 'Winter';
      if ([2, 3, 4].includes(monthIdx)) return 'Spring';
      if ([5, 6, 7].includes(monthIdx)) return 'Summer';
      return 'Autumn';
    }
  };

  const seasons = ['Winter', 'Spring', 'Summer', 'Autumn'];
  const seasonalStats = seasons.map(name => {
    const months = data.monthlyData.filter(m => getSeasonName(m.monthIdx) === name);
    const count = months.length || 1;
    return {
      name,
      temp: parseFloat((months.reduce((acc, m) => acc + m.tempAvg, 0) / count).toFixed(1)),
      rain: parseFloat((months.reduce((acc, m) => acc + m.rainfall, 0)).toFixed(1)),
      humidity: parseFloat((months.reduce((acc, m) => acc + m.humidity, 0) / count).toFixed(1)),
      color: name === 'Winter' ? '#3b82f6' : name === 'Spring' ? '#10b981' : name === 'Summer' ? '#f59e0b' : '#ef4444'
    };
  });

  // Wind Rose Data Preparation
  const cardinalDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const windRoseData = cardinalDirections.map(dir => {
    const frequency = data.monthlyData.filter(m => degToCardinal(m.windDir) === dir).length;
    const avgSpeed = data.monthlyData
      .filter(m => degToCardinal(m.windDir) === dir)
      .reduce((acc, m) => acc + m.windSpeed, 0) / (frequency || 1);
    
    return {
      subject: dir,
      frequency,
      speed: parseFloat(avgSpeed.toFixed(1)),
      fullMark: 12,
    };
  });

  const getUvColor = (uv: number) => {
    if (uv >= 11) return '#a855f7';
    if (uv >= 8) return '#ef4444';
    if (uv >= 6) return '#f97316';
    if (uv >= 3) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div className="space-y-12 pb-20 fade-in">
      {/* View Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-200/50 p-1.5 rounded-[2rem] flex shadow-inner backdrop-blur-sm border border-white">
          <button 
            onClick={() => setViewMode('seasonal')}
            className={`px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${viewMode === 'seasonal' ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Seasonal Intelligence
          </button>
          <button 
            onClick={() => setViewMode('monthly')}
            className={`px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${viewMode === 'monthly' ? 'bg-slate-900 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Monthly Detail
          </button>
        </div>
      </div>

      {viewMode === 'seasonal' ? (
        <section className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden relative min-h-[600px]">
          <div className="absolute top-0 right-0 p-10 opacity-5 select-none text-[150px] font-black -rotate-12 pointer-events-none tracking-tighter">
            {isSouthern ? 'SOUTH' : 'NORTH'}
          </div>
          <div className="mb-12 relative z-10">
            <div className="flex items-center gap-5 mb-4">
              <span className="bg-blue-600 text-white p-4 rounded-3xl text-3xl shadow-2xl rotate-3">📈</span>
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Seasonal Cluster Analysis</h2>
                <p className="text-slate-400 text-sm font-black uppercase tracking-widest mt-1 opacity-70">Long-Term Aggregated Patterns</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="lg:col-span-2 min-h-[450px]">
              <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonalStats} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 900}} />
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} unit="°C" />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} unit="mm" />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '32px', border: 'none', boxShadow: '0 32px 64px -16px rgb(0 0 0 / 0.2)', padding: '20px' }}
                    />
                    <Legend iconType="circle" verticalAlign="top" height={50} />
                    <Bar yAxisId="left" dataKey="temp" name="Quarterly Temp" radius={[15, 15, 0, 0]} barSize={60}>
                      {seasonalStats.map((entry, index) => (
                        <Cell key={`cell-s-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Bar yAxisId="right" dataKey="rain" name="Total Rainfall" fill="#cbd5e1" radius={[10, 10, 0, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="space-y-6">
               {seasonalStats.map(s => (
                 <div key={s.name} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 hover:scale-[1.03] hover:shadow-xl transition-all duration-500 cursor-default group">
                   <div className="flex items-center justify-between mb-5">
                     <span className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-lg" style={{backgroundColor: s.color}}>{s.name}</span>
                     <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Aggregate</span>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors">{s.temp}°</div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2">Surface Temp</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-slate-600 tracking-tighter">{s.humidity}%</div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-2">Rel. Humidity</p>
                      </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        </section>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* UV Spectrum */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl min-h-[450px]">
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Ultraviolet Intensity Spectrum</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Monthly Risk Profiling</p>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 12]} />
                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '24px', border: 'none' }} />
                    <Bar dataKey="uvIndex" name="UV Index" radius={[12, 12, 0, 0]} barSize={30}>
                      {data.monthlyData.map((entry, index) => (
                        <Cell key={`cell-uv-${index}`} fill={getUvColor(entry.uvIndex)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Humidity Analysis */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl min-h-[450px]">
              <div className="mb-10">
                <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Atmospheric Moisture Profile</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Monthly Relative Humidity (%)</p>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="humidityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} unit="%" />
                    <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="humidity" name="Humidity" stroke="#06b6d4" strokeWidth={4} fill="url(#humidityGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Wind Rose / Kinetic Profile */}
            <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl min-h-[450px]">
              <div className="mb-10 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Atmospheric Kinetic Profile</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Dominant Cardinal Frequency</p>
                </div>
                <div className="bg-teal-50 px-4 py-2 rounded-2xl border border-teal-100">
                  <span className="text-teal-700 font-black text-xs">WIND ROSE</span>
                </div>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={windRoseData}>
                    <PolarGrid stroke="#f1f5f9" strokeWidth={2} />
                    <PolarAngleAxis dataKey="subject" tick={{fill: '#64748b', fontWeight: 900, fontSize: 14}} />
                    <PolarRadiusAxis angle={30} domain={[0, 12]} axisLine={false} tick={false} />
                    <Radar
                      name="Frequency (Months)"
                      dataKey="frequency"
                      stroke="#0d9488"
                      strokeWidth={3}
                      fill="#0d9488"
                      fillOpacity={0.15}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                      formatter={(value: any, name: string) => [value, name === 'frequency' ? 'Months Dominant' : name]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl min-h-[450px]">
            <div className="mb-10">
              <h2 className="text-2xl font-black text-slate-800 tracking-tighter">Dynamic Thermal Curve</h2>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Max/Min Deviation Analysis</p>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 900}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} unit="°" />
                  <Tooltip contentStyle={{ borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)' }} />
                  <Area name="Max Temp" type="monotone" dataKey="tempMax" stroke="#f43f5e" strokeWidth={5} fill="url(#tempGrad)" />
                  <Area name="Min Temp" type="monotone" dataKey="tempMin" stroke="#3b82f6" strokeWidth={5} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Visuals;
