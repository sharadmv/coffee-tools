import { Thermometer, MessageSquare, Coffee, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export default function App() {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 font-sans selection:bg-white selection:text-black">
            <div className="max-w-3xl w-full space-y-12">
                <header className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 mb-2 shadow-2xl">
                        <Coffee className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Fellow Coffee Tools</h1>
                    <p className="text-zinc-500 font-semibold uppercase tracking-widest text-sm">Select an application to begin</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Stagg EKG Pro */}
                    <a href="stagg.html" className="group block">
                        <Card className="p-8 h-full bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all rounded-[2.5rem] shadow-2xl group-active:scale-[0.98]">
                            <div className="w-14 h-14 bg-zinc-800 rounded-2xl flex items-center justify-center mb-8 text-white group-hover:scale-110 transition-transform">
                                <Thermometer className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black mb-3 tracking-tight uppercase">Stagg EKG Pro</h2>
                            <p className="text-zinc-500 font-medium leading-relaxed text-sm">
                                Remote control, precise temperature monitoring, and scheduling for your kettle.
                            </p>
                            <div className="mt-8 flex items-center text-xs font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-white transition-colors">
                                Open Controller
                                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Card>
                    </a>

                    {/* Coffee Assistant */}
                    <a href="assistant.html" className="group block">
                        <Card className="p-8 h-full bg-zinc-900 border-zinc-800 hover:border-amber-900/40 transition-all rounded-[2.5rem] shadow-2xl group-active:scale-[0.98]">
                            <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-8 text-amber-500 group-hover:scale-110 transition-transform">
                                <MessageSquare className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black mb-3 tracking-tight text-amber-500 uppercase">Coffee Assistant</h2>
                            <p className="text-zinc-500 font-medium leading-relaxed text-sm">
                                Interactive brewing assistant powered by Gemini Live for recipes and logs.
                            </p>
                            <div className="mt-8 flex items-center text-xs font-black uppercase tracking-[0.2em] text-amber-600 group-hover:text-amber-400 transition-colors">
                                Start Chatting
                                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Card>
                    </a>
                </div>

                <footer className="text-center">
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Built for precision coffee brewing</p>
                </footer>
            </div>
        </div>
    );
}
