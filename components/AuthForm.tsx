"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building,
  Calendar,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Shield,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import CustomInput from "./CustomInput";
import PlaidLink from "./PlaidLink";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { signIn, signUp } from "@/lib/actions/user.actions";
import { authFormSchema } from "@/lib/utils";

const AuthForm = ({ type }: { type: string }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const isSignIn = type === "sign-in";

  const formSchema = authFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      if (type === "sign-up") {
        const userData = {
          firstName: data.firstName!,
          lastName: data.lastName!,
          address1: data.address1!,
          city: data.city!,
          state: data.state!,
          postalCode: data.postalCode!,
          dateOfBirth: data.dateOfBirth!,
          ssn: data.ssn!,
          email: data.email,
          password: data.password,
        };
        const newUser = await signUp(userData);
        setUser(newUser);
      }
      if (type === "sign-in") {
        const response = await signIn({
          email: data.email,
          password: data.password,
        });
        if (response) router.push("/");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full max-w-[440px] flex flex-col gap-7">
      {/* Header */}
      <header className="flex flex-col gap-5">
        <Link href="/" className="cursor-pointer flex items-center gap-2 w-fit">
          <Image
            src="/icons/logo.svg"
            width={42}
            height={42}
            alt="M$F Banking logo"
            priority
          />
          <h1
            className="text-[20px] font-space-grotesk font-bold tracking-tight"
            style={{ color: "var(--text-strong)" }}
          >
            M<span style={{ color: "var(--accent)" }}>$</span>F Banking
          </h1>
        </Link>

        <div className="flex flex-col gap-1.5">
          <h2
            className="text-30 lg:text-36 font-semibold font-space-grotesk tracking-tight"
            style={{ color: "var(--text-strong)" }}
          >
            {user
              ? "Link your bank"
              : isSignIn
                ? "Welcome back"
                : "Create your account"}
          </h2>
          <p className="text-14" style={{ color: "var(--text-soft)" }}>
            {user
              ? "Connect a bank account to start using M$F Banking"
              : isSignIn
                ? "Sign in to continue managing your finances"
                : "Join thousands managing their money smarter"}
          </p>
        </div>
      </header>

      {user ? (
        <PlaidLink user={user} variant="primary" />
      ) : (
        <>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-5"
            >
              {!isSignIn && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <CustomInput
                      control={form.control}
                      name="firstName"
                      label="First name"
                      placeholder="Walid"
                      Icon={User}
                    />
                    <CustomInput
                      control={form.control}
                      name="lastName"
                      label="Last name"
                      placeholder="Doe"
                      Icon={User}
                    />
                  </div>
                  <CustomInput
                    control={form.control}
                    name="address1"
                    label="Address"
                    placeholder="123 Main Street"
                    Icon={MapPin}
                  />
                  <CustomInput
                    control={form.control}
                    name="city"
                    label="City"
                    placeholder="Toronto"
                    Icon={Building}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <CustomInput
                      control={form.control}
                      name="state"
                      label="State / Province"
                      placeholder="ON"
                      Icon={MapPin}
                    />
                    <CustomInput
                      control={form.control}
                      name="postalCode"
                      label="Postal code"
                      placeholder="M5V 3A8"
                      Icon={MapPin}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <CustomInput
                      control={form.control}
                      name="dateOfBirth"
                      label="Date of birth"
                      placeholder="YYYY-MM-DD"
                      Icon={Calendar}
                    />
                    <CustomInput
                      control={form.control}
                      name="ssn"
                      label="SSN / SIN"
                      placeholder="1234"
                      Icon={Shield}
                    />
                  </div>
                </>
              )}

              <CustomInput
                control={form.control}
                name="email"
                label="Email"
                placeholder="you@example.com"
                Icon={Mail}
                type="email"
              />

              <div className="flex flex-col gap-1.5">
                <CustomInput
                  control={form.control}
                  name="password"
                  label="Password"
                  placeholder="••••••••"
                  Icon={Lock}
                />
                {isSignIn && (
                  <Link
                    href="#"
                    className="text-12 font-semibold self-end transition-colors hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    Forgot password?
                  </Link>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 mt-2 rounded-xl text-14 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-70"
                style={{ background: "var(--hero-gradient)" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    {isSignIn ? "Signing in…" : "Creating account…"}
                  </>
                ) : isSignIn ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </Button>
            </form>
          </Form>

          <footer className="flex justify-center gap-1.5">
            <p className="text-14" style={{ color: "var(--text-soft)" }}>
              {isSignIn
                ? "Don't have an account?"
                : "Already have an account?"}
            </p>
            <Link
              href={isSignIn ? "/sign-up" : "/sign-in"}
              className="text-14 font-semibold transition-colors hover:underline"
              style={{ color: "var(--accent)" }}
            >
              {isSignIn ? "Sign up" : "Sign in"}
            </Link>
          </footer>
        </>
      )}
    </section>
  );
};

export default AuthForm;
