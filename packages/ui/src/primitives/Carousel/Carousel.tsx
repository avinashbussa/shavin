"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type HTMLAttributes,
  type ButtonHTMLAttributes,
} from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const carouselVariants = cva("relative w-full", {
  variants: {
    variant: {
      slider: "overflow-hidden",
      cards: "overflow-hidden",
    },
  },
  defaultVariants: {
    variant: "cards",
  },
});

export type ContainerSize = "xs" | "sm" | "md" | "lg" | "xl" | "full" | "none";

interface CarouselContextValue {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  variant: "slider" | "cards";
  alignToContainer: ContainerSize;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  activeIndex: number;
  totalItems: number;
  setTotalItems: (count: number) => void;
  scrollToIndex: (index: number) => void;
}

const CarouselContext = createContext<CarouselContextValue | null>(null);

export function useCarousel() {
  const context = useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel> primitive.");
  }
  return context;
}

export interface CarouselProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof carouselVariants> {
  /** Alignment of track start/end to a standard Shavin container size. Default "none". */
  alignToContainer?: ContainerSize;
  /** Whether to render subtle gradient edge fade overlays on the track boundaries. Default false. */
  fadeEdges?: boolean;
  /** Custom scroll step in pixels for cards variant. Default 340. */
  scrollStep?: number;
  /** Auto-scroll interval in ms (slider mode only). Default disabled. */
  autoPlayInterval?: number;
  /** Callback fired when active slide index changes. */
  onSlideChange?: (index: number) => void;
}

export function Carousel({
  variant = "cards",
  alignToContainer = "none",
  fadeEdges = false,
  scrollStep = 340,
  autoPlayInterval,
  onSlideChange,
  className,
  children,
  ...props
}: CarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const checkScrollability = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollPrev(scrollLeft > 4);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 4);

    if (variant === "slider" && clientWidth > 0) {
      const idx = Math.round(scrollLeft / clientWidth);
      setActiveIndex(idx);
      onSlideChange?.(idx);
    }
  }, [variant, onSlideChange]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollability();
    el.addEventListener("scroll", checkScrollability, { passive: true });
    window.addEventListener("resize", checkScrollability);

    return () => {
      el.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [checkScrollability]);

  // Autoplay support for slider variant
  useEffect(() => {
    if (variant !== "slider" || !autoPlayInterval || totalItems <= 1) return;
    const interval = setInterval(() => {
      if (!scrollContainerRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      if (scrollLeft >= scrollWidth - clientWidth - 4) {
        scrollContainerRef.current.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollContainerRef.current.scrollBy({ left: clientWidth, behavior: "smooth" });
      }
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [variant, autoPlayInterval, totalItems]);

  const scrollPrev = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = variant === "slider" ? el.clientWidth : scrollStep;
    el.scrollBy({ left: -amount, behavior: "smooth" });
  }, [variant, scrollStep]);

  const scrollNext = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const amount = variant === "slider" ? el.clientWidth : scrollStep;
    el.scrollBy({ left: amount, behavior: "smooth" });
  }, [variant, scrollStep]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollContainerRef.current;
      if (!el) return;
      const amount = variant === "slider" ? el.clientWidth * index : scrollStep * index;
      el.scrollTo({ left: amount, behavior: "smooth" });
    },
    [variant, scrollStep]
  );

  return (
    <CarouselContext.Provider
      value={{
        scrollContainerRef,
        variant: variant || "cards",
        alignToContainer,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        activeIndex,
        totalItems,
        setTotalItems,
        scrollToIndex,
      }}
    >
      <div
        role="region"
        aria-roledescription="carousel"
        className={cn(carouselVariants({ variant }), className)}
        {...props}
      >
        {fadeEdges && (
          <>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 md:w-20 bg-gradient-to-r from-canvas to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 md:w-20 bg-gradient-to-l from-canvas to-transparent"
            />
          </>
        )}
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

/* ── Container Gutter Sizing Map ── */
const CONTAINER_MAX_WIDTHS: Record<string, string> = {
  xs: "28rem",
  sm: "42rem",
  md: "56rem",
  lg: "72rem",
  xl: "90rem",
};

export interface CarouselTrackProps extends HTMLAttributes<HTMLDivElement> {
  /** Gap between items. Default "5" (1.25rem). */
  gap?: "2" | "3" | "4" | "5" | "6" | "8";
}

export function CarouselTrack({
  gap = "5",
  className,
  children,
  ...props
}: CarouselTrackProps) {
  const { scrollContainerRef, variant, alignToContainer } = useCarousel();

  const gapClass = {
    "2": "gap-2",
    "3": "gap-3",
    "4": "gap-4",
    "5": "gap-5",
    "6": "gap-6",
    "8": "gap-8",
  }[gap];

  const gapMarginClass = {
    "2": "-mr-2",
    "3": "-mr-3",
    "4": "-mr-4",
    "5": "-mr-5",
    "6": "-mr-6",
    "8": "-mr-8",
  }[gap];

  const gapMarginTrailingClass = {
    "2": "-ml-2",
    "3": "-ml-3",
    "4": "-ml-4",
    "5": "-ml-5",
    "6": "-ml-6",
    "8": "-ml-8",
  }[gap];

  const maxW = CONTAINER_MAX_WIDTHS[alignToContainer] || "72rem";
  const hasGutter = alignToContainer !== "none" && alignToContainer !== "full";

  return (
    <div
      ref={scrollContainerRef}
      tabIndex={0}
      className={cn(
        "flex w-full overflow-x-auto pb-4 pt-1 no-scrollbar scroll-smooth motion-reduce:scroll-auto",
        variant === "slider" && "snap-x snap-mandatory",
        gapClass,
        className
      )}
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      {...props}
    >
      {/* Leading gutter spacer to align first item with Container boundary */}
      {hasGutter && (
        <div
          aria-hidden="true"
          className={cn(
            "shrink-0 pointer-events-none",
            gapMarginClass
          )}
          style={{
            width: `max(1.5rem, calc((100vw - ${maxW}) / 2 + 1.5rem))`,
          }}
        />
      )}

      {children}

      {/* Trailing gutter spacer so last item scrolls cleanly to right Container edge */}
      {hasGutter && (
        <div
          aria-hidden="true"
          className={cn(
            "shrink-0 pointer-events-none",
            gapMarginTrailingClass
          )}
          style={{
            width: `max(1.5rem, calc((100vw - ${maxW}) / 2 + 1.5rem))`,
          }}
        />
      )}
    </div>
  );
}

export interface CarouselItemProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional index for accessible numbering */
  index?: number;
}

