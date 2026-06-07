import { useState } from "react";

import { AuthError } from "@/lib/auth/api";
import { useAuth } from "@/lib/auth/auth-context";

const MIN_PASSWORD_LENGTH = 12;

type FormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};

  if (!email.includes("@") || /\s/.test(email)) {
    errors.email = "Podaj poprawny adres email.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`;
  }

  return errors;
}

export function useRegisterForm() {
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const onEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email || errors.form) setErrors((prev) => ({ ...prev, email: undefined, form: undefined }));
  };

  const onPasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password || errors.form) setErrors((prev) => ({ ...prev, password: undefined, form: undefined }));
  };

  const submit = async () => {
    if (submitting) return;

    const trimmedEmail = email.trim();
    const clientErrors = validate(trimmedEmail, password);
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      // On success the navigation guard redirects into the onboarding flow.
      await register({ email: trimmedEmail, password });
    } catch (error) {
      if (error instanceof AuthError && error.fieldErrors) {
        setErrors({
          email: error.fieldErrors.email?.[0],
          password: error.fieldErrors.password?.[0],
        });
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
