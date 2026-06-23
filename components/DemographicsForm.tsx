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
    { key: "demo.male", value: "male" },
    { key: "demo.female", value: "female" },
    { key: "demo.noSay", value: "prefer_not_to_say" },
  ];

  const ageOptions: { key: TranslationKey; value: string }[] = [
    { key: "demo.age1", value: "age_18_24" },
    { key: "demo.age2", value: "age_25_34" },
    { key: "demo.age3", value: "age_35_44" },
    { key: "demo.age4", value: "age_45_59" },
    { key: "demo.age5", value: "age_60_plus" },
  ];

  const educationOptions: { key: TranslationKey; value: string }[] = [
    { key: "demo.edu1", value: "less_than_high_school" },
    { key: "demo.edu2", value: "high_school_or_ged" },
    { key: "demo.edu3", value: "some_college_or_associate" },
    { key: "demo.edu4", value: "bachelor" },
    { key: "demo.edu5", value: "graduate" },
  ];

  const incomeOptions: { key: TranslationKey; value: string }[] = [
    { key: "demo.inc1", value: "income_1" },
    { key: "demo.inc2", value: "income_2" },
    { key: "demo.inc3", value: "income_3" },
    { key: "demo.inc4", value: "income_4" },
    { key: "demo.inc5", value: "income_5" },
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

