# Two AIs and a Federal Case: Notes on Building a Litigation Tracker for *Anthropic v. Department of War*

*Draft — Mark Williams, Vanderbilt AI Law Lab*

---

I spent a Saturday morning trying to understand the *Anthropic v. Department of War* litigation — the case in which a federal AI company has been suing the U.S. government over a presidential directive and Pentagon designation that, if they stand, will largely destroy its federal-contracting business. I wanted to learn the case, build something my students and colleagues could use to follow it, and set myself up to be alerted as it moves. By the end of the morning I had: a 15-page analytical memo, a 54-card Anki deck for spaced-repetition study, the complete docket text and a 43-page preliminary injunction opinion from the trial court, a build spec for a public-facing tracker site, and three active email alerts so I'll know within hours whenever any of the three courts in this case issues a new filing.

I did almost none of the typing.

This is a short, honest account of how that morning went, what was new about it, and where the workflow still depends on a human in ways that should make us cautious about declaring legal research "solved."

## The case, briefly

In late February 2026, President Trump posted on Truth Social directing every federal agency to immediately stop using Anthropic's AI technology. About an hour later, Secretary of War Pete Hegseth — Hegseth's title because the Department of Defense was renamed in September 2025 — posted on X declaring Anthropic a "Supply-Chain Risk to National Security" and ordering that no military contractor could do any commercial business with the company. A week later, the Pentagon formally invoked two separate procurement statutes (10 U.S.C. § 3252 and 41 U.S.C. § 4713) to designate Anthropic.

Anthropic sued the same day in both the Northern District of California and the D.C. Circuit. On March 26, Judge Rita Lin granted a sweeping preliminary injunction, finding the company likely to succeed on First Amendment retaliation, Fifth Amendment due process, and APA grounds — pointing to the President's and Secretary's own contemporaneous statements ("RADICAL LEFT WOKE COMPANY," "sanctimonious rhetoric," "Silicon Valley ideology") as evidence that the designation was retaliatory rather than security-driven. The case is now in cross-summary-judgment briefing in California; the government's interlocutory appeal is stayed at the Ninth Circuit; and the D.C. Circuit is sitting on a parallel petition under FASCSA after a May 19 oral argument.

This is, in other words, the kind of fast-moving, multi-front, doctrinally interesting case that is exactly what professors and lab directors and students need to be paying attention to — and exactly the kind that is hard to keep up with using ordinary research methods. It touches AI governance, First Amendment, administrative law, national security, and procurement, all at once.

## The stack

I started inside what Anthropic calls Cowork — basically a desktop interface where Claude has access to my local file system, a Linux sandbox, and (the part that actually matters here) a growing library of Model Context Protocol servers that give it direct, programmatic access to outside services. For this project the critical MCP was CourtListener's, which exposes the same backend that powers their public docket interface and gives an LLM clean structured access to federal dockets, filings, and opinions.

The agent doing the work was me, in the sense that I was steering, asking clarifying questions, and rejecting bad ideas. The agent doing the *production* was Claude, in the sense that it was doing the searches, parsing the JSON, drafting the prose, organizing the files, and pushing back when I asked for something half-formed.

When the site needs to be built, I'll hand the whole folder to Claude Code — Anthropic's command-line agent — and a starter prompt I co-wrote with Claude here. The handoff between the two is the part of this that I think is genuinely new.

## What happened

The session opened roughly the way most of these sessions open. I told Claude what I wanted — pull all the docket materials, do a web search of commentary and reporting, summarize, make me Anki cards, sketch out a site I can keep updated — and invited it to clean up the prompt before we proceeded.

It did, and it pushed back. Specifically:

- It flagged that it wasn't certain the case I was describing actually existed (its training cutoff was May 2025; the Department of War rename happened after). It wanted to verify before doing anything else.
- It noted that Anki cards covering "open issues" go stale fast in active litigation, and proposed tagging cards as `stable` or `volatile` so I'd know which to retire when things change.
- It pointed out that "site that updates as the case moves" can mean a lot of different things, and asked about hosting, alerting cadence, and update mechanism before recommending an architecture.

This part is worth lingering on, because it's the part that legal-research tools couldn't do five years ago. The model isn't just searching faster; it's exercising judgment about scope and stability of the work it's about to produce. Some of that judgment came from explicit instructions I'd put in a global config file ("don't always be so automatically agreeable; if you think something is a bad idea say so"). Some of it came from training. Most of it came from somewhere between.

Once we'd agreed on the scope, the actual research proceeded fast. The CourtListener MCP returned the docket list, and the case turned out to be more complicated than I had described it: not one D.C. Circuit case, as I'd asked about, but three parallel proceedings — the trial-court action in N.D. Cal., a *separate* petition for review in the D.C. Circuit attacking the FASCSA-based letter, and the government's appeal of the N.D. Cal. preliminary injunction in the 9th Circuit, currently stayed pending the D.C. Cir. decision. The bigger and weirder posture mattered; if I had taken my own framing of "the D.C. Circuit case" at face value and built the explainer around that, the site would have understated the case by about two-thirds.

The model figured this out by calling the docket-entries endpoint with successive filters and showing me what the structure of the dispute actually looked like. Within ten minutes of confirming the case identity, it had the full N.D. Cal. PI opinion in text form, and within twenty I was reading Judge Lin's actual language about what she called the "Orwellian notion that an American company may be branded a potential adversary and saboteur of the U.S. for expressing disagreement with the government." This is a different research experience from skimming someone else's summary on a blog and a different one from manually pulling PDFs off PACER. The primary source is right there, in context, and the model can quote it back accurately.

