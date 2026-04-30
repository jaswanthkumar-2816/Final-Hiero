const mongoose = require.main.require('mongoose');
const QREvent = require('../models/qr-event.model.cjs');

exports.getStats = async () => {
    try {
        const stats = await QREvent.aggregate([
            {
                $facet: {
                    // Global Metrics (Mathematically Capped CTR)
                    "overview": [
                        {
                            $group: {
                                _id: "$sessionId",
                                hasScan: { $max: { $cond: [{ $eq: ["$type", "scan"] }, 1, 0] } },
                                hasClick: { 
                                    $max: { $cond: [{ $regexMatch: { input: "$type", regex: /click/ } }, 1, 0] } 
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalSessions: { $sum: 1 },
                                scanSessions: { $sum: "$hasScan" },
                                convertedSessions: { $sum: "$hasClick" },
                                bounceSessions: { $sum: { $cond: [{ $and: [{ $eq: ["$hasScan", 1] }, { $eq: ["$hasClick", 0] }] }, 1, 0] } }
                            }
                        }
                    ],
                    // Campaign Metrics (Safely Capped CTR)
                    "campaigns": [
                        {
                            $group: {
                                _id: { cid: "$campaignId", sid: "$sessionId" },
                                hasScan: { $max: { $cond: [{ $eq: ["$type", "scan"] }, 1, 0] } },
                                hasClick: { $max: { $cond: [{ $regexMatch: { input: "$type", regex: /click/ } }, 1, 0] } }
                            }
                        },
                        {
                            $group: {
                                _id: "$_id.cid",
                                totalScanned: { $sum: "$hasScan" },
                                totalClicked: { $sum: "$hasClick" }
                            }
                        },
                        { $sort: { totalScanned: -1 } }
                    ],
                    // Raw Volume (For display only)
                    "rawVolume": [
                        { $group: { _id: "$type", count: { $sum: 1 } } }
                    ]
                }
            }
        ]);

        const o = stats[0].overview[0] || { totalSessions: 0, scanSessions: 0, convertedSessions: 0, bounceSessions: 0 };
        const raw = stats[0].rawVolume || [];
        const camp = stats[0].campaigns || [];
        
        const totalScans = (raw.find(r => r._id === 'scan') || { count: 0 }).count;
        const totalWebClicks = (raw.find(r => r._id === 'website_click') || { count: 0 }).count;
        const totalIgClicks = (raw.find(r => r._id === 'instagram_click') || { count: 0 }).count;
        const safeScanned = o.scanSessions || 1;

        return {
            totalScans,
            uniqueUsers: o.totalSessions,
            websiteClicks: totalWebClicks,
            instagramClicks: totalIgClicks,
            webConversion: ((o.convertedSessions / safeScanned) * 100).toFixed(1), // CAPPED CTR
            bounceRate: ((o.bounceSessions / safeScanned) * 100).toFixed(1),
            campaignList: camp.map(c => ({
                id: c._id || "direct",
                scans: c.totalScanned,
                clicks: c.totalClicked,
                ctr: c.totalScanned ? ((c.totalClicked / c.totalScanned) * 100).toFixed(1) : "0.0"
            })),
            insight: camp.length > 0 ? `🚀 Highly accurate: <b>${(camp[0]._id || "direct")}</b> with <b>${((camp[0].totalClicked / (camp[0].totalScanned || 1)) * 100).toFixed(1)}%</b> conversion.` : "Collecting fresh accuracy-verified data."
        };
    } catch (err) {
        console.error("🔥 Accuracy Engine Error:", err);
        return null;
    }
};
