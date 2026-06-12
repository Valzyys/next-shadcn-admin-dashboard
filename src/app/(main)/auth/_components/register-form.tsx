"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface GatewayUser {
  id: string | number;
  name: string;
  email: string;
  phone: string | null;
  avatar_url?: string | null;
}

interface RegisterResponse {
  status: boolean;
  message: string;
  data?: {
    user: GatewayUser;
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
  error?: string;
}

async function registerUser(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await fetch(`${GATEWAY_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: RegisterResponse = await res.json();
  return data;
}

function saveAuthTokens(accessToken: string, refreshToken: string) {
  // Store in localStorage — swap to httpOnly cookies if you have a server-side
  // session handler, since this is client-side only for now.
  localStorage.setItem("access_token", accessToken);
  localStorage.setItem("refresh_token", refreshToken);
}

export function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<typeof form>>({});

  function validate() {
    const errs: Partial<typeof form> = {};
    if (!form.name.trim()) errs.name = "Nama wajib diisi";
    if (!form.email.trim()) errs.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Format email tidak valid";
    if (!form.password) errs.password = "Password wajib diisi";
    else if (form.password.length < 8) errs.password = "Password minimal 8 karakter";
    if (!form.confirmPassword) errs.confirmPassword = "Konfirmasi password wajib diisi";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Password tidak cocok";
    return errs;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear inline error on change
    if (fieldErrors[name as keyof typeof form]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setIsLoading(true);
    try {
      const payload: RegisterPayload = {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password,
        ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
      };

      const result = await registerUser(payload);

      if (!result.status) {
        setError(result.message || "Registrasi gagal. Coba lagi.");
        return;
      }

      if (result.data) {
        saveAuthTokens(result.data.access_token, result.data.refresh_token);
      }

      // Redirect after successful register — adjust path as needed
      router.push("/dashboard");
    } catch (err) {
      setError("Terjadi kesalahan jaringan. Periksa koneksi Anda.");
      console.error("[RegisterForm]", err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {/* Global error */}
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium leading-none">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={form.name}
          onChange={handleChange}
          disabled={isLoading}
          className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
            fieldErrors.name ? "border-destructive" : "border-input"
          }`}
        />
        {fieldErrors.name && (
          <p className="text-destructive text-xs">{fieldErrors.name}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium leading-none">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          disabled={isLoading}
          className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
            fieldErrors.email ? "border-destructive" : "border-input"
          }`}
        />
        {fieldErrors.email && (
          <p className="text-destructive text-xs">{fieldErrors.email}</p>
        )}
      </div>

      {/* Phone (optional) */}
      <div className="space-y-1.5">
        <label htmlFor="phone" className="text-sm font-medium leading-none">
          Phone{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+62 812 3456 7890"
          value={form.phone}
          onChange={handleChange}
          disabled={isLoading}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium leading-none">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={handleChange}
            disabled={isLoading}
            className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
              fieldErrors.password ? "border-destructive" : "border-input"
            }`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-destructive text-xs">{fieldErrors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <label htmlFor="confirmPassword" className="text-sm font-medium leading-none">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 pr-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
              fieldErrors.confirmPassword ? "border-destructive" : "border-input"
            }`}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {fieldErrors.confirmPassword && (
          <p className="text-destructive text-xs">{fieldErrors.confirmPassword}</p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm font-medium shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {isLoading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
