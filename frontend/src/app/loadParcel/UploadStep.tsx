import type { FormEvent } from "react";

export type UploadStatus = "idle" | "uploading" | "success" | "error";

type UploadStepProps = {
  status: UploadStatus;
  message: string;
  canProceed: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onNext: () => void;
};

export const UploadStep = ({
  status,
  message,
  canProceed,
  onSubmit,
  onNext,
}: UploadStepProps) => (
  <>
    <form className="flex flex-col items-center gap-4" onSubmit={onSubmit}>
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
          status === "error" ? "text-sm text-red-600" : "text-sm text-green-700"
        }
      >
        {message}
      </p>
    )}
    <button
      type="button"
      className="rounded border border-blue-600 px-5 py-2 text-sm font-semibold text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={!canProceed}
      onClick={onNext}
    >
      Next - Select parcel
    </button>
  </>
);
