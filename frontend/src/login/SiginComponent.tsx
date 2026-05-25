import { useState, useRef } from "react";
import { Form, Button, PasswordInput, Schema, type FormInstance } from "rsuite";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../redux/store";
import { SignupAdmin } from "../redux/store/slices/ExtraSlice/LoginExtraSlice";
import AuthShell from "../components/auth/AuthShell";
import { getApiErrorMessage } from "../utils/apiError";

const { StringType } = Schema.Types;

const model = Schema.Model({
  email: StringType()
    .isEmail("Enter a valid email address")
    .isRequired("Email is required"),
  password: StringType()
    .minLength(6, "Password must be at least 6 characters")
    .isRequired("Password is required"),
});

type FormType = { email: string; password: string };

const SignupComponent = () => {
  const [formValue, setFormValue] = useState<FormType>({ email: "", password: "" });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<FormInstance | null>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.admin.loading);

  const handleChange = (value: Record<string, unknown>) => {
    setFormValue(value as FormType);
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async () => {
    if (!formRef.current?.check()) return;

    setError(null);
    setSuccess(null);

    try {
      await dispatch(SignupAdmin(formValue)).unwrap();
      const msg = "Account created successfully. Redirecting to sign in…";
      setSuccess(msg);
      toast.success("Account created");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Signup failed");
      setError(message);
      toast.error(message);
    }
  };

  return (
    <AuthShell
      mode="signup"
      eyebrow="Staff onboarding"
      title="Create your admin account"
      subtitle="Register with your work email. Signup may be restricted by your organization."
      error={error}
      success={success}
      onDismissError={() => setError(null)}
      onDismissSuccess={() => setSuccess(null)}
    >
      <Form
        ref={formRef}
        fluid
        model={model}
        formValue={formValue}
        onChange={handleChange}
        onSubmit={handleSubmit}
      >
        <Form.Group>
          <Form.Label>Email</Form.Label>
          <Form.Control
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Password</Form.Label>
          <Form.Control
            accepter={PasswordInput}
            name="password"
            autoComplete="new-password"
            placeholder="Minimum 6 characters"
          />
        </Form.Group>
        <Button
          appearance="primary"
          block
          type="submit"
          loading={loading}
          disabled={loading}
          className="auth-shell__submit"
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </Form>
    </AuthShell>
  );
};

export default SignupComponent;
