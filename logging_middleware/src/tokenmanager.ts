import axios from "axios";
import { LoggerConfig, AuthTokenResponse } from "./types";

const BASE_URL = "http://20.207.122.201/evaluation-service";

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function fetchFreshToken(config: LoggerConfig): Promise<string> {
  const response = await axios.post<AuthTokenResponse>(
    `${BASE_URL}/auth`,
    {
      email: config.email,
      name: config.name,
      rollNo: config.rollNo,
      accessCode: config.accessCode,
      clientID: config.clientID,
      clientSecret: config.clientSecret,
    }
  );

  cachedToken = response.data.access_token;
  tokenExpiresAt = response.data.expires_in;

  return cachedToken;
}

export async function getValidToken(config: LoggerConfig): Promise<string> {
  const nowInSeconds = Math.floor(Date.now() / 1000);
  const bufferSeconds = 60;

  const tokenIsStillValid = cachedToken && (tokenExpiresAt - bufferSeconds > nowInSeconds);

  if (tokenIsStillValid) {
    return cachedToken!;
  }

  return fetchFreshToken(config);
}