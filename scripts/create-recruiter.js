#!/usr/bin/env node
// ============================================================
// Create a Connect recruiter account.
// ============================================================
// This script IS the invite. Connect has no public signup, so a company
// reaches the portal only because it was created here.
//
//   node scripts/create-recruiter.js --email hr@acme.com --company "Acme Corp"
//
// Options:
//   --email     (required) the recruiter's work email
//   --company   (required) company name, shown in the portal
//   --name      the person's name           (default: derived from the email)
//   --role      recruiter | admin           (default: recruiter)
//   --password  set one explicitly          (default: a random temporary one)
//   --reset     update the password of an account that already exists
//
// The temporary password is printed once. Send it over a channel the
// recruiter already trusts, not the same mailbox you are granting access to
// if you can avoid it. They are forced to change it on first sign-in.
// ============================================================

const path = require('path');
const crypto = require('crypto');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const RecruiterAccount = require('../models/RecruiterAccount');

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        if (!token.startsWith('--')) continue;
        const key = token.slice(2);
        const next = argv[i + 1];
        if (next === undefined || next.startsWith('--')) {
            args[key] = true;
        } else {
            args[key] = next;
            i += 1;
        }
    }
    return args;
}

// Ambiguous characters left out so the password survives being read aloud.
function temporaryPassword() {
    const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(20);
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
}

function companyIdFrom(companyName) {
    const slug = String(companyName)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return slug ? `c-${slug}` : `c-${Date.now()}`;
}

function nameFromEmail(email) {
    return String(email)
        .split('@')[0]
        .split(/[._-]/)
        .filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

async function main() {
    const args = parseArgs(process.argv.slice(2));
    const email = String(args.email || '').trim().toLowerCase();
    const company = String(args.company || '').trim();

    if (!email || !email.includes('@')) {
        console.error('Need --email <work email>');
        process.exit(1);
    }
    if (!company && !args.reset) {
        console.error('Need --company "<company name>"');
        process.exit(1);
    }
    if (args.role && !['recruiter', 'admin'].includes(args.role)) {
        console.error('--role must be recruiter or admin');
        process.exit(1);
    }

    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set in .env');
        process.exit(1);
    }

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

    const existing = await RecruiterAccount.findOne({ email });
    if (existing && !args.reset) {
        console.error(`An account already exists for ${email}.`);
        console.error('Use --reset to set a new password for it.');
        await mongoose.disconnect();
        process.exit(1);
    }

    const password = typeof args.password === 'string' ? args.password : temporaryPassword();
    const generated = typeof args.password !== 'string';
    const passwordHash = await bcrypt.hash(password, 12);

    let account;
    if (existing) {
        existing.passwordHash = passwordHash;
        existing.mustChangePassword = generated;
        existing.status = 'active';
        if (company) {
            existing.companyName = company;
            existing.companyId = companyIdFrom(company);
        }
        account = await existing.save();
    } else {
        account = await RecruiterAccount.create({
            email,
            passwordHash,
            name: String(args.name || nameFromEmail(email)),
            companyId: companyIdFrom(company),
            companyName: company,
            role: String(args.role || 'recruiter'),
            status: 'active',
            mustChangePassword: generated
        });
    }

    console.log('');
    console.log(existing ? 'Password reset.' : 'Recruiter account created.');
    console.log('  email      ', account.email);
    console.log('  name       ', account.name);
    console.log('  company    ', `${account.companyName} (${account.companyId})`);
    console.log('  role       ', account.role);
    if (generated) {
        console.log('  password   ', password);
        console.log('');
        console.log('  Shown once. Send it over a channel they already trust.');
        console.log('  They must change it on first sign-in.');
    }
    console.log('');

    await mongoose.disconnect();
}

main().catch(async err => {
    console.error('Failed:', err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
});
