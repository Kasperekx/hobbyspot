import { useState } from "react";

import { AuthError } from "@/lib/auth/api";
import { useAuth } from "@/lib/auth/auth-context";

type FormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export function useLoginForm() {
  const { logIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const onEmailChange = (value: string) => {
    setEmail(value);
    if (errors.form) setErrors((prev) => ({ ...prev, form: undefined }));
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    if (errors.form) setErrors((prev) => ({ ...prev, form: undefined }));
  };

  const submit = async () => {
    if (submitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrors({ form: "Podaj email i hasło." });
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      // On success the navigation guard redirects based on onboarding status.
      await logIn({ email: trimmedEmail, password });
    } catch (error) {
      if (error instanceof AuthError && error.status === 401) {
        setErrors({ form: "Nieprawidłowy email lub hasło." });
      } else if (error instanceof AuthError) {
        setErrors({ form: error.detail ?? error.message });
      } else {
        setErrors({ form: "Brak połączenia z serwerem. Spróbuj ponownie." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return {
    email,
    password,
    errors,
    submitting,
    onEmailChange,
    onPasswordChange,
    submit,
  };
}
