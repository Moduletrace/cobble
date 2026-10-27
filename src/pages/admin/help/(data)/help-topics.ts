import { HelpSecureConnectionTopicId, HelpSignInTopicId } from "@/src/dict/help-dict";

export type HelpTopic = {
    /**
     * The anchor: `/admin/help#<id>` opens the page at it.
     */
    id: string;
    title: string;
    /**
     * One line under the title: when this is the topic you need.
     */
    summary: string;
    /**
     * The answer, in markdown.
     */
    body: string;
};

/**
 * The help page: familiar problems and how to get past them, the most
 * common first.
 */
export const HelpTopics: HelpTopic[] = [
    {
        id: HelpSecureConnectionTopicId,
        title: "The app needs a secure connection",
        summary: `A browser warning, the app won't install, or notifications and voice stay off.`,
        body: `Cobble serves plain HTTP and expects HTTPS in front of it: a reverse proxy (Caddy, nginx, Traefik) or a tunnel (Cloudflare Tunnel, Tailscale Serve). Browsers treat plain HTTP as unsafe, so the installable app, its offline support, Web Push notifications and voice recording stay off until the address is HTTPS.

### Point the proxy at Cobble

The proxy should reach the app at \`http://<this machine>:7227\` (or the port given with \`--port\`), and it should set \`X-Forwarded-Proto: https\`. Cobble reads that header to mark the sign-in cookies \`Secure\` and to build the right links. Caddy does it by default; with nginx add \`proxy_set_header X-Forwarded-Proto $scheme;\` to the location block.

### If it still doesn't work

- **You opened the plain HTTP address.** Use the HTTPS address your proxy serves. \`http://\` will always be treated as unsafe.
- **The certificate warning comes from the proxy.** It is using a self-signed or expired certificate. Fix that on the proxy: Cobble never sees the certificate.
- **Sign-in doesn't stick, or downloads fail.** The proxy is not passing \`X-Forwarded-Proto\` (see above), or it is dropping cookies.
- **WebSocket updates don't arrive.** The proxy must pass the upgrade on \`/ws\` as well as ordinary requests, and keep the address the browser used in \`Host\` (or send it as \`X-Forwarded-Host\`): a websocket from any other address is refused. With nginx add \`proxy_set_header Host $host;\`.`,
    },
    {
        id: HelpSignInTopicId,
        title: "Google won't let me sign in on a computer",
        summary: `"This browser or app may not be secure", "Couldn't sign you in", or a sign-in that loops. Google and some other sites do this.`,
        body: `Your bots drive the browser on their computers, and Google (like some banks and social sites) refuses sign-ins from browsers it can tell are automated. Typing the password yourself doesn't help: the browser itself is turned away.

The way around it is to sign in on your own browser, where Google trusts you, and carry that session over to the computer with the **Cookie-Editor** extension.

**Before you start:** the cookies you copy *are* your signed-in session. Anyone who has them is signed in as you, without a password. Never paste them into a chat with a bot, don't keep them in a file, and clear them when you're done (step 9).

### On your own browser

1. In Chrome (or Edge, Brave, any Chromium browser), install [Cookie-Editor](https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm) from the Chrome Web Store.
2. Sign in to the site with the account your bot should use. For Google, go to [myaccount.google.com](https://myaccount.google.com) and sign in.
3. Still on that site, click the extensions icon (the puzzle piece) in the toolbar, then **Cookie-Editor**. Click **Export**, then **JSON**. The cookies are now on your clipboard.

### On the bot's computer

4. Open the computer: in the bot's chat, click the computer icon in the header and open the computer, or click **Take over** if the bot asked you to. Switch to **Desktop**. This is the only view that shows the browser's toolbar, where extensions live.
5. The first time only: in the computer's Chrome, open the [Cookie-Editor page](https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm), click **Add to Chrome**, then **Add extension**. Pin it from the puzzle piece so it's always one click away. It stays installed: the computer keeps its browser profile, even when it restarts or is rebuilt.
6. In the computer's Chrome, go to the same site (for Google, [myaccount.google.com](https://myaccount.google.com)). It's fine that it shows the sign-in page.
7. Put the cookies on the computer's clipboard. Desktop has a small handle on the left edge: open it, click the **Clipboard** icon, and paste into the box (Ctrl+V, or Cmd+V on a Mac). What's in that box is the computer's clipboard.
8. Click **Cookie-Editor** in the computer's toolbar, then **Import**. Click into the box, paste (Ctrl+V), and click **Import**. Reload the page (F5): you're signed in.
9. Clean up: open the **Clipboard** panel again and clear it.

Then tell the bot you're signed in, or click **Hand back** if it asked you to take over, and it carries on.

The computer keeps the session, like everything else in its browser (extensions, site permissions): restarting the computer or changing its resources doesn't sign it out. Only the site itself ending the session does.

### If it doesn't work

- **The paste in step 7 or 8 is empty.** Use the computer's code editor instead: switch to **Code**, create a file such as \`workspace/cookies.json\`, and paste into it (that paste always works). In the computer's Chrome, open \`file:///home/gem/workspace/cookies.json\`, press Ctrl+A then Ctrl+C, and import as in step 8. **Delete the file afterwards.**
- **You're signed in, then signed out again soon after.** Google sometimes ends a session it sees used from a new place. Sign out and back in on your own browser, export again, and import straight away. Using the same account and keeping the bot's work regular helps the session last.
- **Cookie-Editor's icon doesn't show.** You're in the **Browser** view, which shows pages only. Switch to **Desktop**.
- **Another site still says no.** Make sure you exported while on that site (Cookie-Editor exports the cookies of the site you're on), and that you opened the same site on the computer before importing.`,
    },
    {
        id: "take-over",
        title: "A bot asks me to take over",
        summary: "A message with a Take over button, and the bot shows it needs you.",
        body: `Some things only you can do on a computer: sign in, solve a captcha, type a code sent to your phone, approve a prompt. The bot stops there and asks you to take over.

1. Click **Take over** in its message. The computer opens in the view the bot picked (browser, terminal, code or desktop).
2. Do what it asked. You're using the same computer the bot works on.
3. Click **Hand back to** the bot. It gets a message that you're done and carries on.

A task that hit the wall stops and reports instead of waiting, so after you hand back the bot picks the work up again from the chat.`,
    },
    {
        id: "graphics",
        title: "A bot's graphic is blank or looks wrong",
        summary: "A chart or diagram in a message doesn't draw, or is missing data or images.",
        body: `Bots can answer with a graphic: a chart, diagram or visual report drawn in HTML and shown right in the message. Use the buttons on its title bar to open it large or on its own page.

Graphics are sandboxed: they can't reach the app or the internet, so nothing in one can read your conversation or send it anywhere. That also means a graphic can only use what's written into it, plus the chart and diagram libraries Cobble ships (Chart.js and Mermaid). If one is blank or missing pieces, it most likely tried to load something from the web (a CDN script, an online image or font).

Ask the bot to fix it, e.g. "the chart is blank, redraw it without outside files". It changes the same graphic, and every message showing it shows the new version. A graphic that tries to open another page is closed in place.

Only you see the graphics a bot made for you.`,
    },
    {
        id: "computer-not-ready",
        title: "A computer is stuck on Creating, or isn't ready",
        summary: "Tasks fail with \"isn't ready\", or the computer never leaves Creating.",
        body: `A new computer downloads its image and starts up, which can take a few minutes the first time. It stays **Creating** until its health check passes (its sandbox and browser both answer).

- **Still Creating after several minutes, or Failed:** open **Settings, Computers** and look at its state. A super admin can **Retry** it there; the error shows on the row.
- **Unhealthy or stopped:** the computer's container is down or struggling. Give it more memory or CPUs from **Edit** (it restarts, its files are kept), or retry it.
- **Everything fails at once:** the app needs Docker on the machine it runs on. Check that Docker is running.

A computer's home folder lives in the app's data folder on the machine, so restarting or recreating its container never loses its files.`,
    },
    {
        id: "bot-asleep",
        title: "A bot is asleep, or says no model is available",
        summary: "Its face is asleep and replies wait, or tasks fail naming the models.",
        body: `Bots think with AI models. By default they use free models, which are shared and rate limited: when every model a bot can use is resting, it falls asleep and its work waits until the first one comes back. Nothing is lost.

To make this rarer, a super admin can open **Settings, Models**:

- Add a provider with your own API key (OpenRouter, OpenAI, Anthropic, Gemini and others), so paid models are there when free ones rest.
- Pick a model for the text harness instead of automatic, and keep **fallback** on so the automatic picks still step in.

A bot's own models (the model icon in its chat header) win over the defaults, and a workspace's win over a bot's.`,
    },
    {
        id: "routine-time",
        title: "A routine runs at the wrong time",
        summary: "It runs hours early or late.",
        body: `Routines run on UTC, not your local time. A routine set for \`0 9 * * *\` runs at 09:00 UTC.

Tell the bot your time zone once ("I'm in Lagos", "I'm on New York time") and it remembers it and converts for you. To fix one yourself, open **Routines**, click **Edit**, and change the schedule to the UTC hour you want. Routines don't follow daylight saving changes, so ones near a clock change may need a nudge twice a year.`,
    },
    {
        id: "knowledgebase-not-found",
        title: "A bot doesn't use a knowledgebase",
        summary: "It answers from memory, or says it found nothing, though the document is there.",
        body: `A super admin makes knowledgebases in **Settings, Knowledgebases**, and a bot searches one only once it's given it: from the knowledgebases button under its composer, its settings page, or a workspace it works in.

If it's given and still misses:

- Open the knowledgebase's documents. A document still **being read** isn't searchable yet; one that **couldn't be read** names why (a scan with no text, a file too big). Write the text in instead, or upload a version with text in it.
- Bots search by meaning only with an embedding model, picked once for the whole install in **Settings, Models** under Embeddings. Without one they match words, which misses questions worded differently from the document. Picking or changing the model reads every document again on its own; a document shows **needs re-indexing** until it's done.
- If a document still says it needs re-indexing, use the refresh icon on its knowledgebase's row to read them all again.`,
    },
];
