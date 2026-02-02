"use client";

import { type ChangeEvent, useEffect, useMemo, useRef, useState } from "react";

type Point = { x: number; y: number };

type CompleteStepProps = {
  points: Point[];
  previewUrl: string;
};

const clampPotValue = (value: number) => Math.max(1, Math.min(100, value));

const getPolygonCentroid = (polygonPoints: Point[]) => {
  let areaSum = 0;
  let centroidX = 0;
  let centroidY = 0;

  for (let i = 0; i < polygonPoints.length; i += 1) {
    const nextIndex = (i + 1) % polygonPoints.length;
    const current = polygonPoints[i];
    const next = polygonPoints[nextIndex];
    const cross = current.x * next.y - next.x * current.y;
    areaSum += cross;
    centroidX += (current.x + next.x) * cross;
    centroidY += (current.y + next.y) * cross;
  }

  const area = areaSum / 2;
  if (area === 0) {
    const average = polygonPoints.reduce(
      (accumulator, point) => ({
        x: accumulator.x + point.x,
        y: accumulator.y + point.y,
      }),
      { x: 0, y: 0 }
    );
    return {
      x: average.x / polygonPoints.length,
      y: average.y / polygonPoints.length,
    };
  }

  return {
    x: centroidX / (6 * area),
    y: centroidY / (6 * area),
  };
};

export const CompleteStep = ({ points, previewUrl }: CompleteStepProps) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [potValue, setPotValue] = useState("100");

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
      return;
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(image);

    return () => observer.disconnect();
  }, [previewUrl]);

  const polygonPoints = useMemo(() => {
    if (points.length === 0) {
      return [];
    }
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    if (firstPoint && lastPoint && firstPoint.x === lastPoint.x && firstPoint.y === lastPoint.y) {
      return points.slice(0, -1);
    }
    return points;
  }, [points]);

  const scaledPolygon = useMemo(() => {
    if (polygonPoints.length < 3) {
      return [];
    }
    const potNumber = Number(potValue);
    if (!Number.isFinite(potNumber)) {
      return [];
    }
    const scale = clampPotValue(potNumber) / 100;
    const centroid = getPolygonCentroid(polygonPoints);
    const scaled = polygonPoints.map((point: Point) => ({
      x: centroid.x + (point.x - centroid.x) * scale,
      y: centroid.y + (point.y - centroid.y) * scale,
    }));
    return [...scaled, scaled[0]];
  }, [polygonPoints, potValue]);

  const handlePotChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value;
    if (nextValue === "") {
      setPotValue("1");
      return;
    }

    const numericValue = Number(nextValue);
    if (Number.isNaN(numericValue)) {
      return;
    }

    const clampedValue = clampPotValue(numericValue);
    setPotValue(String(clampedValue));
  };

  const handleDownload = async () => {
    const image = imageRef.current;
    if (!image || scaledPolygon.length < 2) {
      return;
    }

    if (imageSize.width === 0 || imageSize.height === 0) {
      return;
    }

    if (image.complete === false) {
      try {
        await image.decode();
      } catch {
        return;
      }
    }

    const naturalWidth = image.naturalWidth || imageSize.width;
    const naturalHeight = image.naturalHeight || imageSize.height;
    const scaleX = naturalWidth / imageSize.width;
    const scaleY = naturalHeight / imageSize.height;

    const canvas = document.createElement("canvas");
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    context.drawImage(image, 0, 0, naturalWidth, naturalHeight);
    context.strokeStyle = "#ef4444";
    context.lineWidth = 3 * Math.max(scaleX, scaleY);

    context.beginPath();
    const start = scaledPolygon[0];
    context.moveTo(start.x * scaleX, start.y * scaleY);
    for (let i = 1; i < scaledPolygon.length; i += 1) {
      const point = scaledPolygon[i];
      context.lineTo(point.x * scaleX, point.y * scaleY);
    }
    context.stroke();

    const link = document.createElement("a");
    link.download = "parcel-polygon.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-4 text-center">
      <div className="flex flex-wrap items-end justify-center gap-4">
        <label className="flex flex-col items-start text-sm font-semibold text-gray-700">
          <span>POT</span>
          <input
            type="number"
            min={1}
            max={100}
            step={1}
            value={potValue}
            onChange={handlePotChange}
            className="mt-1 w-28 rounded border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          className="rounded border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={handleDownload}
          disabled={scaledPolygon.length < 2 || imageSize.width === 0}
        >
          Download
        </button>
      </div>

      <div className="max-h-[70vh] max-w-full overflow-auto rounded border border-gray-200 p-2">
        <div className="relative inline-block">
          <img
            ref={imageRef}
            src={previewUrl}
            alt="Uploaded parcel"
            className="block max-w-none h-auto rounded border border-gray-200"
          />
          {imageSize.width > 0 && imageSize.height > 0 && scaledPolygon.length > 1 ? (
            <svg
              className="pointer-events-none absolute left-0 top-0"
              width={imageSize.width}
              height={imageSize.height}
              viewBox={`0 0 ${imageSize.width} ${imageSize.height}`}
            >
              {scaledPolygon.slice(1).map((point: Point, index: number) => {
                const previous = scaledPolygon[index];
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
    </div>
  );
};
