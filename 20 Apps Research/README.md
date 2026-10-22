# Competitor research — 20 companies

Teardown of 20 learning/career platforms to find the gaps Hiero should close.
Method: use the app hands-on, write down what's missing, verify every number, then convert each
gap into a product requirement.

One file per app, using `_TEMPLATE.md`.

## Rules

1. **"What they do well" comes before the gap list.** A gaps-only teardown designs against a
   strawman. We have to beat the strength, not just the weakness.
2. **Verify every number before writing it down.** Pricing changes and wrong figures propagate.
3. **Every gap ends in a Hiero requirement.** This is a product document, not a scoreboard.
4. **Mark confidence.** "I noticed this once" and "this is structural" are different claims.

## Progress

Master list from the notebook (18 apps — the original count of 17 was one short).

| # | App | Category | Status | File |
|---|-----|----------|--------|------|
| 1 | Coursera | MOOC | ✅ done | [coursera.md](coursera.md) |
| 2 | Remasto | AI mock interview | ✅ done (verify pass pending) | [remasto.md](remasto.md) |
| 3 | Internshala | Internships + trainings | ✅ done | [internshala.md](internshala.md) |
| 4 | LinkedIn | Professional network | ✅ done | [linkedin.md](linkedin.md) |
| 5 | Intervue / interviewing.io | Live mock interviews | ⚠️ done — **which one?** | [interviewing-io.md](interviewing-io.md) |
| 6 | Unstop | Campus competitions | ✅ done (evidence added) | [unstop.md](unstop.md) |
| 7 | Udemy | Course marketplace | ✅ done | [udemy.md](udemy.md) |
| 8 | ~~Great Learning~~ | *dropped 2026-10-21 — replaced below* | — | |
| 9 | CodeChef | Competitive programming | ✅ done | [codechef.md](codechef.md) |
| 10 | HackerRank | Screening + practice | ✅ done (desk research) | [hackerrank.md](hackerrank.md) |
| 11 | W3Schools | Free reference + certs | ✅ done | [w3schools.md](w3schools.md) |
| 12 | LeetCode | Interview coding practice | ✅ done | [leetcode.md](leetcode.md) |
| 13 | GeeksforGeeks | Content + courses + practice | ✅ done | [geeksforgeeks.md](geeksforgeeks.md) |
| 14 | Skill India Digital Hub | Government skilling | ✅ done | [skill-india-digital-hub.md](skill-india-digital-hub.md) |
| 15 | IBM SkillsBuild | Free corporate skilling | ✅ done | [ibm-skillsbuild.md](ibm-skillsbuild.md) |
| 16 | ResumeSpice | Resume writing service | ✅ done | [resumespice.md](resumespice.md) |
| 17 | Skillshare | Creative subscription learning | ✅ done | [skillshare.md](skillshare.md) |
| 18 | CV Sync | JD-to-resume matching | ✅ done (ID unconfirmed) | [cv-sync.md](cv-sync.md) |

**✅ 20 of 20 COMPLETE** — 21 October 2026.

> ⚠️ **Strategy warning from IBM SkillsBuild:** verified badges are already being ignored by employers
> ("badge inflation", "vanity bling"). **A badge asserts; evidence shows.** Hiero must lead with the
> inspectable artifact — recording, code, proctoring log — and attach the score. Never a badge alone.
> See [ibm-skillsbuild.md](ibm-skillsbuild.md).

**Great Learning dropped.** Three replacements to reach 20, in priority order:

| # | Replacement | Why it earns the slot |
|---|-------------|----------------------|
| 18 | **foundit** (ex-Monster India) | ✅ **done** — [foundit.md](foundit.md) |
| 19 | **Indeed** | ✅ **done** — [indeed.md](indeed.md). Closest structural analogue to Hiero in the whole set, and the most dangerous if they go deeper. |
| 20 | **Final Round AI** | ✅ **done** — [final-round-ai.md](final-round-ai.md). Sells undetectable live interview cheating at $300/yr. Hiero's exact inverse, and the closing argument for proctoring. |

