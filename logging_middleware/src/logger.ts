import axios from "axios";
import { Stack, Level, Package, LoggerConfig, LogResponse } from "./types";
import { getValidToken } from "./tokenmanager";

const LOG_ENDPOINT = "http://20.207.122.201/evaluation-service/logs";

let activeConfig: LoggerConfig | null = null;

export function initLogger(config: LoggerConfig): void {
  activeConfig = config;
}

export async function Log(
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): Promise<LogResponse | null> {
  if (!activeConfig) {
    console.error("Call initLogger() before using Log()");
    return null;
  }

  try {
    const token = await getValidToken(activeConfig);

    const response = await axios.post<LogResponse>(
      LOG_ENDPOINT,
      { stack, level, package: pkg, message },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err: any) {
    console.error("Log failed:", err.response?.data || err.message);
    return null;
  }
}