import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { writeCsvAndSqliteExports } from "@/lib/dataExports";
import { withFileLock } from "@/lib/fileLock";

export const runtime = "nodejs";

type ParticipantRow = Record<string, string | number>;
type LongRow = Record<string, string | number>;

type ResultsStore = {
  participantRows: ParticipantRow[];
  longRows: LongRow[];
};

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const participantRow: ParticipantRow = body.participantRow;
    const longRows: LongRow[] = body.longRows;

    if (!participantRow) {
      return NextResponse.json(
        { error: "No participant row received." },
        { status: 400 }
      );
    }

    if (!longRows || !Array.isArray(longRows) || longRows.length === 0) {
      return NextResponse.json(
        { error: "No long-format rows received." },
        { status: 400 }
      );
    }

    const dataDir = path.join(process.cwd(), "data");
    const jsonPath = path.join(dataDir, "session-1-results.json");
    const excelPath = path.join(dataDir, "session-1-results.xlsx");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const result = await withFileLock(jsonPath, async () => {
      let store: ResultsStore = {
        participantRows: [],
        longRows: [],
      };

      if (fs.existsSync(jsonPath)) {
        const rawJson = fs.readFileSync(jsonPath, "utf8");

        if (rawJson.trim()) {
          store = JSON.parse(rawJson);
        }
      }

      store.participantRows.push(participantRow);
      store.longRows.push(...longRows);

      fs.writeFileSync(jsonPath, JSON.stringify(store, null, 2), "utf8");

      const workbook = XLSX.utils.book_new();

      const participantWorksheet = XLSX.utils.json_to_sheet(
        store.participantRows
      );

      const longWorksheet = XLSX.utils.json_to_sheet(store.longRows);

      XLSX.utils.book_append_sheet(
        workbook,
        participantWorksheet,
        "Participant Data"
      );

      XLSX.utils.book_append_sheet(workbook, longWorksheet, "Long Format");

      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      fs.writeFileSync(excelPath, excelBuffer);

      await writeCsvAndSqliteExports(dataDir, "session-1-results", [
        { name: "participantRows", rows: store.participantRows },
        { name: "longRows", rows: store.longRows },
      ]);

      return {
        participantRowsCount: store.participantRows.length,
        longRowsCount: store.longRows.length,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Session 1 participant saved.",
      participantRows: result.participantRowsCount,
      longRows: result.longRowsCount,
      excelPath: "data/session-1-results.xlsx",
      jsonPath: "data/session-1-results.json",
      csvPaths: [
        "data/session-1-results-participant-rows.csv",
        "data/session-1-results-long-rows.csv",
      ],
      sqlitePath: "data/session-1-results.sqlite",
    });
  } catch (error) {
    console.error("Failed to save Session 1 data:", error);

    return NextResponse.json(
      {
        error: "Failed to save Session 1 data.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
