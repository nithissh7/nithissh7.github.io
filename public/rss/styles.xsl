<?xml version="1.0" encoding="utf-8"?>
<!-- Renders /rss.xml as a readable page when opened in a browser; feed readers ignore it. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title><xsl:value-of select="/rss/channel/title" /> · RSS feed</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <style>
          :root {
            --bg: #f7f5f0; --raised: #fffefb; --border: #e3ded4; --strong: #17150f;
            --text: #36332c; --dim: #716b60; --accent: #3550d4; --solid: #3b5bdb; --code: #ebe7de;
            color-scheme: light dark;
          }
          @media (prefers-color-scheme: dark) {
            :root {
              --bg: #14120f; --raised: #1b1915; --border: #2a2721; --strong: #f3efe6;
              --text: #cfc9bd; --dim: #918a7d; --accent: #8b9dff; --solid: #4263eb; --code: #26231d;
            }
          }
          * { box-sizing: border-box; margin: 0; }
          body {
            font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 15px; line-height: 1.75; color: var(--text); background: var(--bg);
            font-variant-ligatures: none; -webkit-font-smoothing: antialiased;
          }
          a { color: inherit; text-decoration: none; }
          .wrap { max-width: 53rem; margin: 0 auto; padding: 2.5rem 1rem 4rem; }
          header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 4rem; }
          .mark { display: inline-flex; align-items: center; gap: 0.6rem; font-weight: 700; color: var(--strong); font-size: 16px; }
          .mark span { display: inline-grid; place-items: center; width: 1.9rem; height: 1.9rem; border-radius: 9px; background: var(--solid); color: #fff; font-size: 13px; }
          .eyebrow { font-size: 12px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dim); }
          h1 { font-size: clamp(30px, 5vw, 42px); line-height: 1.18; letter-spacing: -0.03em; color: var(--strong); margin: 1rem 0 1.25rem; }
          .note { border: 1px solid var(--border); background: var(--raised); border-radius: 16px; padding: 1.5rem; margin: 2rem 0 3.5rem; }
          .note p + p { margin-top: 0.75rem; }
          code { background: var(--code); color: var(--strong); border-radius: 5px; padding: 0.12em 0.4em; font-size: 0.9em; word-break: break-all; }
          .back { font-size: 12px; font-weight: 500; letter-spacing: 0.07em; text-transform: uppercase; color: var(--dim); }
          .back:hover, li a:hover .t { color: var(--accent); }
          ul { list-style: none; padding: 0; border-top: 1px solid var(--border); margin-top: 1rem; }
          li a { display: block; padding: 1.25rem 0; border-bottom: 1px solid var(--border); }
          .t { display: block; color: var(--strong); font-weight: 600; line-height: 1.45; transition: color 0.15s; }
          .d { display: block; font-size: 14px; color: var(--dim); margin-top: 0.4rem; }
          .m { display: block; font-size: 12.5px; color: var(--dim); margin-top: 0.5rem; }
        </style>
      </head>
      <body>
        <div class="wrap">
          <header>
            <a class="mark" href="/"><span>rn</span><xsl:value-of select="/rss/channel/title" /></a>
            <a class="back" href="/">Back to the site ▸</a>
          </header>
          <p class="eyebrow">RSS feed</p>
          <h1>Subscribe to new write-ups.</h1>
          <p><xsl:value-of select="/rss/channel/description" /></p>
          <div class="note">
            <p>This page is an RSS feed. Copy its address into a feed reader (NetNewsWire, Feedly, Inoreader, Miniflux…) and new posts will show up there automatically.</p>
            <p>Feed address: <code>https://nithissh7.github.io/rss.xml</code></p>
          </div>
          <p class="eyebrow">Latest posts</p>
          <ul>
            <xsl:for-each select="/rss/channel/item">
              <li>
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="link" /></xsl:attribute>
                  <span class="t"><xsl:value-of select="title" /></span>
                  <span class="d"><xsl:value-of select="description" /></span>
                  <span class="m"><xsl:value-of select="substring(pubDate, 6, 11)" /></span>
                </a>
              </li>
            </xsl:for-each>
          </ul>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
