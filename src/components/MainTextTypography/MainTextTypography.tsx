import { forwardRef, type Ref } from "react";
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
  | "p"
  | "caption";

type LetterSpacing = "tight" | "normal" | "wide" | "wider";
type Weight = "regular" | "medium" | "bold" | "black";
type TextAlign = "left" | "center" | "right";
type Tone = "default" | "player";

interface MainTextTypographyProps {
  id?: string;
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  muted?: boolean;
  letterSpacing?: LetterSpacing;
  weight?: Weight;
  textAlign?: TextAlign;
  tone?: Tone;
}

export const MainTextTypography = forwardRef<
  HTMLElement,
  MainTextTypographyProps
>(function MainTextTypography(
  {
    id,
    variant = "body",
    className,
    children,
    muted,
    letterSpacing,
    weight,
    textAlign,
    tone = "default",
  },
  ref,
) {
  const classNames = clsx(
    styles.text,
    styles[variant],
    letterSpacing && styles[`ls_${letterSpacing}`],
    weight && styles[`w_${weight}`],
    muted && styles.muted,
    tone !== "default" && styles[`tone_${tone}`],
    textAlign && styles[`ta_${textAlign}`],
    className,
  );

  if (variant === "p") {
    return (
      <p id={id} ref={ref as Ref<HTMLParagraphElement>} className={classNames}>
        {children}
      </p>
    );
  }

  return (
    <span id={id} ref={ref as Ref<HTMLSpanElement>} className={classNames}>
      {children}
    </span>
  );
});

MainTextTypography.displayName = "MainTextTypography";
