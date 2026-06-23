"use client";

import type { MouseEvent } from "react";
import { useLanguage } from "@/lib/i18n";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmColor?: string;
  onConfirm: (event?: MouseEvent<HTMLButtonElement>) => void;
  onCancel: (event?: MouseEvent<HTMLButtonElement>) => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmColor,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useLanguage();

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <section
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
      >
        <h2 id="confirmation-modal-title">{title}</h2>
        <p>{message}</p>

        <div className="final-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            {t("common.noBack")}
          </button>

          <button
            type="button"
            className="primary-button"
            style={confirmColor ? { background: confirmColor } : undefined}
            onClick={onConfirm}
          >
            {t("common.yesConfirm")}
          </button>
        </div>
      </section>
    </div>
  );
}
