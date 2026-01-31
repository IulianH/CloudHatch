type ConfirmStepProps = {
  filename: string | null;
  coords: { x: number; y: number } | null;
  onBack: () => void;
  onConfirm: () => void;
};

export const ConfirmStep = ({
  filename,
  coords,
  onBack,
  onConfirm,
}: ConfirmStepProps) => (
  <>
    {filename && coords ? (
      <div className="space-y-2 text-sm text-gray-700">
        <p>Ready to submit the parcel selection?</p>
        <p className="font-medium">
          File: <span className="font-normal">{filename}</span>
        </p>
        <p className="font-medium">
          Coordinates:{" "}
          <span className="font-normal">
            ({coords.x}, {coords.y})
          </span>
        </p>
      </div>
    ) : (
      <p className="text-sm text-red-600">
        Missing parcel selection. Please go back and select a location.
      </p>
    )}
    <div className="mt-4 flex items-center justify-center gap-3">
      <button
        type="button"
        className="rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700"
        onClick={onBack}
      >
        Back
      </button>
      <button
        type="button"
        className="rounded bg-green-600 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!filename || !coords}
        onClick={onConfirm}
      >
        Confirm
      </button>
    </div>
  </>
);
