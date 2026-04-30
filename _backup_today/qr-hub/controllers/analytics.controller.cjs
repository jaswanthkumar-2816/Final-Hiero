const analyticsService = require('../services/analytics.service.cjs');

exports.getDashboard = async (req, res) => {
    try {
        const s = await analyticsService.getStats();
        if (!s) return res.status(500).send("Sync Error");

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hiero QR Analytics | Pro</title>
    <style>
        :root { --bg: #050505; --card: #0e0e0e; --border: #1a1a1a; --text: #eee; --green: #00ff7f; --red: #ff3e3e; --accent: #fff; }
        body { background: var(--bg); color: var(--text); font-family: -apple-system, system-ui, sans-serif; padding: 40px; margin: 0; line-height: 1.5; }
        .container { max-width: 1000px; margin: 0 auto; }
        
        .insight-bar { background: rgba(0,255,127,0.05); border: 1px solid rgba(0,255,127,0.1); padding: 18px 24px; border-radius: 12px; margin-bottom: 40px; font-size: 16px; color: #aaa; text-align: center; }
        .insight-bar b { color: var(--green); }

        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 40px; }
        .card { background: var(--card); border: 1px solid var(--border); padding: 32px; border-radius: 16px; }
        .label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #555; margin-bottom: 12px; letter-spacing: 1px; }
        .val { font-size: 40px; font-weight: 900; letter-spacing: -1.5px; }
        
        table { width: 100%; border-collapse: collapse; background: var(--card); border-radius: 16px; overflow: hidden; border: 1px solid var(--border); }
        th { text-align: left; background: #0c0c0c; padding: 20px; font-size: 12px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
        td { padding: 20px; border-top: 1px solid var(--border); font-size: 15px; }

        .green { color: var(--green); }
        .red { color: var(--red); }
        h1 { font-size: 32px; font-weight: 900; letter-spacing: -1.5px; margin-bottom: 12px; }
        h2 { font-size: 20px; font-weight: 800; margin-bottom: 24px; color: #555; text-transform: uppercase; letter-spacing: 1px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Overview</h1>
        
        <div class="insight-bar">${s.insight}</div>

        <div class="grid">
            <div class="card"><div class="label">Total Scans</div><div class="val">${s.totalScans}</div></div>
            <div class="card"><div class="label">Unique Users</div><div class="val">${s.uniqueUsers}</div></div>
            <div class="card"><div class="label">Website Clicks</div><div class="val">${s.websiteClicks}</div></div>
            <div class="card"><div class="label">Instagram Clicks</div><div class="val">${s.instagramClicks}</div></div>
            <div class="card"><div class="label">Website Conversion %</div><div class="val green">${s.webConversion}%</div></div>
            <div class="card"><div class="label">Bounce Rate %</div><div class="val red">${s.bounceRate}%</div></div>
        </div>

        <h2>Campaign Attribution</h2>
        <table>
            <thead><tr><th>Campaign</th><th>Scans</th><th>Clicks</th><th>CTR %</th></tr></thead>
            <tbody>
                ${s.campaignList.length ? s.campaignList.map(c => `
                    <tr><td><b>${c.id}</b></td><td>${c.scans}</td><td>${c.clicks}</td><td class="green"><b>${c.ctr}%</b></td></tr>
                `).join('') : '<tr><td colspan="4" style="text-align:center; padding: 40px; color:#333">No campaign data recorded.</td></tr>'}
            </tbody>
        </table>
        
        <div style="margin-top: 60px; font-size: 11px; color:#222; text-align:center;">Hiero Analytics Core • Minimal v9.0</div>
    </div>
</body>
</html>`;
        res.send(html);
    } catch (e) { res.status(500).send("Database Error"); }
};
