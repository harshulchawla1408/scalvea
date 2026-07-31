import { supabase } from "@/integrations/supabase/client";
import type { SignInWithPasswordCredentials, SignUpWithPasswordCredentials, SignInWithOAuthCredentials } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

class AuthManager {
  private static instance: AuthManager;
  private deviceIdKey = "scalvea_device_id";

  private constructor() {}

  public static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  /**
   * Generates or retrieves a persistent device identifier.
   */
  private getDeviceId(): string {
    let deviceId = localStorage.getItem(this.deviceIdKey);
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem(this.deviceIdKey, deviceId);
    }
    return deviceId;
  }

  /**
   * Registers the device as trusted on the backend upon session restore or login.
   */
  public async registerTrustedDevice() {
    try {
      const deviceId = this.getDeviceId();
      const userAgent = navigator.userAgent;
      
      // Simple OS/Browser detection
      let os = "Unknown";
      if (userAgent.indexOf("Win") !== -1) os = "Windows";
      else if (userAgent.indexOf("Mac") !== -1) os = "MacOS";
      else if (userAgent.indexOf("Linux") !== -1) os = "Linux";
      else if (userAgent.indexOf("Android") !== -1) os = "Android";
      else if (userAgent.indexOf("like Mac") !== -1) os = "iOS";

      let browser = "Unknown";
      if (userAgent.indexOf("Chrome") !== -1) browser = "Chrome";
      else if (userAgent.indexOf("Safari") !== -1) browser = "Safari";
      else if (userAgent.indexOf("Firefox") !== -1) browser = "Firefox";

      await supabase.rpc("register_trusted_device", {
        p_device_id: deviceId,
        p_browser: browser,
        p_os: os,
      });
    } catch (err) {
      console.warn("Failed to register trusted device footprint:", err);
    }
  }

  // ── Authentication Provider Abstractions ──────────────────────────────────

  public async signInWithPassword(credentials: SignInWithPasswordCredentials) {
    const response = await supabase.auth.signInWithPassword(credentials);
    if (response.data.session) {
      await this.registerTrustedDevice();
    }
    return response;
  }

  public async signUp(credentials: SignUpWithPasswordCredentials) {
    const response = await supabase.auth.signUp(credentials);
    if (response.data.session) {
      await this.registerTrustedDevice();
    }
    return response;
  }

  public async signInWithOAuth(credentials: SignInWithOAuthCredentials) {
    // Note: OAuth redirects. The trusted device registration will happen
    // in the AuthContext when the session is restored on the callback.
    return await supabase.auth.signInWithOAuth(credentials);
  }

  public async resetPasswordForEmail(email: string, options?: { redirectTo?: string }) {
    return await supabase.auth.resetPasswordForEmail(email, options);
  }

  public async updateUser(attributes: any) {
    return await supabase.auth.updateUser(attributes);
  }

  public async signOut() {
    return await supabase.auth.signOut();
  }

  public getSession() {
    return supabase.auth.getSession();
  }

  public onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authManager = AuthManager.getInstance();
