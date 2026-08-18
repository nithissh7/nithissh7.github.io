import readingTime from "reading-time";
import { toString } from "mdast-util-to-string";
import { remark } from "remark";

export function getReadingTime(markdown: string): string {
  const tree = remark().parse(markdown);
  const plainText = toString(tree);
  const stats = readingTime(plainText);
  return stats.text;
}
