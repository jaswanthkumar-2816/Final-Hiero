// ============================================================
// Connect — the people you have already hired
// ============================================================
// Connect ran the hiring half: post a role, read the applies, send the
// interview. This is the other half starting — who works here, and who turned
// up.
//
// Employees come from applications wherever possible. Somebody who applied is
// already in the system with their name, phone, resume and interview result;
// typing them in again would lose all of that and create a second, slightly
// different version of the same person.
//
// Attendance here is marked by hand. The module page promises punches pulled
// from a biometric device, and that is still the right end state — but every
// manufacturer speaks its own protocol and it cannot be written honestly
// without one on the desk. A salon owner with no device still needs to know
// who came in, so marking it takes thirty seconds a morning and the device
// can fill the same records later.

const express = require('express');
const router = express.Router();

const { requireRecruiter } = require('./connectAuth');
const store = require('./store');

const STATUSES = ['present', 'absent', 'late', 'leave', 'holiday'];

function nowIso() {
    return new Date().toISOString();
}

// Scope from the token, never from the request. A companyId in a body is the
// caller's claim about themselves.
function employeesFor(recruiter) {
    const companyId = String(recruiter.companyId || '');
    return store.read('employees').filter(e => String(e.companyId) === companyId);
}

function isValidDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

// ------------------------------------------------------------
// GET /api/connect/workforce/employees
// ------------------------------------------------------------
router.get('/employees', requireRecruiter, (req, res) => {
    const includeLeft = String(req.query.includeLeft || '') === 'true';
    const rows = employeesFor(req.recruiter)
        .filter(e => includeLeft || e.status !== 'left')
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    res.json({ success: true, employees: rows });
});

// ------------------------------------------------------------
// POST /api/connect/workforce/employees
// ------------------------------------------------------------
// Either from an application — the normal way — or typed in, for the people
// who were already working there before any of this existed.
router.post('/employees', requireRecruiter, (req, res) => {
    try {
        const body = req.body || {};
        const companyId = String(req.recruiter.companyId || '');
        if (!companyId) {
            return res.status(400).json({ success: false, error: 'This account has no company.' });
        }

        const all = store.read('employees');
        let from = null;

        if (body.applicationId) {
            from = store.read('applications').find(a => a.id === body.applicationId) || null;
            if (!from) return res.status(404).json({ success: false, error: 'No such application.' });
            if (String(from.companyId) !== companyId) {
                return res.status(403).json({ success: false, error: 'That application is not yours.' });
            }
            // Hiring the same person twice is a slip, not an intention.
            const already = all.find(e => e.applicationId === from.id);
            if (already) {
                return res.status(409).json({ success: false, error: `${already.name} is already on your team.` });
            }
        }

        const name = String(body.name || (from && from.studentName) || '').trim();
        if (!name) return res.status(400).json({ success: false, error: 'A name is required.' });

        const employee = {
            id: `emp-${Date.now()}`,
            companyId,
            companyName: req.recruiter.companyName || '',
            applicationId: from ? from.id : null,
            name,
            email: String(body.email || (from && from.email) || '').trim().toLowerCase(),
            phone: String(body.phone || (from && from.phone) || '').trim(),
            role: String(body.role || (from && from.jobTitle) || '').trim(),
            // Kept rather than copied: the resume and the interview stay where
            // they are, and the employee record points at them.
            resumeUrl: (from && from.resumeUrl) || '',
            joinedOn: isValidDate(body.joinedOn) ? body.joinedOn : nowIso().slice(0, 10),
            salary: String(body.salary || '').trim(),
            branch: String(body.branch || '').trim(),
            status: 'active',
            createdAt: nowIso(),
            createdBy: req.recruiter.email || '',
        };

        store.write('employees', [employee, ...all]);

        // The application stops being a candidate and becomes a colleague.
        if (from) {
            const apps = store.read('applications').map(a =>
                a.id === from.id ? { ...a, status: 'selected', hiredAt: nowIso(), employeeId: employee.id } : a);
            store.write('applications', apps);
        }

        console.log(`[Workforce] ${req.recruiter.email} added ${name} to ${companyId}`);
        res.status(201).json({ success: true, employee });
    } catch (e) {
        console.error('[Workforce] create failed:', e.message);
        res.status(500).json({ success: false, error: 'Could not add this person.' });
    }
});

// ------------------------------------------------------------
// PATCH /api/connect/workforce/employees/:id
// ------------------------------------------------------------
router.patch('/employees/:id', requireRecruiter, (req, res) => {
    const companyId = String(req.recruiter.companyId || '');
    const all = store.read('employees');
    const found = all.find(e => e.id === req.params.id && String(e.companyId) === companyId);
    if (!found) return res.status(404).json({ success: false, error: 'No such employee.' });

    const body = req.body || {};
    const next = { ...found };
    for (const field of ['name', 'email', 'phone', 'role', 'salary', 'branch']) {
        if (typeof body[field] === 'string') next[field] = body[field].trim();
    }
    if (isValidDate(body.joinedOn)) next.joinedOn = body.joinedOn;
    // Someone who leaves is marked, never deleted: their attendance and their
    // pay history have to keep making sense after they have gone.
    if (body.status === 'left' || body.status === 'active') next.status = body.status;
    next.updatedAt = nowIso();

    store.write('employees', all.map(e => (e.id === found.id ? next : e)));
    res.json({ success: true, employee: next });
});

// ------------------------------------------------------------
// GET /api/connect/workforce/attendance?from=&to=
// ------------------------------------------------------------
router.get('/attendance', requireRecruiter, (req, res) => {
    const mine = new Set(employeesFor(req.recruiter).map(e => e.id));
    const from = isValidDate(req.query.from) ? req.query.from : null;
    const to = isValidDate(req.query.to) ? req.query.to : null;

    const rows = store.read('attendance').filter(r =>
        mine.has(r.employeeId)
        && (!from || r.date >= from)
        && (!to || r.date <= to));

    res.json({ success: true, attendance: rows });
});

// ------------------------------------------------------------
// POST /api/connect/workforce/attendance
// ------------------------------------------------------------
// One record per person per day. Marking the same day again corrects it
// rather than recording them as having turned up twice.
router.post('/attendance', requireRecruiter, (req, res) => {
    try {
        const body = req.body || {};
        const date = isValidDate(body.date) ? body.date : nowIso().slice(0, 10);
        const status = STATUSES.includes(body.status) ? body.status : null;
        if (!status) {
            return res.status(400).json({ success: false, error: `Status must be one of: ${STATUSES.join(', ')}.` });
        }

        const mine = new Set(employeesFor(req.recruiter).map(e => e.id));
        const employeeId = String(body.employeeId || '');
        if (!mine.has(employeeId)) {
            return res.status(404).json({ success: false, error: 'No such employee.' });
        }

        // Tomorrow's attendance is not a fact anyone has yet.
        if (date > nowIso().slice(0, 10)) {
            return res.status(400).json({ success: false, error: 'That day has not happened yet.' });
        }

        const all = store.read('attendance');
        const record = {
            id: `att-${employeeId}-${date}`,
            employeeId,
            date,
            status,
            note: String(body.note || '').trim(),
            markedAt: nowIso(),
            markedBy: req.recruiter.email || '',
        };

        const without = all.filter(r => !(r.employeeId === employeeId && r.date === date));
        store.write('attendance', [record, ...without]);

        res.json({ success: true, record });
    } catch (e) {
        console.error('[Workforce] attendance failed:', e.message);
        res.status(500).json({ success: false, error: 'Could not save that.' });
    }
});

module.exports = router;
