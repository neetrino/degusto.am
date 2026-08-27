const ESCAPE_MAP: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  "0": "\0",
  "'": "'",
  "\\": "\\",
  '"': '"',
};

export function unescapeSql(value: string): string {
  let output = "";
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (char !== "\\" || index + 1 >= value.length) {
      output += char ?? "";
      continue;
    }
    const next = value[index + 1] ?? "";
    output += ESCAPE_MAP[next] ?? next;
    index += 1;
  }
  return output;
}

export function sqlValue(field: string): string | null {
  if (field === "NULL") {
    return null;
  }
  return unescapeSql(field);
}

export function sqlInt(field: string): number {
  const parsed = Number.parseInt(field, 10);
  if (!Number.isSafeInteger(parsed)) {
    throw new Error(`Expected integer, got ${field.slice(0, 32)}`);
  }
  return parsed;
}

function isColumnListParen(text: string, openIndex: number): boolean {
  let look = openIndex + 1;
  while (look < text.length && " \n\r\t".includes(text[look] ?? "")) {
    look += 1;
  }
  return text[look] === "`";
}

function findTupleStart(text: string, from: number): number {
  let index = from;
  while (index < text.length) {
    if (text[index] !== "(") {
      index += 1;
      continue;
    }
    if (isColumnListParen(text, index)) {
      index = skipBalancedParens(text, index);
      continue;
    }
    return index;
  }
  return -1;
}

function skipBalancedParens(text: string, openIndex: number): number {
  let depth = 1;
  let index = openIndex + 1;
  while (index < text.length && depth > 0) {
    const char = text[index];
    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
    }
    index += 1;
  }
  return index;
}

function readTuple(
  text: string,
  openIndex: number,
): { fields: string[]; nextIndex: number } {
  const fields: string[] = [];
  let current = "";
  let inStr = false;
  let escaped = false;
  let index = openIndex + 1;

  while (index < text.length) {
    const char = text[index] ?? "";
    if (inStr) {
      const consumed = readStringChar(char, text, index, escaped, (piece) => {
        current += piece;
      });
      inStr = consumed.inStr;
      escaped = consumed.escaped;
      index = consumed.nextIndex;
      continue;
    }
    if (char === "'") {
      inStr = true;
      index += 1;
      continue;
    }
    if (char === ",") {
      fields.push(current.trim());
      current = "";
      index += 1;
      continue;
    }
    if (char === ")") {
      fields.push(current.trim());
      return { fields, nextIndex: index + 1 };
    }
    current += char;
    index += 1;
  }
  throw new Error("Unclosed SQL tuple");
}

function readStringChar(
  char: string,
  text: string,
  index: number,
  escaped: boolean,
  append: (piece: string) => void,
): { inStr: boolean; escaped: boolean; nextIndex: number } {
  if (escaped) {
    append(char);
    return { inStr: true, escaped: false, nextIndex: index + 1 };
  }
  if (char === "\\") {
    append(char);
    return { inStr: true, escaped: true, nextIndex: index + 1 };
  }
  if (char === "'") {
    if (text[index + 1] === "'") {
      append("'");
      return { inStr: true, escaped: false, nextIndex: index + 2 };
    }
    return { inStr: false, escaped: false, nextIndex: index + 1 };
  }
  append(char);
  return { inStr: true, escaped: false, nextIndex: index + 1 };
}

export function parseTuples(text: string): string[][] {
  const rows: string[][] = [];
  let index = 0;
  while (index < text.length) {
    const start = findTupleStart(text, index);
    if (start === -1) {
      break;
    }
    const parsed = readTuple(text, start);
    rows.push(parsed.fields);
    index = parsed.nextIndex;
  }
  return rows;
}
