"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const GATEWAY_BASE = "https://v5.jkt48connect.com/gateway";

const formSchema = z
  .object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email address." }),
    phone: z.string().optional(),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string().min(8, { message: "Confirm Password must be at least 8 characters." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

async function saveSession(access_token: string, refresh_token: string, expires_in: number, user: object) {
  const cookieRes = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token, refresh_token, expires_in, user, remember: false }),
  });
  return cookieRes.json();
}

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });

  const handleGoogleCallback = async (credential: string) => {
    setIsLoading(true);
    try {
      const gwRes = await fetch(`${GATEWAY_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: credential }),
      });
      const gwResult = await gwRes.json();

      if (!gwResult.status) {
        toast.error(gwResult.message || "Google login gagal.");
        return;
      }

      const { access_token, refresh_token, expires_in, user } = gwResult.data;
      const cookieResult = await saveSession(access_token, refresh_token, expires_in, user);

      if (!cookieResult.status) {
        toast.error("Gagal menyimpan sesi.");
        return;
      }

      toast.success("Akun berhasil dibuat dengan Google!");
      window.location.replace(cookieResult.data?.redirectUrl || "/dashboard");
    } catch {
      toast.error("Network error.");
    } finally {
      setIsLoading(false);
    }
  };

  const initGoogle = () => {
    window.google?.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: (response: { credential: string }) => {
        handleGoogleCallback(response.credential);
      },
    });

    // Listen event dari GoogleButton
    window.addEventListener("trigger-google-login", () => {
      window.google?.accounts.id.prompt();
    }, { once: false });
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${GATEWAY_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          password: data.password,
          ...(data.phone?.trim() ? { phone: data.phone.trim() } : {}),
        }),
      });

      const result = await res.json();

      if (!result.status) {
        if (result.message?.toLowerCase().includes("email")) {
          form.setError("email", { message: result.message });
        } else {
          toast.error(result.message || "Registration failed. Please try again.");
        }
        return;
      }

      const { access_token, refresh_token, expires_in, user } = result.data;
      const cookieResult = await saveSession(access_token, refresh_token, expires_in, user);

      if (!cookieResult.status) {
        toast.error("Gagal menyimpan sesi.");
        return;
      }

      toast.success("Account created successfully!");
      window.location.replace(cookieResult.data?.redirectUrl || "/dashboard");
    } catch {
      toast.error("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogle}
      />

      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FieldGroup className="gap-4">
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-name">Full Name</FieldLabel>
                <Input
                  {...field}
                  id="register-name"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-email">Email Address</FieldLabel>
                <Input
                  {...field}
                  id="register-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="phone"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-phone">
                  Phone{" "}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </FieldLabel>
                <Input
                  {...field}
                  id="register-phone"
                  type="tel"
                  placeholder="+62 812 3456 7890"
                  autoComplete="tel"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-password">Password</FieldLabel>
                <Input
                  {...field}
                  id="register-password"
                  type="password"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="register-confirm-password">Confirm Password</FieldLabel>
                <Input
                  {...field}
                  id="register-confirm-password"
                  type="password"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </FieldGroup>

        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
          {isLoading ? "Creating account..." : "Register"}
        </Button>
      </form>
    </>
  );
}
