const analyticsService = require('../services/analytics.service.cjs');

exports.getDashboard = async (req, res) => {
    try {
        const s = await analyticsService.getStats();
        if (!s) return res.status(500).send("Sync Error");

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hiero | Internal Pulse</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #050505; color: #fff; cursor: default; }
        .glass-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; position: relative; overflow: hidden; }
        .gradient-green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
        .noise-bg::before {
            content: ""; position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)" /%3E%3C/svg%3E');
            opacity: 0.05; pointer-events: none; z-index: 50; mix-blend-mode: overlay;
        }
    </style>
</head>
<body class="noise-bg pb-20">

    <!-- GLOBAL HEADER -->
    <header class="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-[100]">
        <div class="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            <div class="flex items-center gap-8">
                <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center overflow-hidden">
                        <img src="/logo-hiero.png" alt="Hiero Logo" class="w-full h-full object-cover">
                    </div>
                    <span class="text-xl font-black tracking-tighter uppercase italic">HIERO</span>
                </div>
                <nav class="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-white/40">
                    <a href="#" class="text-emerald-400 border-b-2 border-emerald-500 pb-5 translate-y-[2px]">Dashboard</a>
                    <a href="#" class="hover:text-white transition-colors pb-5 translate-y-[2px]">Analytics</a>
                    <a href="#" class="hover:text-white transition-colors pb-5 translate-y-[2px]">Resumes</a>
                </nav>
            </div>
            <div class="flex items-center gap-4">
                <div class="relative hidden lg:block">
                    <input type="text" placeholder="Global search..." class="w-64 bg-white/5 border border-white/10 rounded-lg px-4 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50">
                </div>
                <button class="px-4 py-1.5 rounded-lg bg-emerald-500 text-black text-xs font-black tracking-wide uppercase">New Analysis</button>
            </div>
        </div>
    </header>

    <main class="max-w-[1400px] mx-auto px-6 pt-12">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
                <h1 class="text-4xl font-black tracking-tighter mb-2">Internal Pulse</h1>
                <p class="text-white/40 text-sm font-medium">Real-time ecosystem intelligence and kinetic performance metrics.</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span class="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live Monitoring</span>
                </div>
                <div class="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 flex items-center gap-2">
                    <svg class="w-3 h-3 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Last 24 Hours</span>
                </div>
            </div>
        </div>

        <!-- TOP METRICS GRID -->
        <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            <div class="glass-card p-6">
                <div class="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-4">Total Scans</div>
                <div class="flex items-end justify-between">
                    <div class="text-3xl font-black">${s.totalScans}</div>
                    <div class="text-[10px] text-emerald-400 font-bold mb-1">+12.4%</div>
                </div>
                <div class="absolute -bottom-2 -right-2 opacity-5">
                    <svg class="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
            </div>

            <div class="glass-card p-6">
                <div class="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-4">Unique Users</div>
                <div class="flex items-end justify-between">
                    <div class="text-3xl font-black">${s.uniqueUsers}</div>
                    <div class="text-[10px] text-emerald-400 font-bold mb-1">+8.1%</div>
                </div>
                <div class="absolute -bottom-2 -right-2 opacity-5">
                    <svg class="w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
            </div>

            <div class="glass-card p-6">
                <div class="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-4">Website Clicks</div>
                <div class="flex items-end justify-between">
                    <div class="text-3xl font-black">${s.websiteClicks}</div>
                    <div class="text-[10px] text-red-400 font-bold mb-1">-2.3%</div>
                </div>
                 <div class="absolute -bottom-2 -right-2 opacity-5">
                    <svg class="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
            </div>

            <div class="glass-card p-6">
                <div class="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-4">Instagram Clicks</div>
                <div class="flex items-end justify-between">
                    <div class="text-3xl font-black">${s.instagramClicks}</div>
                    <div class="text-[10px] text-emerald-400 font-bold mb-1">+24.8%</div>
                </div>
                <div class="absolute -bottom-2 -right-2 opacity-5">
                    <svg class="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/></svg>
                </div>
            </div>

            <div class="glass-card p-6 border-emerald-500/20">
                <div class="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-4">Conversion %</div>
                <div class="flex items-end justify-between">
                    <div class="text-3xl font-black text-emerald-400">${s.webConversion}%</div>
                    <div class="text-[10px] text-emerald-400 font-bold mb-1">Optimal</div>
                </div>
                 <div class="absolute -bottom-2 -right-2 opacity-5">
                    <svg class="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
            </div>

            <div class="glass-card p-6">
                <div class="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-4">Bounce Rate</div>
                <div class="flex items-end justify-between">
                    <div class="text-3xl font-black">${s.bounceRate}%</div>
                    <div class="text-[10px] text-emerald-400 font-bold mb-1">-4.5%</div>
                </div>
                <div class="absolute -bottom-2 -right-2 opacity-5">
                    <svg class="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                </div>
            </div>
        </div>

        <!-- CAMPAIGN ATTRIBUTION SECTION -->
        <div class="glass-card mb-12">
            <div class="p-8 border-b border-white/5 flex items-center justify-between">
                <h3 class="text-lg font-black tracking-tight">Campaign Attribution</h3>
                <button class="text-[10px] font-black tracking-widest uppercase text-white/40 hover:text-white">Download Report</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] font-black uppercase tracking-widest text-white/20">
                            <th class="px-8 py-4">Source</th>
                            <th class="px-8 py-4">Impressions</th>
                            <th class="px-8 py-4">CTR</th>
                            <th class="px-8 py-4">Conversions</th>
                            <th class="px-8 py-4">Revenue (est)</th>
                            <th class="px-8 py-4 text-right">Trend</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        ${s.campaignList.map(c => `
                            <tr class="group hover:bg-white/[0.02] transition-colors">
                                <td class="px-8 py-6 flex items-center gap-4">
                                    <div class="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                                        <svg class="w-4 h-4 text-white/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                                    </div>
                                    <span class="font-bold text-sm text-white/80">${c.id === 'direct' ? 'Direct Entry' : c.id}</span>
                                </td>
                                <td class="px-8 py-6 text-sm font-medium text-white/60">${c.scans * 100}</td>
                                <td class="px-8 py-6 text-sm font-black text-emerald-400">${c.ctr}%</td>
                                <td class="px-8 py-6 text-sm font-medium text-white/80">${c.clicks} <span class="bg-emerald-500/10 text-emerald-400 text-[10px] px-1 rounded ml-2">High</span></td>
                                <td class="px-8 py-6 text-sm font-medium text-white/60">$${(c.clicks * 2.4).toFixed(2)}</td>
                                <td class="px-8 py-6 text-right">
                                    <div class="inline-flex gap-0.5 items-end h-6">
                                        <div class="w-1.5 h-3 bg-white/10 rounded-t-sm"></div>
                                        <div class="w-1.5 h-4 bg-white/10 rounded-t-sm"></div>
                                        <div class="w-1.5 h-2 bg-white/10 rounded-t-sm"></div>
                                        <div class="w-1.5 h-5 bg-emerald-500 rounded-t-sm"></div>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- BOTTOM GRID -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="glass-card p-8">
                <div class="flex items-center justify-between mb-8">
                    <h3 class="text-lg font-black tracking-tight">Kinetic Traffic Flow</h3>
                    <span class="text-[10px] font-black tracking-widest uppercase text-white/20">Last 30 Days</span>
                </div>
                <div class="h-48 flex items-end gap-2 pb-2">
                    ${[10, 40, 30, 20, 80, 50, 40, 90].map(h => `
                        <div class="flex-1 rounded-t-md transition-all duration-500 hover:brightness-125 ${h > 70 ? 'bg-emerald-400' : 'bg-white/5'}" style="height: ${h}%"></div>
                    `).join('')}
                </div>
            </div>

            <div class="glass-card p-8">
                <h3 class="text-lg font-black tracking-tight mb-2">System Health</h3>
                <p class="text-white/40 text-xs font-medium mb-8">AI processing latency and node distribution.</p>
                
                <div class="space-y-6">
                    <div>
                        <div class="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                            <span>Analysis Latency</span>
                            <span class="text-emerald-400">120ms</span>
                        </div>
                        <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500 w-[92%]"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                            <span>Model Confidence</span>
                            <span class="text-emerald-400">99.4%</span>
                        </div>
                        <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500 w-[99%]"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                            <span>Worker Capacity</span>
                            <span class="text-emerald-400">52%</span>
                        </div>
                        <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div class="h-full bg-emerald-500 w-[52%]"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <footer class="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-8 text-[10px] font-black tracking-widest uppercase text-white/20">
            <div>© 2026 AI KINETIC INTELLIGENCE. ALL RIGHTS RESERVED.</div>
            <div class="flex flex-wrap gap-8">
                <a href="#">Documentation</a>
                <a href="#">API Status</a>
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
            </div>
        </footer>
    </main>

</body>
</html>`;
        res.send(html);
    } catch (e) { res.status(500).send("Database Error"); }
};
