import { readFileSync } from "fs";
import path from "path";

export function getServiceAccountCredentials(): Record<string, unknown> {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (jsonEnv) {
    return JSON.parse(jsonEnv) as Record<string, unknown>;
  }

  const filePath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ??
    path.join(/* turbopackIgnore: true */ process.cwd(), "firebase-service-account.json");

  const contents = readFileSync(filePath, "utf8");
  return JSON.parse(contents) as Record<string, unknown>;
}
