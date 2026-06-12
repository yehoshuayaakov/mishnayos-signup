"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { siteConfig } from "@/lib/config";

type Tractate = {
  id: number;
  seder: string;
  name: string;
  chapters: number;
  claimed_by: string | null;
};

const SEDER_ORDER = ["זרעים", "מועד", "נשים", "נזיקין", "קדשים", "טהרות"];

export default function Home() {
  const [tractates, setTractates] = useState<Tractate[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [photoOk, setPhotoOk] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setTractates(json.tractates);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (claimingId !== null) inputRef.current?.focus();
  }, [claimingId]);

  async function submitClaim(id: number) {
    const name = nameInput.trim();
    if (!name || submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });
      if (res.ok) {
        setMessage({ kind: "ok", text: "תודה רבה! המסכת נרשמה על שמכם. תזכו למצוות!" });
        setClaimingId(null);
        setNameInput("");
      } else if (res.status === 409) {
        setMessage({ kind: "err", text: "המסכת הזו נתפסה זה עתה על ידי מישהו אחר. נא לבחור מסכת אחרת." });
        setClaimingId(null);
        setNameInput("");
      } else {
        setMessage({ kind: "err", text: "אירעה שגיאה. נסו שוב בעוד רגע." });
      }
    } catch {
      setMessage({ kind: "err", text: "אירעה שגיאה. בדקו את החיבור לאינטרנט ונסו שוב." });
    } finally {
      setSubmitting(false);
      load();
    }
  }

  const bySeder = useMemo(() => {
    const groups = new Map<string, Tractate[]>();
    for (const seder of SEDER_ORDER) groups.set(seder, []);
    for (const t of tractates ?? []) {
      if (!groups.has(t.seder)) groups.set(t.seder, []);
      groups.get(t.seder)!.push(t);
    }
    return groups;
  }, [tractates]);

  const total = tractates?.length ?? 0;
  const claimed = tractates?.filter((t) => t.claimed_by).length ?? 0;
  const pct = total ? Math.round((claimed / total) * 100) : 0;

  return (
    <>
      <div className="hero">
        <div className="hero-inner">
          {photoOk && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={siteConfig.photo}
              alt=""
              className="hero-photo"
              onError={() => setPhotoOk(false)}
            />
          )}
          <h1>{siteConfig.inMemoryOf}</h1>
          {siteConfig.subtitle && <p className="hero-subtitle">{siteConfig.subtitle}</p>}
          <p className="hero-instructions">{siteConfig.instructions}</p>
        </div>
      </div>

      <main className="container">
        {total > 0 && (
          <section className="progress-card">
            <div className="progress-row">
              <span className="progress-text">
                נלקחו <strong>{claimed}</strong> מתוך <strong>{total}</strong> מסכתות
              </span>
              <span className="progress-pct">{pct}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </section>
        )}

        {message && (
          <div className={`banner ${message.kind === "ok" ? "banner-ok" : "banner-err"}`}>
            {message.text}
          </div>
        )}

        {loadError && tractates === null && (
          <div className="banner banner-err">לא ניתן לטעון את הנתונים. נסו לרענן את הדף.</div>
        )}
        {tractates === null && !loadError && <div className="loading">טוען…</div>}

        {tractates !== null &&
          SEDER_ORDER.filter((s) => (bySeder.get(s) ?? []).length > 0).map((seder) => {
            const items = bySeder.get(seder)!;
            const taken = items.filter((t) => t.claimed_by).length;
            return (
              <section key={seder} className="seder-card">
                <div className="seder-head">
                  <h2>סדר {seder}</h2>
                  <span className="seder-count">
                    {taken}/{items.length}
                  </span>
                </div>
                <ul className="tractate-list">
                  {items.map((t) => (
                    <li key={t.id} className={t.claimed_by ? "row row-taken" : "row"}>
                      <div className="t-info">
                        <span className="t-name">{t.name}</span>
                        <span className="t-chapters">{t.chapters} פרקים</span>
                      </div>
                      <div className="t-status">
                        {t.claimed_by ? (
                          <span className="chip-taken">
                            <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
                              <path
                                d="M3 8.5 6.2 11.7 13 4.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            {t.claimed_by}
                          </span>
                        ) : claimingId === t.id ? (
                          <form
                            className="claim-form"
                            onSubmit={(e) => {
                              e.preventDefault();
                              submitClaim(t.id);
                            }}
                          >
                            <input
                              ref={inputRef}
                              type="text"
                              value={nameInput}
                              maxLength={60}
                              placeholder="השם שלכם"
                              onChange={(e) => setNameInput(e.target.value)}
                              disabled={submitting}
                            />
                            <button type="submit" className="btn btn-confirm" disabled={submitting}>
                              אישור
                            </button>
                            <button
                              type="button"
                              className="btn btn-cancel"
                              disabled={submitting}
                              onClick={() => {
                                setClaimingId(null);
                                setNameInput("");
                              }}
                            >
                              ביטול
                            </button>
                          </form>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-claim"
                            onClick={() => {
                              setClaimingId(t.id);
                              setNameInput("");
                              setMessage(null);
                            }}
                          >
                            לקבלת המסכת
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

        <footer className="footer">תהא נשמתו צרורה בצרור החיים</footer>
      </main>
    </>
  );
}
