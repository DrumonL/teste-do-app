import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

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

    const filePath = path.join(
      process.cwd(),
      "data",
      "click-logs-results.json"
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

    return NextResponse.json({
      success: true,
      savedRows: rowsToSave.length,
      totalRows: nextFile.clickRows.length,
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
