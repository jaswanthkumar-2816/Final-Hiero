// ============================================================
// Where jobs, companies and applications actually live
// ============================================================
// They used to live in data/*.json — files that are committed to this
// repository. Render deploys from a fresh checkout, so every deploy restored
// those files to whatever git had and destroyed everything real people had
// created since: jobs posted from the Connect portal, applications, the lot.
// Production was serving the same 22 seed rows from September all along.
//
// MongoDB is already connected and already survives deploys — the recruiter
// accounts and access requests made today are proof. So the same three lists
// are kept there instead.
//
// The shape on disk is kept: one document per list, holding the array. That
// is not how you would design this from scratch, but it means every caller in
// opportunities.js keeps its synchronous read and write, and a storage change
// does not become a rewrite of the routes that read it.

const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    key: { type: String, required: true, unique: true, index: true },
    data: { type: Array, default: [] },
    updatedAt: { type: Date, default: Date.now }
}, { minimize: false });

const Datastore = mongoose.models.Datastore || mongoose.model('Datastore', schema);

const KEYS = ['opportunities', 'companies', 'applications', 'employees', 'attendance'];

// Read from memory so callers stay synchronous; Mongo is the durable copy.
const cache = { opportunities: [], companies: [], applications: [], employees: [], attendance: [] };
let ready = false;

async function hydrate() {
    if (mongoose.connection.readyState !== 1) return false;
    try {
        for (const key of KEYS) {
            const row = await Datastore.findOne({ key });
            cache[key] = row && Array.isArray(row.data) ? row.data : [];
        }
        ready = true;
        console.log('[Store] Loaded from MongoDB —',
            KEYS.map(k => `${k}: ${cache[k].length}`).join(', '));
        return true;
    } catch (e) {
        console.error('[Store] Could not load:', e.message);
        return false;
    }
}

function read(key) {
    return cache[key] || [];
}

// Written through to Mongo without being awaited: a request should not wait
// on the database to answer, and a failed write is logged rather than
// swallowed. The in-memory copy is updated either way, so a read right after
// a write sees it.
function write(key, data) {
    cache[key] = Array.isArray(data) ? data : [];
    if (mongoose.connection.readyState !== 1) {
        console.warn(`[Store] MongoDB is not connected; ${key} was not saved.`);
        return cache[key];
    }
    Datastore.updateOne(
        { key },
        { $set: { data: cache[key], updatedAt: new Date() } },
        { upsert: true }
    ).catch(e => console.error(`[Store] Could not save ${key}:`, e.message));
    return cache[key];
}

function isReady() {
    return ready;
}

module.exports = { hydrate, read, write, isReady, KEYS };
