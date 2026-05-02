import axios from "axios";

const registrationData = {
  email: "ac6178@srmist.edu.in",
  name: "Chudasama Adiyasinh",
  mobileNo: "7016704830",
  githubUsername: "Aditya-sinh",
  rollNo: "RA2311033010021",
  accessCode: "QkbpxH"
};

async function register() {
  try {
    const response = await axios.post(
      "http://20.207.122.201/evaluation-service/register",
      registrationData
    );
    console.log("Registration successful!");
    console.log("clientID:", response.data.clientID);
    console.log("clientSecret:", response.data.clientSecret);
    console.log("\nSave these — you cannot retrieve them again.");
  } catch (err: any) {
    console.error("Registration failed:", err.response?.data || err.message);
  }
}

register();