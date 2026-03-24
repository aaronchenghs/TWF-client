import clsx from "clsx";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { MainTextTypography } from "../MainTextTypography/MainTextTypography";
import styles from "./ToolTip.module.scss";
import { clamp } from "radashi";

export type ToolTipPlacement = "top" | "bottom" | "left" | "right";
export type ToolTipAlign = "start" | "center" | "end";

export interface ToolTipWrapperProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "content"
> {
  children: React.ReactNode;
  content: React.ReactNode;
  error?: boolean;
  placement?: ToolTipPlacement;
  align?: ToolTipAlign;
  offset?: number;
  responsive?: boolean;
  disabled?: boolean;
  block?: boolean;
  tooltipClassName?: string;
}

const VIEWPORT_MARGIN = 8;
const ALL_PLACEMENTS: ToolTipPlacement[] = ["top", "bottom", "left", "right"];

export function ToolTipWrapper({
  children,
  content,
  error = false,
  placement = "top",
  align = "center",
  offset = 8,
  responsive = false,
  disabled = false,
  block = false,
  className,
  tooltipClassName,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocusCapture,
  onBlurCapture,
  ...props
}: ToolTipWrapperProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const touchOpenRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRendered, setIsRendered] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties | null>(
    null,
  );
  const [resolvedPlacement, setResolvedPlacement] =
    useState<ToolTipPlacement>(placement);
  const tooltipId = useId();
  const tooltipHasContent = hasTooltipContent(content);

  const resetTooltip = useCallback(() => {
    touchOpenRef.current = false;
    setIsOpen(false);
    setIsRendered(false);
    setTooltipStyle(null);
    setResolvedPlacement(placement);
  }, [placement]);

  const updatePosition = useCallback(() => {
    const wrapper = wrapperRef.current;
    const tooltip = tooltipRef.current;

    if (!wrapper || !tooltip) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const directionalRoom = getDirectionalRoom(wrapperRect, offset);
    const nextPlacement = resolvePlacement({
      placement,
      responsive,
      tooltipRect,
      directionalRoom,
    });
    const nextPosition = getTooltipPosition({
      wrapperRect,
      tooltipRect,
      placement: nextPlacement,
      align,
      offset,
    });

    setResolvedPlacement(nextPlacement);
    setTooltipStyle(nextPosition);
  }, [align, offset, placement, responsive]);

  const openTooltip = useCallback(() => {
    if (disabled || !tooltipHasContent) return;

    setIsRendered(true);
    setIsOpen(true);
  }, [disabled, tooltipHasContent]);

  const closeTooltip = useCallback(() => {
    touchOpenRef.current = false;
    setIsOpen(false);
  }, []);

  const handlePointerEnterInternal = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(event);
      if (event.defaultPrevented) return;
      if (event.pointerType === "touch") return;

      touchOpenRef.current = false;
      openTooltip();
    },
    [onPointerEnter, openTooltip],
  );

  const handlePointerLeaveInternal = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerLeave?.(event);
      if (event.defaultPrevented) return;
      if (event.pointerType === "touch" || touchOpenRef.current) return;

      closeTooltip();
    },
    [closeTooltip, onPointerLeave],
  );

  const handlePointerDownInternal = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(event);
      if (event.defaultPrevented) return;
      if (event.pointerType !== "touch") return;
      if (disabled || !tooltipHasContent) return;

      touchOpenRef.current = true;
      setIsRendered(true);
      setIsOpen(true);
    },
    [disabled, onPointerDown, tooltipHasContent],
  );

  const handleFocusCaptureInternal = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      onFocusCapture?.(event);
      if (event.defaultPrevented) return;

      touchOpenRef.current = false;
      openTooltip();
    },
    [onFocusCapture, openTooltip],
  );

  const handleBlurCaptureInternal = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      onBlurCapture?.(event);
      if (event.defaultPrevented) return;

      const nextFocusTarget = event.relatedTarget;
      if (
        nextFocusTarget instanceof Node &&
        event.currentTarget.contains(nextFocusTarget)
      ) {
        return;
      }

      closeTooltip();
    },
    [closeTooltip, onBlurCapture],
  );

  const handleTooltipAnimationEnd = useCallback(() => {
    if (isOpen) return;

    setIsRendered(false);
    setTooltipStyle(null);
    setResolvedPlacement(placement);
  }, [isOpen, placement]);

  useEffect(() => {
    if (!tooltipHasContent || disabled) {
      const timeoutId = window.setTimeout(resetTooltip, 0);
      return () => {
        window.clearTimeout(timeoutId);
      };
    }
  }, [disabled, resetTooltip, tooltipHasContent]);

  useEffect(() => {
    if (!isOpen || !touchOpenRef.current || typeof document === "undefined") {
      return;
    }

    // A touch-opened tooltip stays visible until the next tap outside.
    const handleDocumentPointerDown = (event: PointerEvent) => {
      const wrapper = wrapperRef.current;
      const target = event.target;
      if (!wrapper || !(target instanceof Node) || wrapper.contains(target)) {
        return;
      }

      touchOpenRef.current = false;
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isRendered) {
      return;
    }

    let frame = window.requestAnimationFrame(updatePosition);

    if (!isOpen) {
      return () => {
        window.cancelAnimationFrame(frame);
      };
    }

    const handleViewportChange = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updatePosition);
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [content, isOpen, isRendered, placement, updatePosition]);

  return (
    <>
      <div
        ref={wrapperRef}
        className={clsx(styles.root, block && styles.block, className)}
        onPointerEnter={handlePointerEnterInternal}
        onPointerLeave={handlePointerLeaveInternal}
        onPointerDown={handlePointerDownInternal}
        onFocusCapture={handleFocusCaptureInternal}
        onBlurCapture={handleBlurCaptureInternal}
        aria-describedby={isRendered ? tooltipId : undefined}
        {...props}
      >
        {children}
      </div>

      {isRendered &&
        tooltipHasContent &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className={clsx(
              styles.tooltip,
              error && styles.error,
              styles[resolvedPlacement],
              isOpen ? styles.opening : styles.closing,
              tooltipClassName,
            )}
            style={tooltipStyle ?? { visibility: "hidden" }}
            onAnimationEnd={handleTooltipAnimationEnd}
          >
            {renderTooltipContent(content, error)}
          </div>,
          document.body,
        )}
    </>
  );
}

