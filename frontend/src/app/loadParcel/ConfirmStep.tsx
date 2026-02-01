type ConfirmStepProps = {
  processResult: {
    outputFilename?: string;
  } | null;
  onBack: () => void;
};

export const ConfirmStep = ({
  processResult,
  onBack,
}: ConfirmStepProps) => {
  const outputFilename = processResult?.outputFilename;
  const outputUrl = outputFilename
    ? `/api/backapi/loadParcel/uploads/${encodeURIComponent(outputFilename)}`
    : "";

  return (
    <>
      {outputFilename ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Parcel highlight result:
          </p>
          <img
            src={outputUrl}
            alt="Highlighted parcel result"
            className="block max-w-full h-auto rounded border border-gray-200"
          />
        </div>
      ) : (
        <p className="text-sm text-red-600">Parcel could not be found.</p>
      )}
      <div className="mt-4 flex items-center justify-center">
        <button
          type="button"
          className="rounded border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700"
          onClick={onBack}
        >
          Back
        </button>
      </div>
    </>
  );
};
