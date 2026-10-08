/**
 * Panel interview: three interviewers, one per question, each owning a domain.
 *
 * The point of a panel is not variety of voice — it is that a voice change
 * MEANS something. A candidate who hears a new voice for no reason reads it as
 * a glitch, which is exactly the complaint the single-voice build attracted
 * ("asking the same question with the different voice"). So three rules hold
 * throughout:
 *
 *   1. The panel is announced up front, so later changes are expected.
 *   2. A member owns a domain. The voice changes because the subject changed.
 *   3. Whoever asks a question handles its follow-ups and rephrasings. You are
 *      never handed to someone else mid-thought.
 *
 * Handoffs are spoken by the INCOMING member ("Thanks Sarah — Marcus here"),
 * never the outgoing one. That keeps each turn a single TTS call in a single
 * voice: a two-voice handoff would double the latency before every question
 * and need audio stitching for no real gain.
 */

// Voices are Deepgram Aura-1. Aura-2 sounds better in isolation but
// synthesises 6-8x slower on a real question -- measured at 3.2-3.8s against
// 0.4-0.6s for the same text -- and that silence lands on top of question
// generation. Three seconds of nothing before every question reads as the
// product being broken, which is worth more than the quality difference. The three are kept
// maximally distinguishable — two American, one British, mixed gender — because
// over a laptop speaker similar voices defeat the whole purpose.
//
// Names and photos are deliberately in one place: edit them here and nothing
// else needs to change. Note Aura has no Indian-accent English voice, so the
// panel's faces and accents do not match; the nearest non-Western option in the
// catalogue is Filipino (aura-2-amalthea-en).
const PANEL = [
    {
        id: 'core',
        name: 'Ananya',
        fullName: 'Ananya Rao',
        role: 'Senior Software Engineer',
        domain: 'the fundamentals and the coding side',
        photo: '/mock_interview/panel/ananya-916.webp',
        gender: 'female',
        voiceId: 'aura-asteria-en',       // American, warm and clear
        owns: ['technical', 'problem_solving', 'coding', 'dsa'],
        prefersDifficulty: ['warm-up', 'easy']
    },
    {
        id: 'design',
        name: 'Rohan',
        fullName: 'Rohan Mehta',
        role: 'Principal Engineer',
        domain: 'architecture and how things hold up at scale',
        photo: '/mock_interview/panel/rohan-916.webp',
        gender: 'male',
        voiceId: 'aura-zeus-en',        // American, deep and authoritative
        // Also claims the meatier technical questions. Routing on category
        // alone starved the architect of turns -- the bank is 25 technical to
        // 5 design -- and banding him on 'hard' did not help either, because
        // in practice the engine only ever emits warm-up, easy and medium. So
        // he takes technical from medium upward, which both fixes the
        // starvation and matches what a principal engineer does on a panel:
        // the senior engineer opens on fundamentals, he takes the depth.
        owns: ['system_design', 'architecture', 'scalability', 'technical'],
        prefersDifficulty: ['medium', 'hard']
    },
    {
        id: 'people',
        name: 'Karan',
        fullName: 'Karan Nair',
        role: 'Engineering Manager',
        domain: 'how you work with a team',
        photo: '/mock_interview/panel/karan-916.webp',
        gender: 'male',
        voiceId: 'aura-helios-en',         // British, warm/approachable — distinct from Rohan
        owns: ['behavioral', 'behavioural', 'culture', 'leadership', 'ownership']
    }
];

const PANEL_BY_ID = new Map(PANEL.map(m => [m.id, m]));

/** Deterministic pick from a list, so a session replays identically. */
function pick(list, seed) {
    return list[Math.abs(seed) % list.length];
}

/**
 * The panel attached to a new session, sized to the interview.
 *
 * A member who is introduced and then never speaks is worse than no panel at
 * all: the greeting promises someone who never arrives. A short interview does
 * not generate enough questions to reach every domain -- a 5-minute run asks
 * ~6 questions and typically never produces a system-design one -- so short
 * sessions get a two-person panel and the architecture domain folds into the
 * engineer's. That also matches how real screens work: you meet one or two
 * people in a short call, the full panel in a long one.
 */
function buildPanel(questionLimit) {
    const limit = Number(questionLimit) || 0;
    if (limit && limit <= 6) {
        const core = { ...PANEL[0] };
        const design = PANEL[1];
        core.owns = [...new Set([...core.owns, ...design.owns])];
        core.prefersDifficulty = [];   // she takes the whole range on her own
        core.domain = 'the technical side, from fundamentals through to design';
        return [core, { ...PANEL[2] }];
    }
    return PANEL.map(m => ({ ...m }));
}

/**
 * Who asks this question. Routing is by the question's own category, which the
 * engine already sets ('technical', 'system_design', 'problem_solving',
 * 'behavioral'), so the voice follows the subject rather than a rota.
 *
 * Falls back to round-robin for anything uncategorised, so an unknown category
 * still rotates the panel instead of pinning every question on one member.
 */
