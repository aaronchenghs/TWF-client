import clsx from "clsx";
import styles from "./MainTextTypography.module.scss";

type Variant =
  | "display"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "title"
  | "label"
  | "body"
  | "caption";

type LetterSpacing = "tight" | "normal" | "wide" | "wider";
type Weight = "regular" | "medium" | "bold" | "black";
type TextAlign = "left" | "center" | "right";
type Tone = "default" | "player";

interface MainTextTypographyProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  muted?: boolean;
  letterSpacing?: LetterSpacing;
  weight?: Weight;
  textAlign?: TextAlign;
  tone?: Tone;
}

export function MainTextTypography({
  variant = "body",
  className,
  children,
  muted,
  letterSpacing = "normal",
  weight,
  textAlign,
  tone = "default",
}: MainTextTypographyProps) {
  return (
    <span
      className={clsx(
        styles.text,
        styles[variant],
        styles[`ls_${letterSpacing}`],
        weight && styles[`w_${weight}`],
        muted && styles.muted,
        tone !== "default" && styles[`tone_${tone}`],
        textAlign && styles[`ta_${textAlign}`],
        className,
      )}
    >
      {children}
    </span>
  );
}
