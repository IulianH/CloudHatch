"use client";

import { useState, type FormEvent } from "react";

import { ConfirmStep } from "./ConfirmStep";
import { PreviewStep } from "./PreviewStep";
import { UploadStep, type UploadStatus } from "./UploadStep";

type Step = "upload" | "preview" | "confirm";

export default function LoadParcelPage() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [step, setStep] = useState<Step>("upload");
  const [filename, setFilename] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setStatus("error");
      setMessage("Please choose a file to upload.");
      return;
    }

    setStatus("uploading");
    setFilename(null);
    setCoords(null);

    try {
      const response = await fetch("/api/backapi/loadParcel/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setStatus("error");
        setMessage(payload?.error ?? "Upload failed. Please try again.");
        return;
      }

      setStatus("success");
      setFilename(payload?.filename ?? null);
      setMessage(
        payload?.filename
          ? `Upload complete: ${payload.filename}`
          : "Upload complete."
      );
      form.reset();
    } catch (error) {
      console.error("Upload failed", error);
      setStatus("error");
      setMessage("Upload failed. Please try again.");
    }
  };

  const canProceed = status === "success" && Boolean(filename);
  const previewUrl = filename
    ? `/api/backapi/loadParcel/uploads/${encodeURIComponent(filename)}`
    : "";

  const handleConfirm = async () => {
    if (!filename || !coords) {
      return;
    }

    try {
      await fetch("/api/backapi/loadParcel/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename,
          x: coords.x,
          y: coords.y,
        }),
      });
    } catch (error) {
      console.error("Confirm submission failed", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Load Parcel</h1>
        <p className="text-gray-600">
          Start a new parcel workflow here.
        </p>
        {step === "upload" && (
          <UploadStep
            status={status}
            message={message}
            canProceed={canProceed}
            onSubmit={handleSubmit}
            onNext={() => setStep("preview")}
          />
        )}
        {step === "preview" && (
          <PreviewStep
            filename={filename}
            previewUrl={previewUrl}
            coords={coords}
            onCoordsChange={setCoords}
            onBack={() => setStep("upload")}
            onNext={() => setStep("confirm")}
          />
        )}
        {step === "confirm" && (
          <ConfirmStep
            filename={filename}
            coords={coords}
            onBack={() => setStep("preview")}
            onConfirm={handleConfirm}
          />
        )}
      </div>
    </div>
  );
}
