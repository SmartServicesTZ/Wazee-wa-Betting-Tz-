import { getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCMWh-yKE13mQ-SRA3lDugpHXV1kuVMBK8",
  authDomain: "wazee-wa-betting-tz-e7183.firebaseapp.com",
  projectId: "wazee-wa-betting-tz-e7183",
  messagingSenderId: "790161817035",
  appId: "1:790161817035:web:f217cebf1fca1dcb240a4e",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const API_BASE = "https://wazee-wa-betting-tz.stewardjackson999.workers.dev";

export function phoneToEmail(value: string): string {
  const digits = value.replace(/\D/g, "");
  let normalized = digits;
  if (digits.startsWith("255") && digits.length === 12) normalized = digits;
  else if (digits.startsWith("0") && digits.length === 10) normalized = "255" + digits.slice(1);
  else if (digits.length === 9) normalized = "255" + digits;
  else throw new Error("Weka namba sahihi ya Tanzania, mfano 0712345678.");
  return normalized + "@phone.wazee-wa-betting-tz.com";
}

export async function registerWithPhone(phone: string, password: string, firstName: string, lastName: string) {
  const email = phoneToEmail(phone);
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: firstName.trim() + " " + lastName.trim() });
  await credential.user.getIdToken(true);
  return credential.user;
}

export async function loginWithPhone(phone: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, phoneToEmail(phone), password);
  return credential.user;
}

export async function logout() {
  await signOut(auth);
}

export function watchAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function apiRequest<T>(path: string, user?: User | null, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (user) headers.set("Authorization", "Bearer " + await user.getIdToken());
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(API_BASE + path, { ...init, headers });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) {
    const messages: Record<string, string> = {
      authentication_required: "Ingia kwanza.",
      invalid_authentication: "Kikao chako kimeisha. Ingia tena.",
      seller_application_already_exists: "Tayari una ombi la seller.",
      seller_approval_required: "Subiri Admin aidhinishe akaunti yako ya seller.",
      admin_required: "Huna ruhusa ya kufungua sehemu hii.",
    };
    throw new Error((data as { error?: string }).error ? messages[(data as { error: string }).error] || (data as { error: string }).error : "Ombi halikukamilika.");
  }
  return data;
}