function memberForQuestion(panel, question, questionIndex, opts) {
    const list = (panel && panel.length) ? panel : PANEL;
    const options = opts || {};
    const seen = options.seen instanceof Set ? options.seen : new Set(options.seen || []);
    const limit = Number(options.questionLimit) || 0;
    const index = Number(questionIndex) || 1;

    // Coverage guarantee. The greeting names everyone on the panel, so everyone
    // named has to actually speak -- and the question engine does not promise
    // to cover every domain. A 15-minute run frequently produces no
    // system-design question at all, which left the architect introduced and
    // then silent for the whole interview. So once there are only as many
    // questions left as there are members yet to speak, the next one goes to a
    // member who has not spoken, whatever its category. A principal engineer
    // asking about fundamentals is ordinary; being promised someone who never
    // appears is not.
    if (limit && seen.size) {
        const unseen = list.filter(m => !seen.has(m.id));
        if (unseen.length && (limit - index + 1) <= unseen.length) {
            return unseen[0];
        }
    }

    const category = String((question && (question.category || question.skill)) || '')
        .toLowerCase().trim();
    const difficulty = String((question && question.difficulty) || '').toLowerCase().trim();

    if (category) {
        let best = null, bestScore = 0;
        for (const m of list) {
            if (!(m.owns || []).some(c => category.includes(c))) continue;
            // Owns the category outright, or owns it but outside their
            // difficulty band -- in which case a better-matched member wins.
            let score = 1;
            if (m.prefersDifficulty && m.prefersDifficulty.length) {
                score = m.prefersDifficulty.includes(difficulty) ? 2 : 0.5;
            }
            if (score > bestScore) { best = m; bestScore = score; }
        }
        if (best) return best;
    }
    return list[Math.max(0, index - 1) % list.length];
}

/**
 * The panel introduction, spoken by the first member at the start.
 *
 * This is the load-bearing part of the illusion. A candidate told up front that
 * three people are in the room hears the second voice as the panel working as
 * described; a candidate told nothing hears a bug.
 */
function panelIntroLine(panel, candidateName, jobRole, companyName) {
    const list = (panel && panel.length) ? panel : PANEL;
    const host = list[0];
    const others = list.slice(1);

    const othersSpoken = others.length === 1
        ? others[0].name
        : others.slice(0, -1).map(m => m.name).join(', ')
          + ' and ' + others[others.length - 1].name;

    // Kept deliberately short. Aura-2 synthesises at roughly 30ms per
    // character, so the earlier wording -- 327 characters once the panel was
    // named -- took over ten seconds and regularly exceeded the request
    // budget. The greeting then arrived with no audio and the client read it
    // out in the browser's own voice, which is how a female interviewer came
    // out sounding male on the very first thing a candidate hears.
    const firstName = String(candidateName || '').trim().split(/\s+/)[0] || 'there';

    return `Hello ${firstName}, welcome. I am ${host.name}, ${host.role}. `
        + `${othersSpoken} will join us later. Take a moment to settle in. `;
}

/**
 * What the incoming member says before their question.
 *
 *  - same member again      -> nothing, or a short connector
 *  - first time this member -> thanks the previous one, introduces themselves
 *  - returning member       -> a brief re-identification, no second introduction
 */
function openerFor({ member, previousMember, seenIds, questionIndex }) {
    if (!member) return '';
    const seen = seenIds instanceof Set ? seenIds : new Set(seenIds || []);
    const sameAsLast = previousMember && previousMember.id === member.id;

    if (sameAsLast) {
        // The same person continuing. A connector occasionally, mostly nothing:
        // a preamble on every single turn gets grating fast.
        if (questionIndex % 3 !== 0) return '';
        return pick(['Alright. ', 'Good. ', 'Thanks. '], questionIndex);
    }

    const thanks = previousMember
        ? pick([
            `Thanks, ${previousMember.name}. `,
            `Thank you ${previousMember.name}. `,
            `Great, thanks ${previousMember.name}. `
          ], questionIndex)
        : '';

    if (!seen.has(member.id)) {
        return thanks + pick([
            `${member.name} here — I look after ${member.domain}. `,
            `I am ${member.name}, ${member.role}. I cover ${member.domain}. `,
            `${member.name} speaking. My side of this is ${member.domain}. `
        ], questionIndex);
    }

    return thanks + pick([
        `${member.name} again. `,
        `Back to me for a moment — ${member.name}. `,
        `${member.name} here once more. `
    ], questionIndex);
}

/** The public shape handed to the client so it can show who is speaking. */
function publicMember(member) {
    if (!member) return null;
    const { id, name, fullName, role, voiceId, photo, gender } = member;
    return { id, name, fullName, role, voiceId, photo, gender };
}

function publicPanel(panel) {
    // No fallback to the default panel here. An empty panel means the session
    // opted out, and substituting the default would make a single-voice
    // interview render three faces that never speak.
    return Array.isArray(panel) ? panel.map(publicMember) : [];
}

module.exports = {
    PANEL,
    PANEL_BY_ID,
    buildPanel,
    memberForQuestion,
    panelIntroLine,
    openerFor,
    publicMember,
    publicPanel
};
