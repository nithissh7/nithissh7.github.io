// CVE titles look like "Product <= 1.0.3 - Authenticated (Administrator+) SQL Injection".
// Split them so the vulnerability reads first and the product sits underneath.
export function splitCveTitle(title: string): { vuln: string; product: string } {
  const i = title.indexOf(" - ");
  if (i === -1) return { vuln: title, product: "" };
  return { product: title.slice(0, i).trim(), vuln: title.slice(i + 3).trim() };
}

// Short class label readers (and search) expect, e.g. "XSS" for Cross-Site Scripting.
export function vulnClass(title: string): string | undefined {
  const t = title.toLowerCase();
  const xss = t.includes("cross-site scripting") || t.includes("cross site scripting");
  if (t.includes("cross-site request forgery")) return xss ? "CSRF → XSS" : "CSRF";
  if (xss) return "XSS";
  if (t.includes("sql injection")) return "SQLi";
  if (t.includes("server-side request forgery")) return "SSRF";
  if (t.includes("remote code execution")) return "RCE";
  return undefined;
}

// Human-readable CVSS 3.x base metrics, e.g. "AV:N" -> ["Attack vector", "Network"].
const METRICS: Record<string, [string, Record<string, string>]> = {
  AV: ["Attack vector", { N: "Network", A: "Adjacent", L: "Local", P: "Physical" }],
  AC: ["Complexity", { L: "Low", H: "High" }],
  PR: ["Privileges", { N: "None", L: "Low", H: "High" }],
  UI: ["User interaction", { N: "None", R: "Required" }],
  S: ["Scope", { U: "Unchanged", C: "Changed" }],
  C: ["Confidentiality", { N: "None", L: "Low", H: "High" }],
  I: ["Integrity", { N: "None", L: "Low", H: "High" }],
  A: ["Availability", { N: "None", L: "Low", H: "High" }],
};
// How much each metric value helps an attacker: "high" means worst case for the defender.
const RISK: Record<string, Record<string, "high" | "med" | "low">> = {
  AV: { N: "high", A: "med", L: "low", P: "low" },
  AC: { L: "high", H: "low" },
  PR: { N: "high", L: "med", H: "low" },
  UI: { N: "high", R: "low" },
  S: { C: "high", U: "low" },
  C: { H: "high", L: "med", N: "low" },
  I: { H: "high", L: "med", N: "low" },
  A: { H: "high", L: "med", N: "low" },
};
export function explainVector(vector?: string): { key: string; label: string; value: string; risk: "high" | "med" | "low" }[] {
  if (!vector) return [];
  return vector
    .split("/")
    .slice(1)
    .map((part) => part.split(":"))
    .filter(([k]) => METRICS[k])
    .map(([k, v]) => ({ key: k, label: METRICS[k][0], value: METRICS[k][1][v] ?? v, risk: RISK[k]?.[v] ?? "low" }));
}

// Notion select colour for a severity.
export function severityColor(severity: string): string {
  return { Critical: "red", High: "orange", Medium: "yellow", Low: "gray", Informational: "gray" }[severity] ?? "gray";
}
