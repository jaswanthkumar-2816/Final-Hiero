// ============================================================
// Look at, and restore, a Connect recruiter sign-in
// ============================================================
// Removing a company from the access list disables its account rather than
// deleting it, so the company's job posts and applicants survive. Turning one
// back on is this script: the password is untouched by disabling, so the
// company's existing password works again the moment it is active.
//
//   node scripts/recruiter-status.js                  list the disabled ones
//   node scripts/recruiter-status.js --all            list every account
//   node scripts/recruiter-status.js --activate a@b   turn one back on
//
// Nothing is written unless --activate is given.

require('dotenv').config();
const mongoose = require('mongoose');
const RecruiterAccount = require('../models/RecruiterAccount');

const args = process.argv.slice(2);
const activate = args.includes('--activate') ? args[args.indexOf('--activate') + 1] : null;
const all = args.includes('--all');

(async () => {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
        console.error('No MONGODB_URI in the environment.');
        process.exit(1);
    }
    await mongoose.connect(uri);

    if (activate) {
        const email = String(activate).trim().toLowerCase();
        const account = await RecruiterAccount.findOne({ email });
        if (!account) {
            console.error(`No account for ${email}.`);
            process.exit(1);
        }
        if (account.status === 'active') {
            console.log(`${email} is already active. Nothing to do.`);
        } else {
            account.status = 'active';
            await account.save();
            console.log(`${email} (${account.companyName}) can sign in again, with the password they already had.`);
        }
        await mongoose.disconnect();
        return;
    }

    const rows = await RecruiterAccount.find(all ? {} : { status: 'disabled' }).sort({ companyName: 1 });
    if (!rows.length) {
        console.log(all ? 'No accounts at all.' : 'No disabled accounts.');
    } else {
        console.log(`${rows.length} account${rows.length === 1 ? '' : 's'}:\n`);
        for (const r of rows) {
            console.log(`  ${r.status.padEnd(8)}  ${r.companyName.padEnd(26)}  ${r.email}`);
        }
    }
    await mongoose.disconnect();
})().catch(e => {
    console.error(e.message);
    process.exit(1);
});
