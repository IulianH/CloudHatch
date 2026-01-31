"use client";

import { useState } from "react";

type UploadStatus = "idle" | "uploading" | "success" | "error";
type Step = "upload" | "preview";

export default function LoadParcelPage() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const [step, setStep] = useState<Step>("upload");
  const [filename, setFilename] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Load Parcel</h1>
        <p className="text-gray-600">
          Start a new parcel workflow here.
        </p>
        {step === "upload" && (
          <>
            <form
              className="flex flex-col items-center gap-4"
              onSubmit={handleSubmit}
            >
              <input
                name="file"
                type="file"
                className="block w-full max-w-md rounded border border-gray-200 px-3 py-2 text-sm"
                disabled={status === "uploading"}
              />
              <button
                type="submit"
                className="rounded bg-blue-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={status === "uploading"}
              >
                {status === "uploading" ? "Uploading..." : "Upload Parcel File"}
              </button>
            </form>
            {message && (
              <p
                className={
                  status === "error"
                    ? "text-sm text-red-600"
                    : "text-sm text-green-700"
                }
              >
                {message}
              </p>
            )}
            <button
              type="button"
              className="rounded border border-blue-600 px-5 py-2 text-sm font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!canProceed}
              onClick={() => setStep("preview")}
            >
              Next - Select parcel
            </button>
          </>
        )}
        {step === "preview" && (
          <div className="space-y-4">
            {filename ? (
              <img
                src={previewUrl}
                alt="Uploaded parcel"
                className="mx-auto max-h-[500px] w-auto rounded border border-gray-200"
              />
            ) : (
              <p className="text-sm text-red-600">
                Missing upload filename. Please go back and upload again.
              </p>
            )}
            <button
              type="button"
              className="rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700"
              onClick={() => setStep("upload")}
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
