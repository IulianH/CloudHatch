"use client";

import { useEffect, useState } from "react";

import { CompleteStep } from "./CompleteStep";
import { SelectStep } from "./SelectStep";
import { UploadStep, type UploadStatus } from "./UploadStep";

type Step = "upload" | "preview" | "confirm";
export default function LoadParcelPage() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedFile]);

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setCoords(null);
    setPoints([]);

    if (!file) {
      setStatus("idle");
      setMessage("");
      return;
    }

    setStatus("success");
    setMessage(`Selected file: ${file.name}`);
  };

  const canProceed = Boolean(selectedFile);

  const handleCoordsChange = (nextCoords: { x: number; y: number } | null) => {
    setCoords(nextCoords);
  };

  const handlePointsChange = (nextPoints: Array<{ x: number; y: number }>) => {
    setPoints(nextPoints);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full space-y-6 text-center">
        {step === "upload" && (
          <UploadStep
            status={status}
            message={message}
            canProceed={canProceed}
            onFileChange={handleFileChange}
            onNext={() => setStep("preview")}
          />
        )}
        {step === "preview" && (
          <SelectStep
            filename={selectedFile?.name ?? null}
            previewUrl={previewUrl}
            coords={coords}
            points={points}
            onCoordsChange={handleCoordsChange}
            onPointsChange={handlePointsChange}
            onBack={() => {
              setStep("upload");
              setSelectedFile(null);
              setStatus("idle");
              setMessage("");
            }}
            onNext={() => setStep("confirm")}
          />
        )}
        {step === "confirm" && <CompleteStep points={points} previewUrl={previewUrl} />}
      </div>
    </div>
  );
}
