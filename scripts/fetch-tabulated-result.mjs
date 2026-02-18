#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const INVALID_JSON_ESCAPE_REGEX = /\\(?!["\\/bfnrtu])/g;
const CONCATENATED_JSON_OBJECTS_REGEX = /}\s*{/;
const CONCATENATED_JSON_OBJECTS_GLOBAL_REGEX = /}\s*{/g;

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
};

const printUsage = () => {
  console.log(`
Usage:
  node scripts/fetch-tabulated-result.mjs \\
    --section 2.6.3 \\
    --tenant-id <tenant_uuid> \\
    --project-id <project_uuid> \\
    --bucket doc-repository-dev \\
    --user-id <user_uuid> \\
    --output result.json

Optional:
  --base-url <url>
  --use-llm true|false (default: true)
  --refresh-template true|false (default: true)
  --user-prompt "<prompt>"
  --user-comment "<comment>"
  --previous-tabulated-id <uuid>
`);
};

const tryParseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const repairInvalidJsonEscapes = (text) =>
  text.replace(INVALID_JSON_ESCAPE_REGEX, "\\\\");

const parseLooseJsonPayload = (text) => {
  const direct = tryParseJson(text);
  if (direct !== undefined) return direct;

  const repairedEscapes = repairInvalidJsonEscapes(text);
  const repairedParsed = tryParseJson(repairedEscapes);
  if (repairedParsed !== undefined) return repairedParsed;

  if (!CONCATENATED_JSON_OBJECTS_REGEX.test(repairedEscapes)) {
    return text;
  }

  const splitChunks = repairedEscapes.split(CONCATENATED_JSON_OBJECTS_GLOBAL_REGEX);
  const parsedChunks = splitChunks
    .map((chunk, index) => {
      if (index === 0) return tryParseJson(`${chunk}}`);
      if (index === splitChunks.length - 1) return tryParseJson(`{${chunk}`);
      return tryParseJson(`{${chunk}}`);
    })
    .filter((value) => value !== undefined);

  if (parsedChunks.length) {
    return parsedChunks[parsedChunks.length - 1];
  }

  const arrayCandidate = `[${repairedEscapes.replace(CONCATENATED_JSON_OBJECTS_GLOBAL_REGEX, "},{")}]`;
  const parsedArray = tryParseJson(arrayCandidate);
  if (Array.isArray(parsedArray) && parsedArray.length) {
    return parsedArray[parsedArray.length - 1];
  }

  return text;
};

const isRecord = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isBlankCell = (value) =>
  value === null ||
  value === undefined ||
  (typeof value === "string" && value.trim().length === 0);

const isSparseTabulatedRow = (row, columns) => {
  const keys = columns.length ? columns : Object.keys(row);
  if (!keys.length) return true;

  const emptyCount = keys.reduce(
    (count, key) => count + (isBlankCell(row[key]) ? 1 : 0),
    0,
  );
  return emptyCount === keys.length || emptyCount / keys.length >= 0.7;
};

const inferMethodOfAdministration = (row) => {
  const location = String(row["Location in CTD"] || "");
  const context = location.toLowerCase();
  if (context.includes("in vitro")) return "in vitro";
  if (context.includes("intravenous") || context.includes(" i.v")) return "intravenous";
  if (context.includes("intraperitoneal") || context.includes(" i.p")) return "intraperitoneal";
  if (context.includes("oral") || context.includes(" p.o")) return "oral";
  return null;
};

const fillMissingTabulatedCells = (row, columns) => {
  const normalized = { ...row };
  const keys = columns.length ? columns : Object.keys(row);
  for (const key of keys) {
    const value = normalized[key];
    const blank =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim().length === 0);
    if (!blank) continue;

    if (key === "Method of Administration") {
      normalized[key] = inferMethodOfAdministration(row) || "Not reported";
      continue;
    }
    normalized[key] = "Not reported";
  }
  return normalized;
};

const pruneSparseTabulatedRows = (payload) => {
  if (!isRecord(payload)) return payload;
  if (!Array.isArray(payload.tables)) return payload;

  const tables = payload.tables.map((table) => {
    if (!isRecord(table) || !Array.isArray(table.rows)) return table;

    const columns = Array.isArray(table.columns)
      ? table.columns.filter((column) => typeof column === "string")
      : [];
    const rows = table.rows
      .filter((row) => {
        if (!isRecord(row)) return false;
        return !isSparseTabulatedRow(row, columns);
      })
      .map((row) => fillMissingTabulatedCells(row, columns));
    return { ...table, rows };
  });

  return { ...payload, tables };
};

const parseBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "y"].includes(String(value).toLowerCase());
};

const required = (args, key) => {
  const value = args[key];
  if (!value || value === "true") {
    throw new Error(`Missing required argument: --${key}`);
  }
  return value;
};

const getBaseUrl = (args) => {
  const value =
    args["base-url"] ||
    process.env.PDF_ANALYSIS_API_BASE_URL ||
    process.env.NEXT_PUBLIC_PDF_ANALYSIS_API_BASE_URL ||
    process.env.NEXT_PUBLIC_ANALYSIS_API_URL ||
    "http://localhost:8000";
  return value.replace(/\/+$/, "");
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args.h) {
    printUsage();
    return;
  }

  const section = required(args, "section");
  const tenantId = required(args, "tenant-id");
  const projectId = required(args, "project-id");
  const bucket = required(args, "bucket");
  const outputPath = path.resolve(args.output || "result.json");

  const requestBody = {
    section,
    tenant_id: tenantId,
    project_id: projectId,
    bucket,
    use_llm: parseBoolean(args["use-llm"], true),
    user_prompt: args["user-prompt"] || "",
    user_comment: args["user-comment"] || "",
    previous_tabulated_id: args["previous-tabulated-id"] || null,
    refresh_template: parseBoolean(args["refresh-template"], true),
  };

  const headers = { "Content-Type": "application/json" };
  if (args["user-id"]) {
    headers["user-id"] = args["user-id"];
  }

  const baseUrl = getBaseUrl(args);
  const endpoint = `${baseUrl}/ncd/assets/tabulated`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody),
  });

  const rawText = await response.text();
  if (!response.ok) {
    const preview = rawText.slice(0, 500);
    throw new Error(
      `Request failed (${response.status} ${response.statusText}). Body preview: ${preview}`,
    );
  }

  const parsed = parseLooseJsonPayload(rawText);
  if (!isRecord(parsed)) {
    throw new Error("Server response is not a JSON object after repair.");
  }

  const cleaned = pruneSparseTabulatedRows(parsed);
  await fs.writeFile(outputPath, `${JSON.stringify(cleaned, null, 2)}\n`, "utf8");

  const tableCount = Array.isArray(cleaned.tables) ? cleaned.tables.length : 0;
  const rowCount = Array.isArray(cleaned.tables)
    ? cleaned.tables.reduce((sum, table) => {
        if (!isRecord(table) || !Array.isArray(table.rows)) return sum;
        return sum + table.rows.length;
      }, 0)
    : 0;
  console.log(`Saved clean tabulated result to ${outputPath}`);
  console.log(`section=${section} tables=${tableCount} rows=${rowCount}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