function getOppositePlacement(placement: ToolTipPlacement): ToolTipPlacement {
  switch (placement) {
    case "bottom":
      return "top";
    case "left":
      return "right";
    case "right":
      return "left";
    default:
      return "bottom";
  }
}

function hasTooltipContent(content: React.ReactNode) {
  return content !== null && content !== undefined;
}

function getDirectionalRoom(
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

function resolvePlacement(args: {
  placement: ToolTipPlacement;
  responsive: boolean;
  tooltipRect: DOMRect;
  directionalRoom: Record<ToolTipPlacement, number>;
}): ToolTipPlacement {
  const { placement, responsive, tooltipRect, directionalRoom } = args;

  const hasDirectionalRoom = (candidate: ToolTipPlacement) => {
    if (candidate === "top" || candidate === "bottom") {
      return directionalRoom[candidate] >= tooltipRect.height;
    }

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

function getTooltipPosition(args: {
  wrapperRect: DOMRect;
  tooltipRect: DOMRect;
  placement: ToolTipPlacement;
  align: ToolTipAlign;
  offset: number;
}): Pick<React.CSSProperties, "top" | "left"> {
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

function renderTooltipContent(content: React.ReactNode, error: boolean) {
  if (typeof content === "string" || typeof content === "number") {
    return (
      <MainTextTypography
        variant="body"
        weight="bold"
        className={error ? styles.errorText : undefined}
      >
        {content}
      </MainTextTypography>
    );
  }

  return content;
}
