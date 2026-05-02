import axios from "axios";

export async function getToken(): Promise<string> {
  const response = await axios.post("http://20.207.122.201/evaluation-service/auth", {
    email: process.env.EMAIL,
    name: process.env.NAME,
    rollNo: process.env.ROLL_NO,
    accessCode: process.env.ACCESS_CODE,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });
  return response.data.access_token;
}