import fs from "fs";
import path from "path";
import initSqlJs from "sql.js";

export type ExportRow = Record<string, unknown>;

export type ExportTable = {
  name: string;
  rows: ExportRow[];
};

function toFileToken(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function toSqlIdentifier(value: string) {
  const normalized = value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return normalized || "data";
}

function quoteSqlIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function stringifyCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function getColumns(rows: ExportRow[]) {
  const columns = new Set<string>();

  rows.forEach((row) => {
    Object.keys(row).forEach((key) => columns.add(key));
  });

  return Array.from(columns);
}

function csvEscape(value: unknown) {
  const text = stringifyCell(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(rows: ExportRow[]) {
  const columns = getColumns(rows);

  if (columns.length === 0) {
    return "";
  }

  const lines = [
    columns.map(csvEscape).join(","),
    ...rows.map((row) =>
      columns.map((column) => csvEscape(row[column])).join(",")
    ),
  ];

  return `${lines.join("\r\n")}\r\n`;
}

function writeCsvFiles(dataDir: string, baseName: string, tables: ExportTable[]) {
  tables.forEach((table) => {
    const tableToken = toFileToken(table.name);
    const fileName =
      tables.length === 1
        ? `${baseName}.csv`
        : `${baseName}-${tableToken}.csv`;

    fs.writeFileSync(
      path.join(dataDir, fileName),
      toCsv(table.rows),
      "utf8"
    );
  });
}

async function writeSqliteFile(
  dataDir: string,
  baseName: string,
  tables: ExportTable[]
) {
  const SQL = await initSqlJs({
    locateFile: (file) =>
      path.join(process.cwd(), "node_modules", "sql.js", "dist", file),
  });
  const db = new SQL.Database();

  tables.forEach((table) => {
    const tableName = toSqlIdentifier(table.name);
    const columns = getColumns(table.rows);

    if (columns.length === 0) {
      db.run(
        `CREATE TABLE ${quoteSqlIdentifier(tableName)} (${quoteSqlIdentifier("note")} TEXT);`
      );
      return;
    }

    db.run(
      `CREATE TABLE ${quoteSqlIdentifier(tableName)} (${columns
        .map((column) => `${quoteSqlIdentifier(toSqlIdentifier(column))} TEXT`)
        .join(", ")});`
    );

    const insertSql = `INSERT INTO ${quoteSqlIdentifier(tableName)} (${columns
      .map((column) => quoteSqlIdentifier(toSqlIdentifier(column)))
      .join(", ")}) VALUES (${columns.map(() => "?").join(", ")});`;
    const statement = db.prepare(insertSql);

    table.rows.forEach((row) => {
      statement.run(columns.map((column) => stringifyCell(row[column])));
    });

    statement.free();
  });

  const sqliteBuffer = Buffer.from(db.export());
  db.close();

  fs.writeFileSync(path.join(dataDir, `${baseName}.sqlite`), sqliteBuffer);
}

export async function writeCsvAndSqliteExports(
  dataDir: string,
  baseName: string,
  tables: ExportTable[]
) {
  writeCsvFiles(dataDir, baseName, tables);
  await writeSqliteFile(dataDir, baseName, tables);
}