export function CarouselItem({
  index,
  className,
  children,
  ...props
}: CarouselItemProps) {
  const { variant } = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={index !== undefined ? `Slide ${index + 1}` : undefined}
      className={cn(
        "shrink-0",
        variant === "slider" && "w-full snap-center",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface CarouselControlsProps extends HTMLAttributes<HTMLDivElement> {}

export function CarouselControls({
  className,
  children,
  ...props
}: CarouselControlsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)} {...props}>
      {children}
    </div>
  );
}

export interface CarouselButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function CarouselPrevious({
  className,
  ...props
}: CarouselButtonProps) {
  const { scrollPrev, canScrollPrev } = useCarousel();

  return (
    <button
      type="button"
      onClick={scrollPrev}
      disabled={!canScrollPrev}
      aria-label="Previous slide"
      className={cn(
        "w-9 h-9 flex items-center justify-center rounded-[var(--radius-lg)] border border-hairline bg-surface text-fg-subtle hover:text-fg hover:border-hairline-strong active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        className
      )}
      {...props}
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
  );
}

export function CarouselNext({
  className,
  ...props
}: CarouselButtonProps) {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <button
      type="button"
      onClick={scrollNext}
      disabled={!canScrollNext}
      aria-label="Next slide"
      className={cn(
        "w-9 h-9 flex items-center justify-center rounded-[var(--radius-lg)] border border-hairline bg-surface text-fg-subtle hover:text-fg hover:border-hairline-strong active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer",
        className
      )}
      {...props}
    >
      <ChevronRight className="w-4 h-4" />
    </button>
  );
}

export interface CarouselDotsProps extends HTMLAttributes<HTMLDivElement> {
  count: number;
}

export function CarouselDots({
  count,
  className,
  ...props
}: CarouselDotsProps) {
  const { activeIndex, scrollToIndex } = useCarousel();

  return (
    // Plain buttons, not tabs: there are no tab panels to control (WCAG 4.1.2).
    <div
      role="group"
      aria-label="Slides"
      className={cn("flex items-center justify-center pt-3", className)}
      {...props}
    >
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-current={activeIndex === i ? "true" : undefined}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => scrollToIndex(i)}
          // The dot is small; the button around it is a 28px target (WCAG 2.5.8).
          className="group flex h-7 min-w-7 items-center justify-center cursor-pointer"
        >
          <span
            aria-hidden="true"
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              activeIndex === i ? "w-6 bg-fg" : "w-1.5 bg-hairline-strong group-hover:bg-fg-muted"
            )}
          />
        </button>
      ))}
    </div>
  );
}

/* Compound component assignment */
Carousel.Track = CarouselTrack;
Carousel.Item = CarouselItem;
Carousel.Controls = CarouselControls;
Carousel.Previous = CarouselPrevious;
Carousel.Next = CarouselNext;
Carousel.Dots = CarouselDots;
