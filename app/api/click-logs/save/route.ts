import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import fs from "node:fs/promises";
import path from "node:path";
import { writeCsvAndSqliteExports } from "@/lib/dataExports";

export const runtime = "nodejs";

type ClickLogRow = Record<string, unknown>;

type ClickLogFile = {
  clickRows: ClickLogRow[];
};

async function ensureDataDir() {
  await fs.mkdir(path.join(process.cwd(), "data"), {
    recursive: true,
  });
}

async function readExistingClickLogs(filePath: string): Promise<ClickLogFile> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    return {
      clickRows: Array.isArray(parsed.clickRows)
        ? parsed.clickRows
        : [],
    };
  } catch {
    return {
      clickRows: [],
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const incomingRows = Array.isArray(body.clickRows)
      ? body.clickRows
      : [];

    if (incomingRows.length === 0) {
      return NextResponse.json({
        success: true,
        savedRows: 0,
      });
    }

    await ensureDataDir();

    const dataDir = path.join(process.cwd(), "data");
    const filePath = path.join(
      dataDir,
      "click-logs-results.json"
    );
    const excelPath = path.join(
      dataDir,
      "click-logs-results.xlsx"
    );

    const existing = await readExistingClickLogs(filePath);

    const savedAt = new Date().toISOString();

    const rowsToSave = incomingRows.map((row: ClickLogRow) => ({
      ...row,
      saved_at: savedAt,
    }));

    const nextFile: ClickLogFile = {
      clickRows: [
        ...existing.clickRows,
        ...rowsToSave,
      ],
    };

    await fs.writeFile(
      filePath,
      JSON.stringify(nextFile, null, 2)
    );

    const exportWarnings: string[] = [];

    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(
        nextFile.clickRows.length
          ? nextFile.clickRows
          : [{ note: "No click logs recorded" }]
      );

      XLSX.utils.book_append_sheet(workbook, worksheet, "Click Logs");

      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      await fs.writeFile(excelPath, excelBuffer);
    } catch (error) {
      console.error("Click log Excel export failed:", error);
      exportWarnings.push("Excel export failed. JSON was saved.");
    }

    try {
      await writeCsvAndSqliteExports(dataDir, "click-logs-results", [
        { name: "clickRows", rows: nextFile.clickRows },
      ]);
    } catch (error) {
      console.error("Click log CSV/SQLite export failed:", error);
      exportWarnings.push("CSV/SQLite export failed. JSON was saved.");
    }

    return NextResponse.json({
      success: true,
      savedRows: rowsToSave.length,
      totalRows: nextFile.clickRows.length,
      exportWarnings,
      excelPath: "data/click-logs-results.xlsx",
      jsonPath: "data/click-logs-results.json",
      csvPath: "data/click-logs-results.csv",
      sqlitePath: "data/click-logs-results.sqlite",
    });
  } catch (error) {
    console.error("Click log save failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Click log save failed",
      },
      {
        status: 500,
      }
    );
  }
}
