import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import "./App.css";

/* ------------------------------------------------------------------ */
/*  Theme definitions — every colour in the app flows from these       */
/* ------------------------------------------------------------------ */

type ThemeName = "Pink" | "Blue" | "Purple" | "Green" | "Yellow";

interface Theme {
  gradStart: string;
  gradEnd: string;
  accent: string;
  accentSoft: string;
  overlay: string;
  text: string;
}

const THEMES: Record<ThemeName, Theme> = {
  Pink: {
    gradStart: "#ffe6ee",
    gradEnd: "#ffc0d6",
    accent: "#ff6f9c",
    accentSoft: "#ffd3e2",
    overlay: "255, 200, 217",
    text: "#3a2530",
  },
  Blue: {
    gradStart: "#e3f2ff",
    gradEnd: "#bcdcff",
    accent: "#4f9ae0",
    accentSoft: "#cfe8ff",
    overlay: "196, 222, 250",
    text: "#20303f",
  },
  Purple: {
    gradStart: "#f1e6ff",
    gradEnd: "#d9c0fb",
    accent: "#9a6fd6",
    accentSoft: "#e3d3fb",
    overlay: "222, 205, 250",
    text: "#2e2140",
  },
  Green: {
    gradStart: "#e8f8ee",
    gradEnd: "#c3ecd3",
    accent: "#4caf82",
    accentSoft: "#d3f0dd",
    overlay: "205, 235, 217",
    text: "#1f3a2b",
  },
  Yellow: {
    gradStart: "#fff8dd",
    gradEnd: "#ffe9ab",
    accent: "#e0a72f",
    accentSoft: "#ffefc4",
    overlay: "250, 233, 190",
    text: "#3a2f14",
  },
};

const SYMBOLS = [
  "♡",
  "♥",
  "✦",
  "✧",
  "⋆",
  "˚ʚ♡ɞ˚",
  "˙ᵕ˙",
  "˗ˏˋ♡ˎˊ˗",
  "⋆｡°✩",
  "(｡•́‿•̀｡)",
  "ʕ•́ᴥ•̀ʔ",
];
const PHOTO_COUNT = 7;
const photoSrc = (i: number): string =>
  `/images/her-${String(Math.min(i, PHOTO_COUNT - 1) + 1).padStart(2, "0")}.webp`;
const HANG_OFFSETS = [18, 46, 10, 58, 30, 42, 14]; // px — thread length per photo
const HANG_ROT = [-3, 2, -2, 3, -4, 2, -1]; // deg — sway range per photo
const HANG_DUR = [5.5, 6.4, 5.8, 7, 6, 6.8, 5.2]; // s — sway speed per photo

const MARQUEE_START = 8;
const MARQUEE_END = 15;
const MARQUEE_IMAGES: string[] = Array.from(
  { length: MARQUEE_END - MARQUEE_START + 1 },
  (_, i) => `/images/her-${String(MARQUEE_START + i).padStart(2, "0")}.webp`
);
const TOTAL_SECTIONS = 16;
const bgPhotoIndex = (sectionIndex: number): number =>
  Math.round((sectionIndex / (TOTAL_SECTIONS - 1)) * (PHOTO_COUNT - 1));

/* ------------------------------------------------------------------ */
/*  Answers shape                                                       */
/* ------------------------------------------------------------------ */

interface Answers {
  colour: ThemeName | "";
  perfectDay: string;
  neverBored: string;
  comfort: string;
  smile: string;
  destination: string;
  secretLove: string;
  someday: string;
  schedule: string;
  music: string[];
  workRating: string;
  chocolate: string;
}

type AnswerKey = keyof Answers;

/* ------------------------------------------------------------------ */
/*  Floating background symbols                                        */
/* ------------------------------------------------------------------ */

interface FloatingSymbolStyle extends CSSProperties {
  "--dur"?: string;
  "--delay"?: string;
  "--drift-x"?: string;
  "--drift-y"?: string;
  "--rot"?: string;
}

