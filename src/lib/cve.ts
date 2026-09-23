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
