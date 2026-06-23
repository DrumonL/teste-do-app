"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { getLocationConfig } from "@/lib/locations";
import {
  flushPending,
  getLocalBackups,
  getLocalBackupStats,
  getPendingCount,
  type LocalBackupStats,
} from "@/lib/saveWithRetry";

const locations = ["PUCPR", "UFBA", "NMSU"];

const locationColors: Record<string, string> = {
  PUCPR: "#bb0b0b",
  UFBA: "#1a7a3a",
  NMSU: "#bb0b0b",
};

function createParticipantId(location: string) {
  const prefix = location.replace(/\s+/g, "").toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${prefix}-${Date.now()}-${random}`;
}

function clearPreviousParticipantData() {
  localStorage.removeItem("participantId");
  localStorage.removeItem("participantLocation");
  localStorage.removeItem("surveyMode");
  localStorage.removeItem("surveyStartedAt");
  localStorage.removeItem("selectedSessionPath");

  localStorage.removeItem("session-1-ranking");
  localStorage.removeItem("session-1-demographics");

  localStorage.removeItem("session-2-ranking");
  localStorage.removeItem("session-2-demographics");
  localStorage.removeItem("session-2-seal-readings");

  localStorage.removeItem("session-3-ranking");
  localStorage.removeItem("session-3-demographics");
}

function csvEscape(value: unknown) {
  const text =
    value === null || value === undefined
      ? ""
      : typeof value === "string"
        ? value
        : JSON.stringify(value);

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function downloadTextFile(fileName: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadBlobFile(fileName: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function flattenBackupRows(backups: Awaited<ReturnType<typeof getLocalBackups>>) {
  return backups.map((item) => ({
    id: item.id,
    url: item.url,
    createdAt: item.createdAt,
    body: JSON.stringify(item.body),
  }));
}

export default function HomePage() {
  const router = useRouter();
  const { t, setLanguage } = useLanguage();
  const [location, setLocation] = useState("PUCPR");
  const [participantId, setParticipantId] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [backupStats, setBackupStats] = useState<LocalBackupStats>({
    backupCount: 0,
    participantCount: 0,
    eventCount: 0,
    lastSavedAt: "",
  });
  const [syncingPending, setSyncingPending] = useState(false);
  const [helpMessage, setHelpMessage] = useState("");

  useEffect(() => {
    setLanguage(getLocationConfig(location).language);
  }, [location]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function refreshBackupPanel() {
      const [count, stats] = await Promise.all([
        getPendingCount(),
        getLocalBackupStats(),
      ]);

      if (!cancelled) {
        setPendingCount(count);
        setBackupStats(stats);
      }
    }

    refreshBackupPanel();
    timer = setInterval(refreshBackupPanel, 5000);
    window.addEventListener("focus", refreshBackupPanel);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      window.removeEventListener("focus", refreshBackupPanel);
    };
  }, []);

  function saveParticipant(id: string) {
    localStorage.setItem("participantId", id);
    localStorage.setItem("participantLocation", location);
    localStorage.setItem("surveyMode", "full");
    localStorage.setItem("surveyStartedAt", new Date().toISOString());
    localStorage.setItem("selectedSessionPath", "/session-1");
  }

  function handleCreateUser() {
    clearPreviousParticipantData();

    const id = createParticipantId(location);
    setParticipantId(id);
    saveParticipant(id);
  }

  function handleEnter() {
    let id = participantId;

    if (!id) {
      clearPreviousParticipantData();
      id = createParticipantId(location);
      setParticipantId(id);
      saveParticipant(id);
    }

    router.push("/session-1");
  }

  async function handleSyncPending() {
    setSyncingPending(true);
    setHelpMessage("");

    const result = await flushPending();
    const stats = await getLocalBackupStats();

    setPendingCount(result.remaining);
    setBackupStats(stats);
    setSyncingPending(false);
    setHelpMessage(
      result.remaining === 0
        ? "Todos os envios pendentes foram sincronizados."
        : `${result.remaining} envio(s) ainda pendente(s).`
    );
  }

  function buildBackupCsv(rows: ReturnType<typeof flattenBackupRows>) {
    const columns = ["id", "url", "createdAt", "body"];

    return [
      columns.map(csvEscape).join(","),
      ...rows.map((row) =>
        columns.map((column) => csvEscape(row[column as keyof typeof row])).join(",")
      ),
    ].join("\r\n");
  }

  async function handleExportBackup() {
    const backups = await getLocalBackups();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const exportedAt = new Date().toISOString();
    const rows = flattenBackupRows(backups);
    const csv = buildBackupCsv(rows);
    const XLSX = await import("xlsx");
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const statsWorksheet = XLSX.utils.json_to_sheet([
      {
        exportedAt,
        backupCount: backups.length,
        participantCount: backupStats.participantCount,
        eventCount: backupStats.eventCount,
      },
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Backups");
    XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Resumo");

    const excelBuffer = XLSX.write(workbook, {
      type: "array",
      bookType: "xlsx",
    });

    downloadBlobFile(
      `backup-local-${timestamp}.xlsx`,
      new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );

    downloadTextFile(
      `backup-local-${timestamp}.json`,
      JSON.stringify(
        {
          exportedAt,
          backupCount: backups.length,
          backups,
        },
        null,
        2
      ),
      "application/json"
    );

    downloadTextFile(
      `backup-local-${timestamp}.csv`,
      `${csv}\r\n`,
      "text/csv;charset=utf-8"
    );

    setBackupStats(await getLocalBackupStats());
  }

  const actionColor = locationColors[location] ?? "#bb0b0b";

  return (
    <main className="home-page">
      <div className="home-illustration">
        <div className="home-logos">
          <Image src="/images/logos/pucpr.png" alt="PUCPR" width={200} height={200} className="home-logo-pucpr" priority />
          <Image src="/images/logos/nmsu.png" alt="NMSU" width={200} height={200} className="home-logo-nmsu" />
          <Image src="/images/logos/ufba.png" alt="UFBA" width={200} height={200} className="home-logo-ufba" />
        </div>

        <div className="home-card">
          <h1>{t("home.welcome")}</h1>

          <label className="home-location-field">
            <span>{t("start.location")}</span>

            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            >
              {locations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="home-secondary-btn"
            onClick={handleCreateUser}
          >
            {t("home.createUser")}
          </button>

          {participantId && (
            <div className="participant-id-box">
              <span>{t("start.currentId")}</span>
              <strong>{participantId}</strong>
            </div>
          )}

          <button
            type="button"
            className="home-primary-btn"
            style={{ background: actionColor }}
            onClick={handleEnter}
          >
            <span>{t("home.enter")}</span>
          </button>
        </div>
      </div>

      <div className="help-widget">
        <button
          type="button"
          className="help-button"
          onClick={() => setHelpOpen((open) => !open)}
        >
          Help
          {pendingCount > 0 && (
            <span className="help-badge">{pendingCount}</span>
          )}
        </button>

        {helpOpen && (
          <div className="help-panel">
            <strong>Backup local</strong>
            <p>
              {pendingCount === 0
                ? "Nenhum envio pendente no tablet."
                : `${pendingCount} envio(s) aguardando sincronização.`}
            </p>
            <div className="help-stats">
              <span>Participantes: {backupStats.participantCount}</span>
              <span>
                Último dado salvo: {" "}
                {backupStats.lastSavedAt
                  ? new Date(backupStats.lastSavedAt).toLocaleString("pt-BR")
                  : "nenhum"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSyncPending}
              disabled={syncingPending || pendingCount === 0}
            >
              {syncingPending ? "Sincronizando..." : "Tentar reenviar"}
            </button>

            <button
              type="button"
              onClick={handleExportBackup}
              disabled={backupStats.backupCount === 0}
            >
              Exportar backup
            </button>

            {helpMessage && <small>{helpMessage}</small>}
          </div>
        )}
      </div>
    </main>
  );
}
