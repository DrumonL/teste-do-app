import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type RankingRow = {
  participant_id?: string;
  seal_id?: string;
  selected_rank?: number | string;
};

type ResultsFile = {
  participantRows?: Record<string, unknown>[];
  longRows?: RankingRow[];
};

const SESSION_1_WEIGHT = 0.33;
const SESSION_2_WEIGHT = 0.67;

const fallbackTopSeals = ["red-1", "red-2", "green-1"];

async function readResultsFile(
  filename: string
): Promise<ResultsFile> {
  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      filename
    );

    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    return {
      participantRows: Array.isArray(parsed.participantRows)
        ? parsed.participantRows
        : [],
      longRows: Array.isArray(parsed.longRows)
        ? parsed.longRows
        : [],
    };
  } catch {
    return {
      participantRows: [],
      longRows: [],
    };
  }
}

function addWeightedScores(
  rows: RankingRow[],
  participantId: string,
  sessionWeight: number,
  weightedScores: Map<string, number>,
  sessionTwoScores?: Map<string, number>
) {
  for (const row of rows) {
    if (row.participant_id !== participantId) {
      continue;
    }

    const sealId = row.seal_id;

    if (!sealId) {
      continue;
    }

    const selectedRank = Number(row.selected_rank ?? 99);

    // Rank 1 = 5, rank 2 = 4, ... rank 5 = 1.
    const rankScore = Math.max(0, 6 - selectedRank);
    const weightedScore = rankScore * sessionWeight;

    weightedScores.set(
      sealId,
      (weightedScores.get(sealId) ?? 0) + weightedScore
    );

    if (sessionTwoScores) {
      sessionTwoScores.set(
        sealId,
        (sessionTwoScores.get(sealId) ?? 0) + rankScore
      );
    }
  }
}

export async function GET(request: NextRequest) {
  const participantId =
    request.nextUrl.searchParams.get("participantId")?.trim();

  if (!participantId) {
    return NextResponse.json(
      {
        error: "participantId is required",
      },
      {
        status: 400,
      }
    );
  }

  const [sessionOneResults, sessionTwoResults] =
    await Promise.all([
      readResultsFile("session-1-results.json"),
      readResultsFile("session-2-results.json"),
    ]);

  const weightedScores = new Map<string, number>();
  const sessionTwoScores = new Map<string, number>();

  addWeightedScores(
    sessionOneResults.longRows ?? [],
    participantId,
    SESSION_1_WEIGHT,
    weightedScores
  );

  addWeightedScores(
    sessionTwoResults.longRows ?? [],
    participantId,
    SESSION_2_WEIGHT,
    weightedScores,
    sessionTwoScores
  );

  const sortedScores = Array.from(weightedScores.entries())
    .sort((a, b) => {
      const weightedDifference = b[1] - a[1];

      if (weightedDifference !== 0) {
        return weightedDifference;
      }

      const sessionTwoDifference =
        (sessionTwoScores.get(b[0]) ?? 0) -
        (sessionTwoScores.get(a[0]) ?? 0);

      if (sessionTwoDifference !== 0) {
        return sessionTwoDifference;
      }

      return a[0].localeCompare(b[0]);
    });

  const selectedSealIds = sortedScores
    .map(([sealId]) => sealId)
    .slice(0, 3);

  const missingFallbacks = fallbackTopSeals.filter(
    (sealId) => !selectedSealIds.includes(sealId)
  );

  const topSealIds = [
    ...selectedSealIds,
    ...missingFallbacks,
  ].slice(0, 3);

  return NextResponse.json({
    participantId,
    topSealIds,
    weights: {
      session1: SESSION_1_WEIGHT,
      session2: SESSION_2_WEIGHT,
      total: SESSION_1_WEIGHT + SESSION_2_WEIGHT,
    },
    weightedScores: Object.fromEntries(sortedScores),
  });
}
