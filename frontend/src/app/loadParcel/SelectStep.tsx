"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";

type SelectStepProps = {
  filename: string | null;
  previewUrl: string;
  coords: { x: number; y: number } | null;
  points: Array<{ x: number; y: number }>;
  onCoordsChange: (coords: { x: number; y: number }) => void;
  onPointsChange: (points: Array<{ x: number; y: number }>) => void;
  onBack: () => void;
  onNext: () => void;
  isProcessing: boolean;
  processError: string;
};

export const SelectStep = ({
  filename,
  previewUrl,
  coords,
  points,
  onCoordsChange,
  onPointsChange,
  onBack,
  onNext,
  isProcessing,
  processError,
}: SelectStepProps) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef({
    isActive: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    const image = imageRef.current;
    if (!image) {
      return;
    }

    const updateSize = () => {
      setImageSize({
        width: image.clientWidth,
        height: image.clientHeight,
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(image);

    return () => observer.disconnect();
  }, [previewUrl]);

  useEffect(() => {
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Control") {
        setIsPanning(false);
        panStateRef.current.isActive = false;
      }
    };

    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleImageClick = (event: MouseEvent<HTMLImageElement>): void => {
    if (!event.ctrlKey || panStateRef.current.isActive) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    onCoordsChange({ x, y });
    onPointsChange([...points, { x, y }]);
  };

  const handlePanStart = (event: MouseEvent<HTMLDivElement>): void => {
    if (event.ctrlKey) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    panStateRef.current = {
      isActive: true,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
    setIsPanning(true);
    event.preventDefault();
  };

  const handlePanMove = (event: MouseEvent<HTMLDivElement>): void => {
    if (!panStateRef.current.isActive) {
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const deltaX = event.clientX - panStateRef.current.startX;
    const deltaY = event.clientY - panStateRef.current.startY;
    container.scrollLeft = panStateRef.current.scrollLeft - deltaX;
    container.scrollTop = panStateRef.current.scrollTop - deltaY;
    event.preventDefault();
  };

  const handlePanEnd = (): void => {
    if (panStateRef.current.isActive) {
      panStateRef.current.isActive = false;
      setIsPanning(false);
    }
  };

  return (
    <>
      {filename ? (
        <>
         <p className="text-gray-600">
          Click si drag pentru a paniza imaginea.
          </p>
          <p className="text-gray-600">
          Ctr + click si drag pentru a trasa o linie.
          </p>
        
          <div
            ref={scrollContainerRef}
            className={`max-h-[70vh] max-w-full overflow-auto rounded border border-gray-200 p-2 ${
              isPanning ? "cursor-move" : ""
            }`}
            onMouseDown={handlePanStart}
            onMouseMove={handlePanMove}
            onMouseUp={handlePanEnd}
            onMouseLeave={handlePanEnd}
          >
            <div className="relative inline-block">
              <img
                ref={imageRef}
                src={previewUrl}
                alt="Uploaded parcel"
                className="block max-w-none h-auto rounded border border-gray-200"
                onClick={handleImageClick}
                onLoad={() => {
                  const image = imageRef.current;
                  if (image) {
                    setImageSize({
                      width: image.clientWidth,
                      height: image.clientHeight,
                    });
                  }
                }}
              />
              {imageSize.width > 0 && imageSize.height > 0 ? (
                <svg
                  className="pointer-events-none absolute left-0 top-0"
                  width={imageSize.width}
                  height={imageSize.height}
                  viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
                >
                  {points.length === 1 ? (
                    <circle
                      cx={points[0].x}
                      cy={points[0].y}
                      r={4}
                      fill="#ef4444"
                    />
                  ) : null}
                  {points.slice(1).map((point, index) => {
                    const previous = points[index];
                    return (
                      <line
                        key={`${previous.x}-${previous.y}-${point.x}-${point.y}`}
                        x1={previous.x}
                        y1={previous.y}
                        x2={point.x}
                        y2={point.y}
                        stroke="#ef4444"
                        strokeWidth={3}
                      />
                    );
                  })}
                </svg>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <p className="text-sm text-red-600">
          Missing upload filename. Please go back and upload again.
        </p>
      )}
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          className="rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700"
          onClick={onBack}
          disabled={isProcessing}
        >
          Back
        </button>
        <button
          type="button"
          className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!coords || isProcessing}
          onClick={onNext}
        >
          Next - Confirm
        </button>
        {isProcessing ? (
          <span className="text-sm text-gray-500">Loading…</span>
        ) : null}
      </div>
      {processError ? (
        <p className="mt-3 text-sm text-red-600">{processError}</p>
      ) : null}
    </>
  );
};
