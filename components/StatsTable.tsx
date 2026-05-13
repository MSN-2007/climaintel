
import React from 'react';
import { ClimateStats } from '../types';
import { degToCardinal } from '../services/climateService';

interface Props {
  data: ClimateStats;
}

const StatsTable: React.FC<Props> = ({ data }) => {
  // Find max values for normalized bars
  const maxRain = Math.max(...data.monthlyData.map(m => m.rainfall));
  const maxTemp = Math.max(...data.monthlyData.map(m => m.tempMax));
  const handleExportCSV = () => {
    const headers = ["Month", "Temp Avg", "Temp Min", "Temp Max", "Rainfall (mm)", "Rainy Days", "Humidity (%)", "Wind Speed (km/h)", "UV Index"];
    const rows = data.monthlyData.map(m => [
      m.month, m.tempAvg, m.tempMin, m.tempMax, m.rainfall, m.rainyDays, m.humidity, m.windSpeed, m.uvIndex
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `climate_stats_${data.location.name.replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center">
        <h3 className="font-black text-slate-900 uppercase text-[10px] tracking-[0.3em]">Historical Dataset</h3>
        <button 
          onClick={handleExportCSV}
          className="bg-slate-900 text-white px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95"
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Month</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Temperature Curve</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Rainfall</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Humidity</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">UV Risk</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Wind</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.monthlyData.map((m) => (
              <tr key={m.month} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-5">
                  <span className="font-black text-slate-800">{m.month}</span>
                </td>
                <td className="px-6 py-5 min-w-[200px]">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col min-w-[60px]">
                      <span className="text-sm font-black text-slate-900">{m.tempAvg}°</span>
                      <span className="text-[10px] text-slate-400 font-bold tracking-tighter">{m.tempMin}° - {m.tempMax}°</span>
                    </div>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full relative overflow-hidden">
                       <div 
                        className="absolute h-full bg-rose-400 rounded-full" 
                        style={{ width: `${(m.tempAvg / maxTemp) * 100}%` }}
                       />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs">{m.rainfall} mm</span>
                    <div className="w-12 h-1 bg-blue-100 rounded-full overflow-hidden">
                       <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${(m.rainfall / maxRain) * 100}%` }}
                       />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <span className="font-bold text-slate-600 text-sm">{m.humidity}%</span>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-xs ${m.uvIndex > 7 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                    {Math.round(m.uvIndex)}
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-bold text-slate-700 text-xs">{m.windSpeed} km/h</span>
                    <span className="bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      {degToCardinal(m.windDir)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StatsTable;