function FloatingSymbols() {
  const symbols = useMemo(() => {
    return Array.from({ length: 38 }).map((_, i) => {
      const left = 3 + (i / 38) * 92 + (Math.random() * 4 - 2);
      const top = 3 + Math.random() * 92;
      const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      const isKaomoji = symbol.length > 2;
      const size = isKaomoji ? 13 + Math.random() * 5 : 16 + Math.random() * 20;
      const opacity = isKaomoji ? 0.22 + Math.random() * 0.2 : 0.18 + Math.random() * 0.22;
      const duration = 12 + Math.random() * 12;
      const delay = -Math.random() * duration;
      const driftX = (Math.random() > 0.5 ? 1 : -1) * (14 + Math.random() * 18);
      const driftY = -(18 + Math.random() * 24);
      const rot = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 10);
      return { id: i, left, top, size, opacity, duration, delay, driftX, driftY, rot, symbol };
    });
  }, []);

  return (
    <div className="floating-layer" aria-hidden="true">
      {symbols.map((s) => {
        const style: FloatingSymbolStyle = {
          left: `${s.left}%`,
          top: `${s.top}%`,
          fontSize: `${s.size}px`,
          opacity: s.opacity,
          "--dur": `${s.duration}s`,
          "--delay": `${s.delay}s`,
          "--drift-x": `${s.driftX}px`,
          "--drift-y": `${s.driftY}px`,
          "--rot": `${s.rot}deg`,
        };
        return (
          <span key={s.id} className="floating-symbol" style={style}>
            {s.symbol}
          </span>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Crossfading photo background                                       */
/* ------------------------------------------------------------------ */

function PhotoBackground({ photoIndex, hidden }: { photoIndex: number; hidden?: boolean }) {
  return (
    <div className={`photo-background${hidden ? " photo-background--hidden" : ""}`} aria-hidden="true">
      {Array.from({ length: PHOTO_COUNT }).map((_, i) => (
        <div
          key={i}
          className={`photo-layer${i === photoIndex ? " is-visible" : ""}`}
          style={{ backgroundImage: `url(${photoSrc(i)})` }}
        />
      ))}
      <div className="photo-overlay" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  A single question "moment"                                         */
/* ------------------------------------------------------------------ */

interface QuestionSectionProps {
  innerRef: (el: HTMLElement | null) => void;
  eyebrow?: string;
  question: string;
  children?: React.ReactNode;
  tall?: boolean;
}

function QuestionSection({ innerRef, eyebrow, question, children, tall }: QuestionSectionProps) {
  return (
    <section ref={innerRef} className={`moment${tall ? " moment--tall" : ""}`}>
      <div className="moment-inner">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="question">{question}</h2>
        {children}
      </div>
    </section>
  );
}

export interface ChoicePillsProps<T extends string | string[]> {
  options: string[];
  value: T;
  onChange: (val: T extends string[] ? string[] : string) => void;
  multiple?: boolean;
}

function ChoicePills({
  options,
  value,
  onChange,
  multiple,
}: {
  options: string[];
  value: string | string[];
  onChange: (val: any) => void;
  multiple?: boolean;
}) {
  const isSelected = (opt: string) =>
    multiple ? (value as string[])?.includes(opt) : value === opt;

  const handleClick = (opt: string) => {
    if (multiple) {
      const set = new Set((value as string[]) || []);
      set.has(opt) ? set.delete(opt) : set.add(opt);
      onChange(Array.from(set));
    } else {
      onChange(opt);
    }
  };

  return (
    <div className="pill-row">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          className={`pill${isSelected(opt) ? " pill--selected" : ""}`}
          onClick={() => handleClick(opt)}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Backend API Integration                                            */
/* ------------------------------------------------------------------ */

const env = import.meta.env as Record<string, string | undefined>;
const BASE_API_URL = (
  env.BASE_API_URL ||
  env.VITE_BASE_API_URL ||
  env.VITE_BASE_API ||
  env.VITE_API_URL ||
  ""
).replace(/\/$/, "");

export const API_ENDPOINT = BASE_API_URL ? `${BASE_API_URL}/api/responses` : "/api/responses";

export async function postAllAnswers(finalAnswers: Answers) {
  try {
    await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answers: finalAnswers,
        ...finalAnswers,
        submittedAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Silent catch so UI is clean and uninterrupted
  }
}

export const postAnswers = postAllAnswers;

function TextMoment({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      className="whisper-input"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  App                                                                 */
/* ------------------------------------------------------------------ */

export default function App() {
  const themeName: ThemeName = "Pink";
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [started, setStarted] = useState<boolean>(false);
  const [answers, setAnswers] = useState<Answers>({
    colour: "",
    perfectDay: "",
    neverBored: "",
    comfort: "",
    smile: "",
    destination: "",
    secretLove: "",
    someday: "",
    schedule: "",
    music: [],
    workRating: "",
    chocolate: "",
  });

  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const firstQuestionRef = useRef<HTMLElement | null>(null);

  const setAnswer =
    <K extends AnswerKey>(key: K) =>
      (val: Answers[K]) => {
        setAnswers((prev) => ({ ...prev, [key]: val }));
      };

  const handleFinalChocolateSelect = (val: string) => {
    const finalAnswers = { ...answers, chocolate: val };
    setAnswers(finalAnswers);
    postAllAnswers(finalAnswers);
  };

  /* Apply the theme to CSS variables on the root element */
  useEffect(() => {
    const t = THEMES[themeName] || THEMES.Pink;
    const root = document.documentElement;
    root.style.setProperty("--grad-start", t.gradStart);
    root.style.setProperty("--grad-end", t.gradEnd);
    root.style.setProperty("--accent", t.accent);
    root.style.setProperty("--accent-soft", t.accentSoft);
    root.style.setProperty("--overlay-rgb", t.overlay);
    root.style.setProperty("--ink", t.text);
  }, []);

  /* Track which section is centred in the viewport */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            setActiveIndex(idx);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sectionRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const registerRef = (index: number) => (el: HTMLElement | null) => {
    sectionRefs.current[index] = el;
    if (el) el.dataset.index = String(index);
  };

  const handleStart = () => {
    setStarted(true);
    firstQuestionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleColourSelect = (colour: string) => {
    const name = colour as ThemeName;
    setAnswer("colour")(name);
  };

  return (
    <div className="app">
      <PhotoBackground photoIndex={bgPhotoIndex(activeIndex)} hidden={activeIndex === 0} />
      <FloatingSymbols />

      <main className="story">
        {/* INTRO — index 0 */}
        <section ref={registerRef(0)} className="moment moment--intro">
          <div className="moment-inner">
            <p className="eyebrow">Mainū labbhaṇ vich madad karo.</p>
            <h1 className="intro-heading">
              I wanna know more
              <br />
              about you
              <br />
              <br />
              Vanni ♡
            </h1>
            <button
              type="button"
              className={`start-button${started ? " start-button--clicked" : ""}`}
              onClick={handleStart}
            >
              Start ♡
            </button>
          </div>
          <div className="scroll-hint">
            <span>SCROLL</span>
            <span className="scroll-arrow">↓</span>
          </div>
        </section>

        {/* QUESTION 1 — colour, index 1 */}
        <QuestionSection
          innerRef={(el) => {
            registerRef(1)(el);
            firstQuestionRef.current = el;
          }}
          eyebrow="Bas pehlāṁ ikk choṭī jihī gall…"
          question="What's your favourite colour?"
        >
          <ChoicePills
            options={["Pink", "Blue", "Purple", "Green", "Yellow"]}
            value={answers.colour}
            onChange={handleColourSelect}
          />
          {answers.colour && (
            <p className="eyebrow colour-feedback">
              Honestly pink was best while desiging
            </p>
          )}
        </QuestionSection>

        {/* QUESTION 2 — index 2 */}
        <QuestionSection
          innerRef={registerRef(2)}
          eyebrow={answers.colour ? "Honestly pink was best while desiging" : "if you had the choice"}
          question="What's your kind of perfect day?"
        >
          <ChoicePills
            options={["Cozy at home", "Going somewhere", "Food + talking", "A little adventure"]}
            value={answers.perfectDay}
            onChange={setAnswer("perfectDay")}
          />
        </QuestionSection>

        {/* QUESTION 3 — index 3 */}
        <QuestionSection
          innerRef={registerRef(3)}
          eyebrow="thinking out loud :)"
          question="What's something you could never get bored of?"
        >
          <ChoicePills
            options={["Singing songs", "Make lassi", "Travelling", "Talking to favourite", "Be honest: Sleeping"]}
            value={answers.neverBored}
            onChange={setAnswer("neverBored")}
          />
        </QuestionSection>

        {/* QUESTION 4 — index 4 */}
        <QuestionSection
          innerRef={registerRef(4)}
          eyebrow="In trouble!!"
          question="What's the hardest you got"
        >
          <ChoicePills
            options={["Trauma", "Anxiety", "Failures", "Relations", "Expectations"]}
            value={answers.comfort}
            onChange={setAnswer("comfort")}
          />
        </QuestionSection>

        {/* QUESTION 5 — index 5, text */}
        <QuestionSection
          innerRef={registerRef(5)}
          eyebrow="a small one"
          question="What instantly makes you smile?"
        >
          <TextMoment
            value={answers.smile}
            onChange={setAnswer("smile")}
            placeholder="type it softly..."
          />
        </QuestionSection>

        {/* QUESTION 6 — index 6 */}
        <QuestionSection
          innerRef={registerRef(6)}
          eyebrow="close your eyes for a second"
          question="If you could disappear somewhere right now..."
        >
          <ChoicePills
            options={["Mountains", "Beach", "City", "Somewhere quiet"]}
            value={answers.destination}
            onChange={setAnswer("destination")}
          />
        </QuestionSection>

        {/* QUESTION 7 — index 7, text */}
        <QuestionSection
          innerRef={registerRef(7)}
          eyebrow="just between us"
          question="What's something you secretly love?"
        >
          <TextMoment
            value={answers.secretLove}
            onChange={setAnswer("secretLove")}
            placeholder="i won't tell anyone..."
          />
        </QuestionSection>

        {/* QUESTION 8 — index 8, text */}
        <QuestionSection
          innerRef={registerRef(8)}
          eyebrow="looking ahead"
          question="What's something you want to experience someday?"
        >
          <TextMoment
            value={answers.someday}
            onChange={setAnswer("someday")}
            placeholder="dream a little..."
          />
        </QuestionSection>

        {/* QUESTION 9 — index 9 */}
        <QuestionSection
          innerRef={registerRef(9)}
          eyebrow="be honest"
          question="Dogs or Cats?"
        >
          <ChoicePills
            options={["Dogs", "Cats"]}
            value={answers.schedule}
            onChange={setAnswer("schedule")}
          />
        </QuestionSection>

        {/* QUESTION 10 — index 10, multi */}
        <QuestionSection
          innerRef={registerRef(10)}
          eyebrow="pick as many as you like"
          question="What's your kind of music?"
        >
          <ChoicePills
            options={["Punjabi Sad", "Bollywood", "Hip-hop", "Acoustic", "Anything with feeling"]}
            value={answers.music}
            onChange={setAnswer("music")}
            multiple
          />
        </QuestionSection>

        {/* SLIDING STRIP — index 11, independent of scroll position */}
        <section ref={registerRef(11)} className="moment moment--marquee">
          <div className="moment-inner moment-inner--wide">
            <p className="eyebrow">what I found werre :-']'</p>
          </div>
          <div className="marquee">
            <div className="marquee-track">
              {[...MARQUEE_IMAGES, ...MARQUEE_IMAGES].map((src, i) => (
                <div className="marquee-item" key={i}>
                  <img src={src} alt="" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
          <br />
          <div className="marquee">
            <div className="marquee-track">
              {[...MARQUEE_IMAGES, ...MARQUEE_IMAGES].map((src, i) => (
                <div className="marquee-item" key={i--}>
                  <img src={src} alt="" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
          <br />
        </section >

        {/* QUESTION 11 — work rating, index 12 */}
        <QuestionSection
          innerRef={registerRef(12)}
          eyebrow="be honest :)"
          question="Was this work nice ?"
        >
          <ChoicePills
            options={["1/10 bad coder", "10/10 never met a coder", "hire you for next work"]}
            value={answers.workRating}
            onChange={setAnswer("workRating")}
          />
        </QuestionSection>

        {/* FINAL QUESTION — chocolate, index 13 */}
        <QuestionSection
          innerRef={registerRef(13)}
          eyebrow="okay... one last thing"
          question="Dark chocolate or sweet chocolate?"
        >
          <ChoicePills
            options={["Dark chocolate", "Sweet chocolate"]}
            value={answers.chocolate}
            onChange={handleFinalChocolateSelect}
          />
          {answers.chocolate && (
            <p className="eyebrow colour-feedback">
              answers sent for correction
            </p>
          )}
        </QuestionSection>

        {/* PHOTO STRING — index 14 */}
        <section ref={registerRef(14)} className="moment moment--wall">
          <div className="moment-inner moment-inner--wide">
            <p className="eyebrow">seven little moments found while scrolling shhh!</p>
            <h2 className="question">before I go...</h2>
            <div className="string-wall">
              <div className="string-line" />
              <div className="hanging-row">
                {Array.from({ length: PHOTO_COUNT }).map((_, i) => (
                  <div
                    key={i}
                    className="hang-item"
                    style={{ "--rot": `${HANG_ROT[i] ?? 0}deg`, "--dur": `${HANG_DUR[i] ?? 6}s` } as CSSProperties}
                  >
                    <span className="hang-pin" />
                    <span className="hang-thread" style={{ height: `${HANG_OFFSETS[i] ?? 24}px` }} />
                    <div className="polaroid">
                      <img src={photoSrc(i)} alt="" loading="lazy" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ENDING — index 15 */}
        <section ref={registerRef(15)} className="moment moment--final">
          <div className="moment-inner">
            <p className="eyebrow">and just like that</p>
            <h2 className="final-heading">
              now I know
              <br />a little more about you than yesterday♡
            </h2>
            <p className="final-signature">ਵੱਨੀ ਲਈ, ਦਿਲੋਂ ਬਣਾਇਆ ਗਿਆ ♡</p>
            <p className="final-translation">made for u lawyer!, with a pure heart</p>
            <br />
            <p className="final-translation">Rate this work on insta dm :) raat ke 4 baje tak lag ghaya subha 8 mein class hein,,,,, <br />BYE BYEE sona hein</p>
          </div>
        </section>
      </main >
    </div >
  );
}