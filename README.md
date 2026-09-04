.....................  .. .... ...... ... ----- ---------- ------- - - -- ---------- -- ---------- ------ ----- --------- - -- ------------ -- - ------ -------- - - -
triptoropic.com      ....   https://www.instagram.com/patrick_allan_demartino/   - - - -------   https://x.com/dose_the_online   -__-    bobo the chimpanzee ---------
------------------- ---------------- ------------------------- -------------- ----------- --------------------- ----------------------------- ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

made mostly by codex ai.... a Open ai    product....     from the time when machines where  commoditity  .   value $$$  Ruled the Land ....   
    if computers survive the appocolypse.... whenever it comes.... an acurate account of human history.... would be essentially impossible to preserve ....

    ...................................
    for this reason, and many others. I am starting my own agency of intelegence .... to gather information on members of the population.... 
           FOR EVIL  INTENT

DOOM industries,   Skynet  ,  go team .


# Planet Urf

V1 of an interactive click-through adventure site.

The landing page presents two animated paths:

- **Planet Urf** — the physical-world branch of the future maze.
- **The unknown** — a working neural-link chat with Dr. Bongo, an orangutan whose brain was upgraded by aliens.

Dr. Bongo uses the OpenAI Responses API when `OPENAI_API_KEY` is available. Without a key, the character remains fully interactive through an included local personality engine.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal. The Dr. Bongo scene is also available directly at `/bongo`.

## Production checks

```bash
npm run build
npm test
```

To enable AI-generated replies, copy `.env.example` to `.env.local` and provide a server-side OpenAI API key. Never commit the key.

## Stack

- React 19
- vinext
- Vite
- Cloudflare Workers
