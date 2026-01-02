import { useState } from 'react';
import { useStagg } from '../../hooks/useStagg';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Power, Clock, Thermometer, ShieldCheck, X, Trash2, Bug } from 'lucide-react';

export default function App() {
    const { 
        state, 
        connect, 
        disconnect, 
        setTemperature, 
        setHoldTime, 
        setSchedule, 
        logs, 
        isDebugMode, 
        setIsDebugMode, 
        clearLogs 
    } = useStagg();

    const [isConnecting, setIsConnecting] = useState(false);
    const [showDebug, setShowDebug] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);
        try {
            await connect();
        } catch (e: any) {
            setError(e.message || 'Connection failed');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleTurnOn = async () => {
        if (!state?.clock) return;
        let h = state.clock.hour;
        let m = state.clock.minute + 1;
        if (m >= 60) {
            m = 0;
            h = (h + 1) % 24;
        }
        await setSchedule('once', h, m, state.target_temperature);
    };

    if (!state?.connected) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 font-sans">
                <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mb-4">
                            <Thermometer className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-white">STAGG EKG</h1>
                        <p className="text-zinc-500 font-medium">Precision Kettle Controller</p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl">
                        {error && (
                            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                                {error}
                            </div>
                        )}
                        
                        <Button 
                            onClick={handleConnect} 
                            disabled={isConnecting}
                            className="w-full h-16 rounded-2xl text-lg font-bold bg-white text-black hover:bg-zinc-200 transition-all active:scale-95"
                        >
                            {isConnecting ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    Connecting...
                                </div>
                            ) : "Connect Kettle"}
                        </Button>
                    </div>

                    <button 
                        onClick={() => setShowDebug(true)}
                        className="w-full py-4 text-zinc-600 hover:text-zinc-400 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                        <Bug className="w-4 h-4" />
                        Debug Console
                    </button>
                </div>
                {showDebug && <DebugOverlay logs={logs} isDebugMode={isDebugMode} setIsDebugMode={setIsDebugMode} onClear={clearLogs} onClose={() => setShowDebug(false)} />}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 pb-12 font-sans selection:bg-white selection:text-black">
            <header className="flex items-center justify-between mb-8 px-2 pt-4">
                <div>
                    <h1 className="text-xl font-black tracking-tight text-white">STAGG EKG</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Connected</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowDebug(true)} className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 active:scale-90 transition-transform">
                        <Bug className="w-5 h-5" />
                    </button>
                    <button onClick={disconnect} className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 active:scale-90 transition-transform">
                        <Power className="w-5 h-5 text-red-500" />
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto space-y-6">
                {/* Temperature Control */}
                <Card className="p-8 bg-zinc-900 border-zinc-800 rounded-[2.5rem] shadow-2xl">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Target Temperature</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-8xl font-black text-white tabular-nums tracking-tighter">{state.target_temperature}</span>
                            <span className="text-3xl font-bold text-zinc-600">°{state.units === 'celsius' ? 'C' : 'F'}</span>
                        </div>
                        <input 
                            type="range" 
                            min="40" 
                            max="100" 
                            step="0.5"
                            value={state.target_temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full h-12 bg-transparent appearance-none cursor-pointer accent-white [&::-webkit-slider-runnable-track]:bg-zinc-800 [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:-mt-3 [&::-webkit-slider-thumb]:shadow-xl active:[&::-webkit-slider-thumb]:scale-110 transition-all"
                        />
                    </div>
                </Card>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={handleTurnOn}
                        className="flex flex-col items-start p-6 bg-white text-black rounded-[2rem] font-bold transition-all active:scale-95 shadow-xl group"
                    >
                        <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center mb-4 group-hover:bg-black/10 transition-colors">
                            <Power className="w-5 h-5" />
                        </div>
                        <span className="text-lg leading-tight">Quick<br/>Start</span>
                    </button>
                    
                    <button 
                        onClick={() => {}} 
                        className="flex flex-col items-start p-6 bg-zinc-900 border border-zinc-800 text-white rounded-[2rem] font-bold transition-all active:scale-95 group"
                    >
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                            <Clock className="w-5 h-5 text-zinc-400" />
                        </div>
                        <span className="text-lg leading-tight">Set<br/>Schedule</span>
                    </button>
                </div>

                {/* Settings Grid */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] overflow-hidden">
                    <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-zinc-800 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Hold Mode</p>
                                <p className="text-xs text-zinc-500">{state.hold_time_minutes} Minutes</p>
                            </div>
                        </div>
                        <select 
                            value={state.hold_time_minutes}
                            onChange={(e) => setHoldTime(parseInt(e.target.value))}
                            className="bg-zinc-800 text-white text-xs font-bold py-2 px-3 rounded-xl border-none focus:ring-2 focus:ring-white/20"
                        >
                            {[0, 15, 30, 45, 60].map(m => (
                                <option key={m} value={m}>{m}m</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="p-4 grid grid-cols-3 gap-2">
                        <div className="bg-zinc-900 p-4 rounded-2xl text-center border border-zinc-800/50">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1">Altitude</p>
                            <p className="text-sm font-black text-white">{state.altitude_meters}m</p>
                        </div>
                        <div className="bg-zinc-900 p-4 rounded-2xl text-center border border-zinc-800/50">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1">Unit</p>
                            <p className="text-sm font-black text-white uppercase">{state.units === 'celsius' ? '°C' : '°F'}</p>
                        </div>
                        <div className="bg-zinc-900 p-4 rounded-2xl text-center border border-zinc-800/50">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mb-1">Clock</p>
                            <p className="text-sm font-black text-white">{String(state.clock.hour).padStart(2,'0')}:{String(state.clock.minute).padStart(2,'0')}</p>
                        </div>
                    </div>
                </div>
            </main>

            {showDebug && <DebugOverlay logs={logs} isDebugMode={isDebugMode} setIsDebugMode={setIsDebugMode} onClear={clearLogs} onClose={() => setShowDebug(false)} />}
        </div>
    );
}

function DebugOverlay({ logs, isDebugMode, setIsDebugMode, onClear, onClose }: any) {
    return (
        <div className="fixed inset-0 z-[100] bg-zinc-950/95 backdrop-blur-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
                <h2 className="text-sm font-black text-white flex items-center gap-2 uppercase tracking-widest">
                    <Bug className="w-4 h-4" />
                    Debug Console
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>
            
            <div className="p-4 bg-zinc-900/30 border-b border-zinc-800 flex items-center justify-between">
                <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={isDebugMode}
                            onChange={(e) => setIsDebugMode(e.target.checked)}
                        />
                        <div className="w-10 h-6 bg-zinc-800 rounded-full peer peer-checked:bg-white transition-colors"></div>
                        <div className="absolute left-1 top-1 w-4 h-4 bg-zinc-500 rounded-full peer-checked:translate-x-4 peer-checked:bg-black transition-all"></div>
                    </div>
                    <span className="text-xs font-bold text-zinc-400 group-hover:text-white transition-colors">Enable Detailed Logging</span>
                </label>
                <button onClick={onClear} className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-[10px] font-bold text-zinc-400 transition-all uppercase tracking-widest">
                    <Trash2 className="w-3 h-3" />
                    Clear
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px] custom-scrollbar">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                        <Bug className="w-8 h-8 opacity-20" />
                        <p className="font-bold uppercase tracking-widest">No logs recorded</p>
                    </div>
                ) : (
                    logs.map((log: any, i: number) => (
                        <div key={i} className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-xl space-y-1 animate-in slide-in-from-left-2 duration-200" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="flex items-center justify-between">
                                <span className="text-zinc-500 font-bold">[{log.timestamp}]</span>
                                <span className="text-white font-black uppercase tracking-tighter">{log.method}</span>
                            </div>
                            <div className="text-zinc-400 break-all leading-relaxed">{log.args}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