Alternate for slot 19/20: **PrepInsta** (campus placement prep — the fresher's current alternative).

Other alternates: **apna.co** (entry-level job marketplace at scale) · **Pramp** (free peer mocks — the ₹0 end against interviewing.io's ₹28k).

> 🔑 **Biggest strategic finding so far:** DigiLocker + NSQF are existing, state-backed credential
> rails. Issuing Hiero's proctored result as an NSQF-aligned credential into DigiLocker may solve
> the trust problem without years of employer evangelism. See [skill-india-digital-hub.md](skill-india-digital-hub.md).

### Open items blocking entries

- **#5** — notes say "Intervue", but the gaps described (per-session price, mandatory scheduling,
  nobody pays per interview) are interviewing.io's model. Intervue.io is B2B interview-outsourcing
  with no public pricing and no candidate-facing product. Confirm which you used.
- **#18** — confirm CV Sync is the open-source browser extension.
- **#2** — Remasto entry needs a verification pass over remasto.com.
- **LinkedIn Skill Assessments shutdown** — highest-value unverified claim in the whole research.

### Target: 20 companies

18 on the notebook list + 2 additions to reach 20. Recommended additions:

| # | Candidate | Why it earns a slot |
|---|-----------|---------------------|
| 19 | **Pramp** | Free peer-to-peer mock interviews — the ₹0 end of the market. interviewing.io shows the expensive ceiling; Pramp shows what free actually delivers, and why it isn't enough. |
| 20 | **Scaler or Masai** | Job-guarantee / ISA bootcamps. The *only* players making an explicit employment promise. Investors will raise them unprompted — better to have the entry than be caught without it. |

Alternate if one is dropped: **Jobscan** (funded, does properly what CV Sync attempts).

### Evidence standard — required before any claim is called "proof"

Claiming proof invites scrutiny of the *weakest* entry, not the strongest. Every gap must be one of:

1. **Observed** — dated screenshot of the app showing the gap, saved in `evidence/<platform>/`
2. **Documented** — link to the company's own page, docs or ToS admitting the limit (strongest kind)
3. **Reported** — multiple independent user accounts, cited

A gap with none of these is marked *inferred* and must not be presented as proof.

### Capture checklist for tomorrow's 9

For each app, grab while you're inside it:
- [ ] Pricing screen (with the currency and date visible)
- [ ] The point where it fails you — the dead end, the generic feedback, the missing option
- [ ] What the certificate/output actually looks like
- [ ] Signup-to-first-value: how many steps before it does anything useful
- [ ] Whether a fresher with no experience can use it at all

### Worth adding to the remaining slots

- **Pramp** — the free peer-to-peer mock interview model. Different economics to interviewing.io.
- **Jobscan / Teal / Huntr** — funded JD-matching tools doing properly what CV Sync attempts.
  These will be named as comparables in any investor conversation.

## Cross-app gap rollup

The real output. A gap in twelve apps is a market hole; a gap in one is that company's bug.
Fill in as entries accumulate.

**Seen in all 3 apps so far — the strongest signals:**

| Gap theme | Apps showing it | Hiero's answer |
|-----------|-----------------|----------------|
| **No verifiable proof of competence** | Coursera, Remasto, Internshala, LinkedIn, HackerRank, CV Sync, Unstop, Udemy (8/9) | An assessment you can fail and can't fake, producing a record you can show an employer. **LinkedIn is retiring Skill Assessments because hirers want evidence of *applied* skill — see linkedin.md.** |
| **No gap analysis against the target role** | Coursera, Remasto, Internshala, LinkedIn, HackerRank, Unstop, Udemy (7/9) | Match against a real JD, name what's missing |
| **No real path from learning to a job** | Coursera, Internshala, LinkedIn, Udemy, Unstop (5/9) | Output is a role you're ready for, not a certificate |
| **Nobody answers, nobody corrects your work** | Coursera, Remasto, Internshala, HackerRank, Udemy, GeeksforGeeks (6/10) | Feedback is the product; content is the commodity |
| **Candidates ghosted / no feedback** | Internshala, LinkedIn, HackerRank, foundit (4/18) | Guaranteed honest outcome + post-rejection diagnosis |
| **Diagnosis without remedy — loop never closes** | Remasto, Internshala, HackerRank, CV Sync, Unstop (5/9) | Ask → score → **teach** → re-test, same day |
| **Freshers structurally underserved** | Remasto, LinkedIn, interviewing.io (3/9) | Fresher track as a first-class path |
| **No videos / no doubt support while learning** | GeeksforGeeks, W3Schools, IBM SkillsBuild, CodeChef, LeetCode (5/17) | Video, chapters, transcripts + unmetered Q&A |
| **No visual explanation of code execution** | GeeksforGeeks, CodeChef, LeetCode, W3Schools (4/17) | Step-through visual tracing, free |
| **Paid certificate with nothing verifying it** | W3Schools (₹5–13k, unproctored MCQ), Coursera, Udemy, CodeChef, GeeksforGeeks (5/15) | People already pay for proof. They're just paying for fake proof. |
| Permanent fake discounting | Udemy, W3Schools (2/15) | Price honestly — it's a trust signal in a cynical market |
| **Document polish sold instead of real ability** | CV Sync, ResumeSpice, foundit (3/18) | Sell evidence of ability, not better wording |
| Priced out of the Indian market | Coursera, Remasto, interviewing.io, LeetCode, ResumeSpice, Skillshare (6/14) | India-first pricing; unlimited practice, not per-rep |
| Can't practice at the moment of need | Internshala (6-wk courses), interviewing.io (scheduling) (2/9) | Instant start, same-day remedy |

**Single-app observations:**

| Gap theme | Apps showing it | Hiero's answer |
|-----------|-----------------|----------------|
| No diagnostic — user must self-select | Coursera | Assess first, then prescribe |
| Nowhere to get unstuck | Coursera | Feedback + doubt-resolution in the loop |
| Search returns content, not answers | Coursera | Answer at the question level |
| **Assessment can't be trusted without proctoring** | CodeChef (documented mass cheating, own forum), HackerRank, LinkedIn, Coursera, Udemy (5/11) | **Neural Proctoring — the documented failure of the alternative is the argument** |
| Breaks or misjudges you at the stakes moment | HackerRank (auto-grader), Unstop (crashes), GeeksforGeeks (buggy challenges), CodeChef (corrupted ratings) (4/11) | Reliability when it counts — demonstrable, not arguable |
| Content errors / no quality control | Udemy, GeeksforGeeks (2/10) | Curation beats volume |
| Content goes stale with no visible update date | Coursera, Udemy (2/9) | "Last verified" on every track + refresh cadence |
| Practice isn't tied to the actual target job | Remasto | JD-in, interview-out |
| Owns learning *and* hiring, doesn't connect them | Internshala | The connection **is** the product |
| Static CV that doesn't absorb new skills | Internshala | Living profile fed by verified practice |
