"use client";

import { useEffect, useState } from "react";

import { ConfirmStep } from "./ConfirmStep";
import { SelectStep } from "./SelectStep";
import { UploadStep, type UploadStatus } from "./UploadStep";

type Step = "upload" | "preview" | "confirm";
type ProcessResult = {
  outputFilename?: string;
  outputUrl?: string;
  error?: string;
};

export default function LoadParcelPage() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [step, setStep] = useState<Step>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);
  const [points, setPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processError, setProcessError] = useState<string>("");

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
    setProcessResult(null);
    setProcessError("");
    setIsProcessing(false);

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
    setProcessError("");
  };

  const handlePointsChange = (nextPoints: Array<{ x: number; y: number }>) => {
    setPoints(nextPoints);
    setProcessError("");
  };

  const handleProcess = async () => {
    if (!selectedFile || !coords) {
      return;
    }

    try {
      setIsProcessing(true);
      setProcessError("");
      const response = await fetch("/api/backapi/loadParcel/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: selectedFile.name,
          x: coords.x,
          y: coords.y,
        }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setProcessError(payload?.error ?? "Unable to process the parcel.");
        return;
      }

      setProcessResult(payload ?? null);
      setStep("confirm");
    } catch (error) {
      console.error("Confirm submission failed", error);
      setProcessError("Unable to process the parcel.");
    } finally {
      setIsProcessing(false);
    }
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
            onNext={handleProcess}
            isProcessing={isProcessing}
            processError={processError}
          />
        )}
        {step === "confirm" && (
          <ConfirmStep
            processResult={processResult}
            onBack={() => setStep("preview")}
          />
        )}
      </div>
    </div>
  );
}
