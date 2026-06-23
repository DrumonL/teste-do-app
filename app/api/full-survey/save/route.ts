import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { writeCsvAndSqliteExports } from "@/lib/dataExports";
import { withFileLock } from "@/lib/fileLock";

export const runtime = "nodejs";

type AnyRow = Record<string, string | number>;

type ResultsStore = {
  participantRows: AnyRow[];
};

type SessionStore = {
  participantRows?: AnyRow[];
  longRows?: AnyRow[];
  sealReadingRows?: AnyRow[];
};

function readJsonStore(fileName: string): SessionStore {
  const filePath = path.join(process.cwd(), "data", fileName);

  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(filePath, "utf8");

    if (!raw.trim()) {
      return {};
    }

    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function findParticipantRow(fileName: string, participantId: string) {
  const store = readJsonStore(fileName);

  const rows = Array.isArray(store.participantRows)
    ? store.participantRows
    : [];

  return rows
    .filter((row) => row.participant_id === participantId)
    .at(-1);
}

function findSealReadingRows(participantId: string) {
  const store = readJsonStore("session-2-results.json");

  const rows = Array.isArray(store.sealReadingRows)
    ? store.sealReadingRows
    : [];

  return rows.filter((row) => row.participant_id === participantId);
}

function prefixRow(prefix: string, row?: AnyRow) {
  const output: AnyRow = {};

  if (!row) {
    return output;
  }

  for (const [key, value] of Object.entries(row)) {
    if (
      key === "participant_id" ||
      key === "location" ||
      key === "gender" ||
      key === "age_group" ||
      key === "education_level" ||
      key === "income_group"
    ) {
      continue;
    }

    output[`${prefix}_${key}`] = value;
  }

  return output;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const participantId = body.participantId;
    const location = body.location;
    const demographics = body.demographics || {};

    if (!participantId) {
      return NextResponse.json(
        { error: "participantId is required." },
        { status: 400 }
      );
    }

    const dataDir = path.join(process.cwd(), "data");
    const jsonPath = path.join(dataDir, "full-survey-results.json");
    const excelPath = path.join(dataDir, "full-survey-results.xlsx");

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const session1Row = findParticipantRow(
      "session-1-results.json",
      participantId
    );

    const session2Row = findParticipantRow(
      "session-2-results.json",
      participantId
    );

    const session3Row = findParticipantRow(
      "session-3-results.json",
      participantId
    );

    const sealReadingRows = findSealReadingRows(participantId);

    const combinedRow: AnyRow = {
      participant_id: participantId,
      location: location || session3Row?.location || session2Row?.location || session1Row?.location || "",

      gender: demographics.gender || session3Row?.gender || "",
      age_group: demographics.ageGroup || session3Row?.age_group || "",
      education_level:
        demographics.educationLevel || session3Row?.education_level || "",
      income_group: demographics.incomeGroup || session3Row?.income_group || "",

      session_1_completed: session1Row ? "Yes" : "No",
      session_2_completed: session2Row ? "Yes" : "No",
      session_3_completed: session3Row ? "Yes" : "No",

      session_2_seals_read_count: sealReadingRows.length,

      ...prefixRow("s1", session1Row),
      ...prefixRow("s2", session2Row),
      ...prefixRow("s3", session3Row),

      full_survey_saved_at: new Date().toISOString(),
    };

    const participantRowsCount = await withFileLock(jsonPath, async () => {
      let store: ResultsStore = {
        participantRows: [],
      };

      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, "utf8");

        if (raw.trim()) {
          store = JSON.parse(raw);
        }
      }

      /*
        One row per participant.
        If this participant already exists, replace that participant's combined row.
        If not, append a new participant row.
      */
      const existingIndex = store.participantRows.findIndex(
        (row) => row.participant_id === participantId
      );

      if (existingIndex >= 0) {
        store.participantRows[existingIndex] = combinedRow;
      } else {
        store.participantRows.push(combinedRow);
      }

      fs.writeFileSync(jsonPath, JSON.stringify(store, null, 2), "utf8");

      const workbook = XLSX.utils.book_new();

      const participantWorksheet = XLSX.utils.json_to_sheet(
        store.participantRows
      );

      XLSX.utils.book_append_sheet(
        workbook,
        participantWorksheet,
        "Full Survey Data"
      );

      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      fs.writeFileSync(excelPath, excelBuffer);

      await writeCsvAndSqliteExports(dataDir, "full-survey-results", [
        { name: "participantRows", rows: store.participantRows },
      ]);

      return store.participantRows.length;
    });

    return NextResponse.json({
      success: true,
      message: "Full survey combined file saved.",
      participantRows: participantRowsCount,
      excelPath: "data/full-survey-results.xlsx",
      jsonPath: "data/full-survey-results.json",
      csvPath: "data/full-survey-results.csv",
      sqlitePath: "data/full-survey-results.sqlite",
    });
  } catch (error) {
    console.error("Failed to save full survey file:", error);

    return NextResponse.json(
      {
        error: "Failed to save full survey file.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
