import React, { useState, useEffect, useRef } from 'react';
import { Page, ClimateStats, LocationInfo } from './types';
import { fetchClimateData, geocode, reverseGeocode } from './services/climateService';
import { getClimateInsights } from './services/geminiService';
import Header from './components/Header';
import Overview from './components/Overview';
import SeasonalDetail from './components/SeasonalDetail';
import StatsTable from './components/StatsTable';
import Visuals from './components/Visuals';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.OVERVIEW);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{ message: string; type: string; lat?: number; lng?: number; name?: string } | null>(null);
  const [data, setData] = useState<ClimateStats | null>(null);
  const [insights, setInsights] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [searchResults, setSearchResults] = useState<LocationInfo[]>([]);
  const [useCoords, setUseCoords] = useState<boolean>(false);
  const [latInput, setLatInput] = useState<string>("");
  const [lngInput, setLngInput] = useState<string>("");
  const [cooldownTime, setCooldownTime] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [showDataInfo, setShowDataInfo] = useState<boolean>(false);
  
  const searchTimeoutRef = useRef<number | null>(null);
  const cooldownTimerRef = useRef<number | null>(null);

  const handleOpenKeySelection = async () => {
    try {
      if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
        await window.aistudio.openSelectKey();
        // After selecting, trigger a reload of the current location if it exists
        if (data) loadData(data.location.lat, data.location.lng, data.location.name);
      } else {
        alert("The API Key selection tool is unavailable in this environment.");
      }
    } catch (e) {
      console.error("Failed to open key selection", e);
    }
  };

  const loadData = async (lat: number, lng: number, name: string) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch historical climate data (Public API, no key usually needed)
      const stats = await fetchClimateData(lat, lng, name);
      setData(stats);
      
      // 2. Fetch AI insights (Requires Gemini API key)
      try {
        const hasKey = await window.aistudio?.hasSelectedApiKey();
        if (!hasKey) {
          setInsights("Connect an API key to enable AI insights.");
        } else {
          const text = await getClimateInsights(stats);
          setInsights(text);
        }
      } catch (geminiErr: any) {
        if (geminiErr.message?.includes("KEY_NOT_FOUND") || geminiErr.message?.includes("MISSING_KEY")) {
           setInsights("AI features are disabled. Please select a valid API key project.");
           setError({ message: "Gemini API key issue: " + geminiErr.message, type: "API_KEY_ERROR" });
        } else {
           setInsights("Climate analysis complete. Explore the historical records below.");
        }
      }
    } catch (err: any) {
      const msg = err.message || "Failed to retrieve climate data.";
      const type = msg.includes(":") ? msg.split(":")[0] : "GENERAL_ERROR";
      const cleanMsg = msg.includes(":") ? msg.split(":")[1].trim() : msg;
      
      setError({ message: cleanMsg, type, lat, lng, name });
      if (type === "RATE_LIMIT") setCooldownTime(30);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial Load - Default to San Francisco
    loadData(37.7749, -122.4194, "San Francisco, CA, United States");
  }, []);

  useEffect(() => {
    if (cooldownTime > 0) {
      cooldownTimerRef.current = window.setInterval(() => {
        setCooldownTime(prev => prev - 1);
      }, 1000);
    } else {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    }
    return () => { if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current); };
  }, [cooldownTime]);

  useEffect(() => {
    if (useCoords || !search.trim() || search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
    setIsSearching(true);
    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const results = await geocode(search);
        setSearchResults(results);
      } catch (err) {
        console.debug("Search error", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => { if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current); };
  }, [search, useCoords]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownTime > 0) return;
    setError(null);

    if (useCoords) {
      const lat = parseFloat(latInput);
      const lng = parseFloat(lngInput);
      if (isNaN(lat) || isNaN(lng)) {
        setError({ message: "Invalid coordinates format.", type: "INPUT_ERROR" });
        return;
      }
      loadData(lat, lng, `Location (${lat.toFixed(2)}, ${lng.toFixed(2)})`);
    } else {
      if (searchResults.length > 0) {
        selectLocation(searchResults[0]);
      } else if (search.trim()) {
        setLoading(true);
        try {
          const results = await geocode(search);
          if (results.length > 0) selectLocation(results[0]);
          else {
            setError({ message: `No climate data found for '${search}'. Try city names.`, type: "NOT_FOUND" });
            setLoading(false);
          }
        } catch (err: any) {
          setError({ message: err.message || "Geocoding service unavailable.", type: "SEARCH_ERROR" });
          setLoading(false);
        }
      }
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError({ message: "Geolocation not supported in this browser.", type: "PERMISSION_ERROR" });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const locationName = await reverseGeocode(latitude, longitude);
        loadData(latitude, longitude, locationName);
        setLatInput(latitude.toFixed(4));
        setLngInput(longitude.toFixed(4));
        setSearch(locationName);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setError({ message: "Location access was denied.", type: "PERMISSION_ERROR" });
      }
    );
  };

  const selectLocation = (loc: LocationInfo) => {
    loadData(loc.lat, loc.lng, loc.name);
    setSearchResults([]);
    setSearch(loc.name);
  };

  const ErrorCard = ({ error }: { error: { message: string, type: string, lat?: number, lng?: number, name?: string } }) => {
    return (
      <div className="mb-8 bg-rose-50 border-rose-200 border-2 p-8 rounded-[2.5rem] fade-in shadow-xl">
        <div className="flex items-start gap-6">
          <div className="bg-white p-4 rounded-3xl shadow-md text-3xl">📡</div>
          <div className="flex-1">
            <h3 className="font-black text-rose-900 text-lg mb-2">Connectivity Status</h3>
            <p className="text-rose-700 text-sm font-medium leading-relaxed mb-6">{error.message}</p>
            <div className="flex flex-wrap gap-4">
              {(error.type === 'API_KEY_ERROR' || error.type === 'GEMINI_LIMIT' || error.type === 'GENERAL_ERROR') && (
                <button 
                  onClick={handleOpenKeySelection}
                  className="bg-slate-900 text-white px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl"
                >
                  Configure API Key
                </button>
              )}
              {error.lat !== undefined && error.lng !== undefined && (
                <button 
                  onClick={() => loadData(error.lat!, error.lng!, error.name || "Retry")}
                  className="bg-rose-600 text-white px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-700 transition-all shadow-xl"
                >
                  Retry Analysis
                </button>
              )}
            </div>
          </div>
          <button onClick={() => setError(null)} className="text-rose-300 hover:text-rose-600 p-2 text-xl font-black">✕</button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-20 pt-8">
      <div className="mb-14 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="fade-in">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <span className="bg-blue-600 text-white p-3 rounded-[1.5rem] rotate-6 shadow-2xl">🌍</span>
            ClimaIntel
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-3 ml-1 opacity-70">Unified Climate Intelligence</p>
        </div>
        
        <div className="w-full md:w-auto flex flex-col items-end gap-4">
          <div className="flex bg-white/90 backdrop-blur-md p-1.5 rounded-[1.8rem] w-fit shadow-xl border border-slate-100">
            <button onClick={() => setUseCoords(false)} className={`px-6 py-2.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${!useCoords ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Search</button>
            <button onClick={() => setUseCoords(true)} className={`px-6 py-2.5 rounded-[1.2rem] text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${useCoords ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Coords</button>
            <button 
              onClick={() => setShowDataInfo(!showDataInfo)}
              className={`px-4 py-2.5 rounded-[1.2rem] text-sm transition-all duration-300 ${showDataInfo ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
              title="Data Information"
            >
              ℹ️
            </button>
          </div>

          {showDataInfo && (
            <div className="absolute top-full right-0 mt-4 bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl z-[60] w-72 fade-in border border-slate-800">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Baseline Protocol</span>
                <button onClick={() => setShowDataInfo(false)} className="text-slate-500 hover:text-white">✕</button>
              </div>
              <p className="text-xs leading-relaxed font-medium text-slate-300">
                To provide scientific accuracy, ClimaIntel fetches a <span className="text-white font-bold">30-Year WMO Baseline</span> for every location.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-[10px] text-slate-400 leading-tight">
                  <span className="text-blue-400">⚡ Note:</span> Initial analysis may take 2-3 seconds. Data is cached for 24 hours to ensure instant access on return visits.
                </p>
              </div>
            </div>
          )}

          <div className="relative w-full">
            <form onSubmit={handleSearchSubmit} className="flex gap-3">
              <div className="flex-1 flex gap-3">
                {!useCoords ? (
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Enter a major city..." 
                      className="px-7 py-5 rounded-[2rem] border border-slate-200 w-full md:w-96 shadow-2xl font-medium focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all placeholder:text-slate-300"
                    />
                    {isSearching && <div className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input type="text" placeholder="Lat" value={latInput} onChange={(e) => setLatInput(e.target.value)} className="w-28 px-6 py-5 rounded-[2rem] border border-slate-200 shadow-2xl font-mono text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none" />
                    <input type="text" placeholder="Lng" value={lngInput} onChange={(e) => setLngInput(e.target.value)} className="w-28 px-6 py-5 rounded-[2rem] border border-slate-200 shadow-2xl font-mono text-sm focus:ring-4 focus:ring-blue-100 focus:outline-none" />
                  </div>
                )}
                <button 
                  type="submit"
                  disabled={cooldownTime > 0 || loading}
                  className={`${cooldownTime > 0 ? 'bg-slate-300' : 'bg-slate-900 hover:bg-black active:scale-95'} text-white px-10 py-5 rounded-[2rem] transition-all shadow-2xl font-black uppercase text-[10px] tracking-[0.2em] min-w-[140px]`}
                >
                  {cooldownTime > 0 ? `Wait ${cooldownTime}s` : loading ? '...' : 'Analyze'}
                </button>
              </div>
              <button type="button" onClick={handleGetCurrentLocation} disabled={isLocating || cooldownTime > 0} className="px-6 py-5 rounded-[2rem] border bg-white border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 shadow-2xl transition-all">
                {isLocating ? <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : "📍"}
              </button>
            </form>
            {searchResults.length > 0 && !useCoords && (
              <div className="absolute top-full left-0 right-0 bg-white/95 backdrop-blur-2xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] rounded-[2.5rem] mt-5 z-50 border border-slate-100 overflow-hidden max-h-[400px] overflow-y-auto fade-in">
                {searchResults.map((loc, i) => (
                  <button key={i} onClick={() => selectLocation(loc)} className="w-full text-left px-8 py-6 hover:bg-blue-600 hover:text-white transition-all group border-b border-slate-50 last:border-none">
                    <span className="font-black block text-base group-hover:translate-x-2 transition-transform duration-300">{loc.name}</span>
                    <span className="text-[10px] opacity-60 font-black uppercase tracking-widest mt-2 block">Climate Baseline Lat {loc.lat.toFixed(3)} / Lng {loc.lng.toFixed(3)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorCard error={error} />}

      {loading && !data ? (
        <div className="flex flex-col items-center justify-center py-48 fade-in">
           <div className="relative">
             <div className="w-24 h-24 rounded-full border-[6px] border-slate-100 border-t-blue-600 animate-spin shadow-inner"></div>
             <div className="absolute inset-0 flex items-center justify-center text-3xl">📡</div>
           </div>
            <p className="text-slate-900 font-black text-3xl mt-10 tracking-tighter">Analyzing 30 Years of Climate Data...</p>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 opacity-60 text-center max-w-xs">
              Fetching WMO Standard ERA5 Baseline. <br/> This deep analysis is cached for 24 hours.
            </p>
        </div>
      ) : data && (
        <>
          <Header data={data} insights={insights} />
          <nav className="flex overflow-x-auto gap-3 mb-14 bg-white/95 p-2 md:p-3 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-slate-50 scrollbar-hide sticky top-4 md:top-8 z-40 backdrop-blur-3xl mx-2">
            {[
              { id: Page.OVERVIEW, label: "Overview", icon: "🌎" },
              { id: Page.SUNNY, label: "Sunny", icon: "☀️" },
              { id: Page.RAINY, label: "Rainy", icon: "🌧️" },
              { id: Page.WINTER, label: "Winter", icon: "❄️" },
              { id: Page.STATS, label: "Data", icon: "📊" },
              { id: Page.GRAPHS, label: "Graphs", icon: "📈" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setCurrentPage(tab.id as Page)} className={`flex items-center gap-3 px-8 py-5 rounded-[2.8rem] transition-all duration-500 ${currentPage === tab.id ? 'bg-slate-900 text-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] -translate-y-2' : 'text-slate-500 hover:bg-white hover:text-slate-900 font-bold text-sm hover:shadow-lg'}`}>
                <span className="text-xl md:text-2xl">{tab.icon}</span>
                <span className="font-black tracking-tighter uppercase text-[9px] md:text-[11px] whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </nav>
          <main className="fade-in">
            {currentPage === Page.OVERVIEW && <Overview data={data} />}
            {currentPage === Page.SUNNY && <SeasonalDetail data={data} type="sunny" />}
            {currentPage === Page.RAINY && <SeasonalDetail data={data} type="rainy" />}
            {currentPage === Page.WINTER && <SeasonalDetail data={data} type="winter" />}
            {currentPage === Page.STATS && <StatsTable data={data} />}
            {currentPage === Page.GRAPHS && <Visuals data={data} />}
          </main>
        </>
      )}
    </div>
  );
};

export default App;