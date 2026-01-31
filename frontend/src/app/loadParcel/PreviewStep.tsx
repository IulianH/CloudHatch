"use client";

import { type MouseEvent } from "react";

type PreviewStepProps = {
  filename: string | null;
  previewUrl: string;
  coords: { x: number; y: number } | null;
  onCoordsChange: (coords: { x: number; y: number }) => void;
  onBack: () => void;
  onNext: () => void;
};

export const PreviewStep = ({
  filename,
  previewUrl,
  coords,
  onCoordsChange,
  onBack,
  onNext,
}: PreviewStepProps) => {
  const handleImageClick = (event: MouseEvent<HTMLImageElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(event.clientX - rect.left);
    const y = Math.round(event.clientY - rect.top);
    onCoordsChange({ x, y });
  };

  return (
    <>
      {filename ? (
        <>
          <p className="text-sm text-gray-600">
            {coords
              ? `Coordinates: (${coords.x}, ${coords.y})`
              : "Click the image to get coordinates."}
          </p>
          <div className="overflow-auto p-0">
            <img
              src={previewUrl}
              alt="Uploaded parcel"
              className="block max-w-none h-auto rounded border border-gray-200"
              onClick={handleImageClick}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-red-600">
          Missing upload filename. Please go back and upload again.
        </p>
      )}
      <button
        type="button"
        className="mt-4 rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700"
        onClick={onBack}
      >
        Back
      </button>
      <button
        type="button"
        className="ml-3 mt-4 rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!coords}
        onClick={onNext}
      >
        Next - Confirm
      </button>
    </>
  );
};
