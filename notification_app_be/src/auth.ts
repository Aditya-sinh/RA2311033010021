import axios from "axios";

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

export async function getToken(): Promise<string> {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (cachedToken && tokenExpiresAt - 60 > nowInSeconds) {
    return cachedToken;
  }

  const response = await axios.post("http://20.207.122.201/evaluation-service/auth", {
    email: process.env.EMAIL,
    name: process.env.NAME,
    rollNo: process.env.ROLL_NO,
    accessCode: process.env.ACCESS_CODE,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  cachedToken = response.data.access_token;
  tokenExpiresAt = response.data.expires_in;

  return cachedToken!;
}