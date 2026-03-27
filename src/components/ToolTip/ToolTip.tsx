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
import type { ToolTipAlign, ToolTipPlacement } from "@/lib/tooltip";
import {
  getDirectionalRoom,
  getTooltipPosition,
  hasTooltipContent,
  renderTooltipContent,
  resolveToolTipPlacement,
} from "@/lib/tooltip";
import styles from "./ToolTip.module.scss";
export type { ToolTipAlign, ToolTipPlacement } from "@/lib/tooltip";

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
    const nextPlacement = resolveToolTipPlacement({
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
            {renderTooltipContent({
              content,
              error,
              errorClassName: styles.errorText,
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
