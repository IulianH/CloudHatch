import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const uploadsDir = "/shared/uploads";
const scriptPath = path.resolve(
  process.cwd(),
  "src",
  "scripts",
  "HighlightParcel.py"
);

type HighlightParcelResult = {
  outputFilename: string;
  outputPath: string;
  stdout?: string;
  stdoutJson?: unknown;
};

export class FindParcelService {
  static async highlightParcel(
    filename: string,
    x: number,
    y: number
  ): Promise<HighlightParcelResult> {
    const inputPath = path.join(uploadsDir, filename);

    await fs.access(inputPath);
    await fs.access(scriptPath);

    const outputFilename = `highlight-${Date.now()}-${filename}`;
    const outputPath = path.join(uploadsDir, outputFilename);
    const args = [
      scriptPath,
      inputPath,
      outputPath,
      "--point",
      String(x),
      String(y),
    ];

    const { stdout } = await new Promise<{ stdout: string }>((resolve, reject) => {
      execFile(
        "python",
        args,
        { timeout: 60_000, windowsHide: true },
        (error, out, err) => {
          if (error) {
            reject(new Error(err || error.message));
            return;
          }
          resolve({ stdout: out?.toString() ?? "" });
        }
      );
    });

    const trimmed = stdout.trim();
    let stdoutJson: unknown = undefined;
    if (trimmed) {
      try {
        stdoutJson = JSON.parse(trimmed);
      } catch {
        stdoutJson = undefined;
      }
    }

    return {
      outputFilename,
      outputPath,
      stdout: trimmed || undefined,
      stdoutJson,
    };
  }
}