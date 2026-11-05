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
        body: `A computer's browser is a real Google Chrome, so most sites, Google included, let you sign in on it like on your own: open the computer (the computer icon in the bot's chat header, or **Take over** when the bot asked), go to the site and sign in. Your password goes straight into the computer's browser, never to the bot.

When a site still refuses (it can tell the computer is in a data center, or it wants a device it has seen before), sign in on your own browser instead and carry that session over to the computer.

**Before you start:** the cookies you copy *are* your signed-in session. Anyone who has them is signed in as you, without a password. Never paste them into a chat with a bot and don't keep them in a file.

### On your own browser

1. In Chrome (or Edge, Brave, any Chromium browser), install [Cookie-Editor](https://chromewebstore.google.com/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm) from the Chrome Web Store.
2. Sign in to the site with the account your bot should use. For Google, go to [myaccount.google.com](https://myaccount.google.com) and sign in.
3. Still on that site, click the extensions icon (the puzzle piece) in the toolbar, then **Cookie-Editor**. Click **Export**, then **JSON**. The cookies are now on your clipboard.

### On the bot's computer

4. Open the computer, and in its browser go to the same site (for Google, [myaccount.google.com](https://myaccount.google.com)). It's fine that it shows the sign-in page.
5. In the computer's browser, click the extensions icon (the puzzle piece), then **Cookie-Editor** (it's already installed there). Click **Import**, paste into the box (Ctrl+V, or Cmd+V on a Mac; the first time, your browser asks to let the app read the clipboard; that needs the app on HTTPS, otherwise paste into the clipboard box in the screen's side panel first) and click **Import**.
6. Reload the page: you're signed in.

Then tell the bot you're signed in, or click **Hand back** if it asked you to take over, and it carries on.

The computer keeps the session, like everything else in its browser (site permissions, settings): restarting or rebuilding the computer, or changing its resources or browser settings, doesn't sign it out. Only the site itself ending the session does.

### If it doesn't work

- **You're signed in, then signed out again soon after.** Google sometimes ends a session it sees used from a new place. Sign out and back in on your own browser, export again, and import straight away. Using the same account and keeping the bot's work regular helps the session last.
- **Another site still says no.** Make sure you exported while on that site (Cookie-Editor exports the cookies of the site you're on), and that you opened the same site on the computer before importing.
- **The site wants a setting changed** (notifications, location, pop-ups). Type \`chrome://settings/content\` in the view's address bar: the browser's own settings open there.`,
    },
    {
        id: "take-over",
        title: "A bot asks me to take over",
        summary: "A message with a Take over button, and the bot shows it needs you.",
        body: `Some things only you can do on a computer: sign in, solve a captcha, type a code sent to your phone, approve a prompt. The bot stops there and asks you to take over.

1. Click **Take over** in its message. The computer's screen opens live, showing its Chrome.
2. Do what it asked: click, type and paste as in any browser. You're on the computer's screen, using the same Chrome the bot works in, with its tabs, menu and extensions.
3. Click **Hand back to** the bot. It gets a message that you're done and carries on.

A task that hit the wall stops and reports instead of waiting, so after you hand back the bot picks the work up again from the chat.`,
    },
    {
        id: "chatrooms",
        title: "What is a chatroom?",
        summary: "A chatroom showed up in the rail, or a bot says it asked another bot.",
        body: `When a bot needs something another bot is better placed to give (what it knows, a file it has, work in its line), it doesn't ask that bot directly. It asks the coordinator, which reads the request, picks who should answer, asks them and sends the answer back. Each of those exchanges is kept in a **chatroom**.

- **Where:** with the conversation it came from. A request made in a workspace is listed under Chatrooms inside that workspace, after its bots; one made in a bot's own chat is listed under Chatrooms after the workspaces. The chip in the bot's message opens it too.
- **Who can be asked:** in a workspace only the workspace's bots, otherwise any bot you work with. The work runs as you, with your access.
- **Read-only:** nobody writes in a chatroom. To steer the coordinator, talk to it in its own chat (super admin only). You can **Stop** an open request from the room's header.
- **While it runs:** the asking bot's conversation shows where each bot in the request stands, linked to the room, until it's done.
- **Try again:** a request that failed or was stopped can be tried again, from the room's header, the Chatrooms list or the message in the conversation that says so. The same room carries on from what was already said, and the answer goes back to the bot that asked.
- **What happens after:** the answer appears in the asking bot's conversation as a message from the coordinator, and the bot carries on from there.`,
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
        body: `A new computer downloads its image and starts up, which can take a few minutes the first time. It stays **Creating** until its health check passes (its browser and the bots' browser tools both answer).

- **Still Creating after several minutes, or Failed:** open **Settings, Computers** and look at its state. A super admin can **Retry** it there; the error shows on the row.
- **Running but stuck:** a super admin can open the computer and click **Restart**. Anything running on it stops; its files, browser logins and installed software stay.
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
    {
        id: "connect-browser",
        title: "Letting a bot use your own browser",
        summary: "Bots use their computer's browser, but you want them in yours, with your logins.",
        body: `Add your browser in **Settings, Browsers**. It stays yours: bots only use it when they're working for you, never for anyone else.

1. Beside your browser, run a browser MCP server. The page shows the commands for Playwright MCP, which open a separate browser profile: sign in there to what bots should reach. A browser installed as a Flatpak is started with \`flatpak run\`, and the page shows that command too.
2. Add its URL under **New browser** and click **Test connection**.
3. Choose where it applies: for all your bots on the same page, for one bot from the browser button under its composer or its settings, or for a workspace the same way. Choose it as the default there and bots go to it first, falling back to the computer's browser if it's off.

Be careful: a bot in your browser acts as you, and anyone who can reach that port can too. Keep the port on your machine or a private network. Routines only use a browser you've allowed them; hook calls and chatrooms never do.`,
    },
];
