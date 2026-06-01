import { createElement, type CSSProperties, type ReactNode } from "react";
import { clamp } from "radashi";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";

export type ToolTipPlacement = "top" | "bottom" | "left" | "right";
export type ToolTipAlign = "start" | "center" | "end";

const VIEWPORT_MARGIN = 8;
const ALL_PLACEMENTS: ToolTipPlacement[] = ["top", "bottom", "left", "right"];
const OPPOSITE_PLACEMENT: Record<ToolTipPlacement, ToolTipPlacement> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

export function hasTooltipContent(content: ReactNode) {
  return content !== null && content !== undefined;
}

export function getDirectionalRoom(
  wrapperRect: DOMRect,
  offset: number,
): Record<ToolTipPlacement, number> {
  return {
    top: wrapperRect.top - offset - VIEWPORT_MARGIN,
    bottom: window.innerHeight - wrapperRect.bottom - offset - VIEWPORT_MARGIN,
    left: wrapperRect.left - offset - VIEWPORT_MARGIN,
    right: window.innerWidth - wrapperRect.right - offset - VIEWPORT_MARGIN,
  };
}

export function resolveToolTipPlacement(args: {
  placement: ToolTipPlacement;
  responsive: boolean;
  tooltipRect: DOMRect;
  directionalRoom: Record<ToolTipPlacement, number>;
}): ToolTipPlacement {
  const { placement, responsive, tooltipRect, directionalRoom } = args;

  const hasDirectionalRoom = (candidate: ToolTipPlacement) => {
    if (candidate === "top" || candidate === "bottom")
      return directionalRoom[candidate] >= tooltipRect.height;
    return directionalRoom[candidate] >= tooltipRect.width;
  };

  const fallbackPlacements = ALL_PLACEMENTS.filter(
    (candidate) =>
      candidate !== placement && candidate !== getOppositePlacement(placement),
  ).sort((a, b) => directionalRoom[b] - directionalRoom[a]);

  const placementCandidates = responsive
    ? [placement, getOppositePlacement(placement), ...fallbackPlacements]
    : [placement];

  return placementCandidates.find(hasDirectionalRoom) ?? placementCandidates[0];
}

export function getTooltipPosition(args: {
  wrapperRect: DOMRect;
  tooltipRect: DOMRect;
  placement: ToolTipPlacement;
  align: ToolTipAlign;
  offset: number;
}): Pick<CSSProperties, "top" | "left"> {
  const { wrapperRect, tooltipRect, placement, align, offset } = args;

  let top = 0;
  let left = 0;

  const horizontalCenter =
    wrapperRect.left + (wrapperRect.width - tooltipRect.width) / 2;
  const verticalCenter =
    wrapperRect.top + (wrapperRect.height - tooltipRect.height) / 2;

  switch (placement) {
    case "bottom":
      top = wrapperRect.bottom + offset;
      break;
    case "left":
      left = wrapperRect.left - tooltipRect.width - offset;
      break;
    case "right":
      left = wrapperRect.right + offset;
      break;
    default:
      top = wrapperRect.top - tooltipRect.height - offset;
      break;
  }

  if (placement === "top" || placement === "bottom") {
    if (align === "start") left = wrapperRect.left;
    if (align === "center") left = horizontalCenter;
    if (align === "end") left = wrapperRect.right - tooltipRect.width;
  } else {
    if (align === "start") top = wrapperRect.top;
    if (align === "center") top = verticalCenter;
    if (align === "end") top = wrapperRect.bottom - tooltipRect.height;
  }

  return {
    top: clamp(
      top,
      VIEWPORT_MARGIN,
      window.innerHeight - tooltipRect.height - VIEWPORT_MARGIN,
    ),
    left: clamp(
      left,
      VIEWPORT_MARGIN,
      window.innerWidth - tooltipRect.width - VIEWPORT_MARGIN,
    ),
  };
}

export function renderTooltipContent(args: {
  content: ReactNode;
  error: boolean;
  errorClassName?: string;
}) {
  const { content, error, errorClassName } = args;

  if (typeof content === "string" || typeof content === "number") {
    return createElement(MainTextTypography, {
      variant: "body",
      weight: "bold",
      className: error ? errorClassName : undefined,
      children: content,
    });
  }

  return content;
}

function getOppositePlacement(placement: ToolTipPlacement): ToolTipPlacement {
  return OPPOSITE_PLACEMENT[placement];
}
