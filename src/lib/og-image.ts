import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { tagColor } from "../consts";

// Notion dark select colours, matching the site's tag pills.
const TAG_BG: Record<string, string> = {
  gray: "#373737", brown: "#4a3228", orange: "#5c3b23", yellow: "#564328", green: "#243d30",
  blue: "#143a4e", purple: "#3c2d49", pink: "#4e2c3c", red: "#522e2a",
};

const fontDir = join(process.cwd(), "node_modules/@fontsource/jetbrains-mono/files");
const fontRegularPath = join(fontDir, "jetbrains-mono-latin-400-normal.woff");
const fontBoldPath = join(fontDir, "jetbrains-mono-latin-700-normal.woff");

let fontsPromise: Promise<{ regular: Buffer; bold: Buffer }> | null = null;
function loadFonts() {
  fontsPromise ??= Promise.all([readFile(fontRegularPath), readFile(fontBoldPath)]).then(
    ([regular, bold]) => ({ regular, bold })
  );
  return fontsPromise;
}

const PAPER = "#191919"; // Notion dark
const INK = "#ececec";
const INK_SOFT = "#9b9b9b";
const LINE = "#2f2f2f";
const ACCENT_BG = INK;
const ACCENT_INK = PAPER;

interface OgImageOptions {
  eyebrow: string;
  title: string;
  meta?: string;
  tags?: string[];
  accentBg?: string;
  accentInk?: string;
}

export async function renderOgImage({
  eyebrow,
  title,
  meta,
  tags = [],
  accentBg = ACCENT_BG,
  accentInk = ACCENT_INK,
}: OgImageOptions): Promise<Buffer> {
  const { regular, bold } = await loadFonts();

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          backgroundColor: PAPER,
          fontFamily: "JetBrains Mono",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                border: `1.5px solid ${LINE}`,
                borderRadius: "6px",
                padding: "48px",
                height: "100%",
                justifyContent: "space-between",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            backgroundColor: accentBg,
                            color: accentInk,
                            borderRadius: "4px",
                            padding: "10px 20px",
                            fontSize: "28px",
                            fontWeight: 700,
                          },
                          children: "realnits",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            color: INK_SOFT,
                            fontSize: "22px",
                            fontWeight: 400,
                          },
                          children: eyebrow,
                        },
                      },
                    ],
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      fontSize: title.length > 60 ? "46px" : "56px",
                      fontWeight: 700,
                      color: INK,
                      lineHeight: 1.25,
                      marginTop: "24px",
                      marginBottom: "24px",
                    },
                    children: title,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: `1.5px solid ${LINE}`,
                      paddingTop: "24px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: { display: "flex", color: INK_SOFT, fontSize: "22px" },
                          children: meta ?? "",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: { display: "flex", gap: "10px" },
                          children: tags.slice(0, 3).map((tag) => ({
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                color: INK,
                                fontSize: "20px",
                                background: TAG_BG[tagColor(tag)] ?? TAG_BG.gray,
                                borderRadius: "6px",
                                padding: "4px 12px",
                              },
                              children: tag,
                            },
                          })),
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "JetBrains Mono", data: regular, weight: 400, style: "normal" },
        { name: "JetBrains Mono", data: bold, weight: 700, style: "normal" },
      ],
    }
  );

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
  return resvg.render().asPng();
}
