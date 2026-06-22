"use client";

import { useRef, useState } from "react";
import { useLanguage, TranslationKey } from "@/lib/i18n";

export type DemographicsData = {
  gender: string;
  ageGroup: string;
  educationLevel: string;
  incomeGroup: string;
};

type DemographicsFormProps = {
  onSubmit: (data: DemographicsData) => void | Promise<void>;
  locationColor?: string;
};

export default function DemographicsForm({ onSubmit, locationColor }: DemographicsFormProps) {
  const { t } = useLanguage();
  const [gender, setGender] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [incomeGroup, setIncomeGroup] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const isComplete = gender && ageGroup && educationLevel && incomeGroup;

  const genderOptions: { key: TranslationKey; value: string }[] = [
    { key: "demo.male", value: "Masculino" },
    { key: "demo.female", value: "Feminino" },
    { key: "demo.noSay", value: "Prefiro não informar" },
  ];

  const ageOptions: { key: TranslationKey; value: string }[] = [
    { key: "demo.age1", value: "18–24 anos" },
    { key: "demo.age2", value: "25–34 anos" },
    { key: "demo.age3", value: "35–44 anos" },
    { key: "demo.age4", value: "45–59 anos" },
    { key: "demo.age5", value: "60 anos ou mais" },
  ];

  const educationOptions: { key: TranslationKey; value: string }[] = [
    { key: "demo.edu1", value: "Sem escolaridade ou ensino fundamental incompleto" },
    { key: "demo.edu2", value: "Ensino fundamental completo ou ensino médio incompleto" },
    { key: "demo.edu3", value: "Ensino médio completo ou ensino superior incompleto" },
    { key: "demo.edu4", value: "Ensino superior completo" },
    { key: "demo.edu5", value: "Pós-graduação, mestrado ou doutorado" },
  ];

  const incomeOptions: { key: TranslationKey; value: string }[] = [
    { key: "demo.inc1", value: "Até 1 salário mínimo — até R$ 1.621" },
    { key: "demo.inc2", value: "De 1 a 2 salários mínimos — R$ 1.621 a R$ 3.242" },
    { key: "demo.inc3", value: "De 2 a 5 salários mínimos — R$ 3.242 a R$ 8.105" },
    { key: "demo.inc4", value: "De 5 a 10 salários mínimos — R$ 8.105 a R$ 16.210" },
    { key: "demo.inc5", value: "Mais de 10 salários mínimos — acima de R$ 16.210" },
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current) return;

    if (!isComplete) {
      alert(t("demo.alert"));
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      await onSubmit({
        gender,
        ageGroup,
        educationLevel,
        incomeGroup,
      });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form className="demographics-form" onSubmit={handleSubmit}>
      <div className="form-intro">
        <div className="badge" style={{ background: locationColor ?? "#bb0b0b" }}>{t("demo.badge")}</div>
        <h2>{t("demo.title")}</h2>
        <p>
          {t("demo.subtitle")}
        </p>
      </div>

      <fieldset>
        <legend>{t("demo.gender")}</legend>

        {genderOptions.map((opt) => (
          <label key={opt.value}>
            <input
              type="radio"
              name="gender"
              value={opt.value}
              checked={gender === opt.value}
              onChange={(event) => setGender(event.target.value)}
            />
            {t(opt.key)}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t("demo.age")}</legend>

        {ageOptions.map((opt) => (
          <label key={opt.value}>
            <input
              type="radio"
              name="ageGroup"
              value={opt.value}
              checked={ageGroup === opt.value}
              onChange={(event) => setAgeGroup(event.target.value)}
            />
            {t(opt.key)}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t("demo.education")}</legend>

        {educationOptions.map((opt) => (
          <label key={opt.value}>
            <input
              type="radio"
              name="educationLevel"
              value={opt.value}
              checked={educationLevel === opt.value}
              onChange={(event) => setEducationLevel(event.target.value)}
            />
            {t(opt.key)}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t("demo.income")}</legend>

        {incomeOptions.map((opt) => (
          <label key={opt.value}>
            <input
              type="radio"
              name="incomeGroup"
              value={opt.value}
              checked={incomeGroup === opt.value}
              onChange={(event) => setIncomeGroup(event.target.value)}
            />
            {t(opt.key)}
          </label>
        ))}
      </fieldset>

      <button
        type="submit"
        className={isComplete && !isSubmitting ? "purchase-button" : "purchase-button disabled"}
        disabled={isSubmitting || !isComplete}
        style={isComplete && !isSubmitting ? { background: locationColor ?? "#bb0b0b" } : undefined}
      >
        {isSubmitting ? t("demo.saving") : t("demo.finish")}
      </button>
    </form>
  );
}
