import axios from "axios";

// Point this at your FastAPI server -- your machine's LAN IP when testing on
// a physical device via Expo Go, since "localhost" resolves to the phone itself.
const BASE_URL = "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export async function registerUser(payload: {
  email: string;
  password: string;
  weight_kg: number;
  height_cm: number;
  age: number;
  sex: string;
  activity_level: string;
  goal: string;
}) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function getUserTargets(userId: string) {
  const { data } = await api.get(`/users/${userId}/targets`);
  return data;
}

export async function lookupBarcode(code: string) {
  const { data } = await api.get(`/food/barcode/${code}`);
  return data;
}

export async function recognizeMealPhoto(photoUri: string) {
  const formData = new FormData();
  formData.append("photo", {
    uri: photoUri,
    name: "meal.jpg",
    type: "image/jpeg",
  } as any);
  const { data } = await api.post("/food/recognize", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function logFood(
  userId: string,
  payload: { food_item_id: string; grams: number; source: string }
) {
  const { data } = await api.post(`/food/log/${userId}`, payload);
  return data;
}

export async function getCurrentPlan(userId: string) {
  const { data } = await api.get(`/plans/${userId}/current`);
  return data;
}

export async function getDailyScore(userId: string, date: string) {
  const { data } = await api.get(`/scores/${userId}/${date}`);
  return data;
}