The summary memo emerged from that material in maybe forty-five minutes. The Anki deck — 54 cards covering the procedural posture, the doctrines, the holdings, and the open questions, tagged for stability — took another twenty. The site spec took longer, partly because I wanted it to be something I could actually hand to Claude Code without further intervention. The alerting layer was four API calls.

The whole session ran maybe three hours.

## What was new

I think four things about this workflow are actually new — not "AI did my research" new, which is a 2023 story, but new-as-of-2026.

**Direct primary-source access.** When the model uses an MCP for an authoritative source, the failure mode shifts. The bad old way an LLM got legal facts wrong was confabulation: it hallucinated a citation that sounded plausible. With CourtListener wired in, the model fetches and reads the actual docket. It can still misread a long opinion, but it can no longer invent a case. Most of what passes for AI legal research right now is still operating in the old mode. It shouldn't be.

**Workspace persistence.** Cowork gave the session a file system, so the work product accumulated. The Anki deck wasn't piped to me in chat; it was a CSV in a folder. The PI opinion wasn't summarized once and lost; it was saved in `source-docs/` and re-readable. The case summary became a markdown file I could keep editing. This isn't glamorous but it changes the cognitive load — I wasn't trying to remember what we'd already established or scrolling backward to find a quote.

**Agent handoff.** This is the part I'm still thinking about most. The Claude in this session is a generalist with a strong research bias. Claude Code, by contrast, is built for actually writing and running software. I'm using Claude here to *specify* a site — to write a build brief I can hand off — and Claude Code to *build* it. The deliverable from this session isn't the site; it's a complete, structured prompt plus the seed content that a different agent will then act on. We are quietly moving from "AI does the work" to "AI orchestrates other AIs that do the work." The economics of which step gets which model are going to matter a lot.

**Calibrated stability.** The Anki deck I now have is tagged so I know which 35 or so cards are facts about the case that are not going to change (the statutory text of 10 U.S.C. § 3252; the *Mathews v. Eldridge* test; the contents of Judge Lin's PI order), and which ~20 cards are about live posture and will need to be retired or rewritten as the case develops (the panel composition at the D.C. Circuit; the schedule for cross-MSJ briefing; the current state of the FASCSA appeal). The model proposed this distinction; I didn't. It is the kind of metacognitive hygiene that I would not have thought to build into a hand-made deck.

## Where the human is still load-bearing

I want to be careful about two things in this account.

First, I had to make every meaningful editorial call. The model did not decide what to build. It asked. When I told it I wanted a "DC Circuit case," it didn't quietly correct me to be helpful — it stopped and asked which of three options I meant, and we resolved the question together. When I asked for "Anki cards," it asked what format and what stability discipline. When I asked for a site, it asked who would host it and how alerts should work. The default disposition of these tools is to ask. I don't think that's a bug we should engineer out.

Second, I had to push back at a point in the session where I think the model was about to produce a more ambitious site spec than I needed. It had drafted a full Next.js plus Vercel plus serverless cron architecture, and I had to ask whether that was really what made sense given the maintenance overhead, or whether a simpler tracker would deliver most of the value. (I ended up choosing the bigger build, because I do want this to be a public resource. But that was my call.) The model can write the maximalist version of any deliverable; the human has to decide whether they want to live with maintaining the maximalist version.

Third — and this is the one that will get me into trouble with someone — I did not personally verify every doctrinal claim in the summary memo before posting it. I read the PI opinion in full, I spot-checked the cases the model cited against the opinion, and the model itself ran a verification pass at the end. But there is a layer of citation-level verification that any actual law professor or practicing lawyer needs to be doing on their own work, AI-assisted or not, and I am going to do it before any of this is held out as a final research product. The workflow does not eliminate that obligation; it makes it easier to discharge.

## The handoff to Claude Code

By the time I'm publishing this, I will (knock on wood) have handed the folder to Claude Code with the starter prompt and let it scaffold the site. The site itself will probably not be polished at first. I'll be editing data files, adjusting the timeline, deciding what's editorially worth surfacing. The cron-based alerting layer that watches CourtListener and a set of news RSS feeds will need API keys before it runs. The "approve before publishing" flow on the news feed is there specifically so an automated system doesn't quietly make the site less trustworthy than it should be.

I'll publish the URL in a follow-up post, and I'll write up what worked and what broke when the build is actually live. If the build fails in interesting ways, I'll write that up too.

If I had to guess at the one thing I'd want a colleague at another law school to try: don't start with the deliverable. Start with a thirty-minute conversation about scope, and let the model push back. The interesting work this morning happened in the first ten minutes, when I thought I knew what I wanted and the model showed me I didn't.

---

*Disclosures: Anthropic makes the tools I used in this project (Claude, Cowork, Claude Code). I have no financial relationship with Anthropic; I am a faculty user. The litigation tracker described here is being built as a public resource by the Vanderbilt AI Law Lab; the site is not affiliated with Anthropic or any party in the case.*

*The source materials, Anki deck, summary memo, and site build spec referenced in this post are open-licensed and available at [URL forthcoming]. Critiques, corrections, and pull requests welcome.*
