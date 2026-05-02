import axios from "axios";
import { Depot, Vehicle } from "./types";

const BASE_URL = "http://20.207.122.201/evaluation-service";

export async function fetchDepots(token: string): Promise<Depot[]> {
  const response = await axios.get<{ depots: Depot[] }>(`${BASE_URL}/depots`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.depots;
}

export async function fetchVehicles(token: string): Promise<Vehicle[]> {
  const response = await axios.get<{ vehicles: Vehicle[] }>(`${BASE_URL}/vehicles`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data.vehicles;
}