"use client";

import { Eye, EyeOff, LucideIcon } from "lucide-react";
import { useState } from "react";
import { Control, FieldPath } from "react-hook-form";
import { z } from "zod";
import { authFormSchema } from "@/lib/utils";
import { FormControl, FormField, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";

const formSchema = authFormSchema("sign-up");

interface CustomInputProps {
  control: Control<z.infer<typeof formSchema>>;
  name: FieldPath<z.infer<typeof formSchema>>;
  label: string;
  placeholder: string;
  Icon?: LucideIcon;
  type?: "text" | "email" | "password" | "date";
}

const CustomInput = ({
  control,
  name,
  label,
  placeholder,
  Icon,
  type,
}: CustomInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = name === "password";
  const resolvedType =
    type ?? (isPassword ? (showPassword ? "text" : "password") : "text");

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col gap-1.5">
          <FormLabel
            className="text-13 font-medium"
            style={{ color: "var(--text-soft)" }}
          >
            {label}
          </FormLabel>
          <div className="flex w-full flex-col">
            <div className="relative">
              {Icon && (
                <Icon
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                />
              )}
              <FormControl>
                <Input
                  placeholder={placeholder}
                  type={resolvedType}
                  {...field}
                  value={(field.value as string) ?? ""}
                  className="h-11 rounded-xl border bg-white/80 backdrop-blur-sm text-14 transition-all placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 focus-visible:border-blue-500"
                  style={{
                    paddingLeft: Icon ? "2.5rem" : "0.875rem",
                    paddingRight: isPassword ? "2.5rem" : "0.875rem",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-strong)",
                  }}
                />
              </FormControl>
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
            <FormMessage className="text-12 text-red-500 mt-1.5" />
          </div>
        </div>
      )}
    />
  );
};

export default CustomInput;
