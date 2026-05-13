
import React from 'react';
import { ClimateStats } from '../types';

interface Props {
  data: ClimateStats;
  insights: string;
}

const Header: React.FC<Props> = ({ data, insights }) => {
  const getReliabilityColor = (score: number) => {
    if (score >= 95) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (score >= 80) return 'bg-amber-50 text-amber-700 border-amber-100';
    return 'bg-rose-50 text-rose-700 border-rose-100';
  };

  const getReliabilityIcon = (score: number) => {
    if (score >= 95) return '✨';
    if (score >= 80) return '✅';
    return '⚠️';
  };

  return (
    <div className="mb-8 bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 opacity-[0.03]">
        <svg width="300" height="300" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
        </svg>
      </div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-4xl font-black text-slate-800 leading-tight">{data.location.name}</h2>
            <div className="flex flex-wrap items-center gap-2 text-slate-400 text-xs mt-3 font-bold uppercase tracking-wider">
              <span className="bg-slate-100 px-2 py-1 rounded-lg">LAT: {data.location.lat.toFixed(4)}°</span>
              <span className="bg-slate-100 px-2 py-1 rounded-lg">LNG: {data.location.lng.toFixed(4)}°</span>
              <span className="text-slate-300 mx-1">•</span>
              <div className="flex items-center gap-2">
                <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 4.925-3.467 9.043-8 10.058-4.533-1.015-8-5.133-8-10.058 0-.68.056-1.35.166-2.001zm8.341 5.07a.75.75 0 00-1.014-1.114l-2.5 2.25a.75.75 0 00.444 1.294l2.14.214.515 1.545a.75.75 0 001.428 0l.515-1.545 2.14-.214a.75.75 0 00.444-1.294l-2.5-2.25z" clipRule="evenodd" /></svg>
                  ERA5 Reanalysis
                </span>
                <span className="text-slate-500 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200/50 flex items-center gap-1.5 lowercase">
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-pulse"></span>
                  10-year baseline
                </span>
              </div>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${getReliabilityColor(data.reliabilityScore)}`}>
            <div className="text-xl">{getReliabilityIcon(data.reliabilityScore)}</div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">Data Quality</div>
              <div className="text-lg font-black leading-none">{data.reliabilityScore}% <span className="text-xs font-bold opacity-80 uppercase ml-0.5">Reliable</span></div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-100">
          <div className="flex gap-4 items-start">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div>
              <h4 className="font-black text-blue-100 text-[10px] uppercase tracking-[0.2em] mb-1">ClimaIntel Analysis</h4>
              <p className="text-lg leading-snug font-semibold italic text-white/95">
                "{insights || "Synthesizing decades of atmospheric data patterns..."}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
