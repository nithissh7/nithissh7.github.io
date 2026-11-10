import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

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

// Site dark theme tokens (see global.css).
const PAPER = "#14120f";
const INK = "#f3efe6";
const INK_SOFT = "#918a7d";
const LINE = "#3a362e";
const ACCENT_BG = "#4263eb";
const ACCENT_INK = "#ffffff";

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
                borderRadius: "20px",
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
                      gap: "16px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "56px",
                            height: "56px",
                            backgroundColor: accentBg,
                            color: accentInk,
                            borderRadius: "14px",
                            fontSize: "24px",
                            fontWeight: 700,
                          },
                          children: "rn",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: { display: "flex", color: INK, fontSize: "30px", fontWeight: 700 },
                          children: "realnits",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            marginLeft: "auto",
                            color: INK_SOFT,
                            fontSize: "20px",
                            fontWeight: 400,
                            letterSpacing: "2px",
                            textTransform: "uppercase",
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
                                color: INK_SOFT,
                                fontSize: "17px",
                                border: `1.5px solid ${LINE}`,
                                borderRadius: "8px",
                                padding: "6px 14px",
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
