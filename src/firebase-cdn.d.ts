declare module "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js" {
  export function getApps(): unknown[];
  export function initializeApp(config: Record<string, string>): unknown;
}

declare module "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js" {
  export interface User {
    displayName: string | null;
    getIdToken(forceRefresh?: boolean): Promise<string>;
  }
  export interface Auth {}
  export function getAuth(app?: unknown): Auth;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<{ user: User }>;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<{ user: User }>;
  export function updateProfile(user: User, profile: { displayName?: string }): Promise<void>;
  export function signOut(auth: Auth): Promise<void>;
  export function onAuthStateChanged(auth: Auth, callback: (user: User | null) => void): () => void;
}
