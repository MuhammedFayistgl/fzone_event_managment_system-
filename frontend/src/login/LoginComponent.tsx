import { useState, useRef } from "react";
import { Form, Button, PasswordInput, Schema, type FormInstance } from "rsuite";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "../redux/store";
import { LoginAdmin } from "../redux/store/slices/ExtraSlice/LoginExtraSlice";
import { setAccessToken } from "../api/axios";
import { reconnectLiveSocket } from "../live/socket";
import { clearAdminProfileCache } from "../hooks/useAdminProfile";
import AuthShell from "../components/auth/AuthShell";
import { getApiErrorMessage } from "../utils/apiError";
import { getApiBaseURL } from "../api/axios";

type LoginFormType = {
  email: string;
  password: string;
};

const { StringType } = Schema.Types;

const model = Schema.Model({
  email: StringType()
    .isEmail("Enter a valid email address")
    .isRequired("Email is required"),
  password: StringType()
    .minLength(6, "Password must be at least 6 characters")
    .isRequired("Password is required"),
});

const LoginComponent = () => {
  const [formValue, setFormValue] = useState<LoginFormType>({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);

  const formRef = useRef<FormInstance | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const loading = useSelector((state: RootState) => state.admin.loading);

  const handleChange = (value: Record<string, unknown>) => {
    setFormValue(value as LoginFormType);
    if (error) setError(null);
  };

  const handleSubmit = async () => {
    if (!formRef.current?.check()) return;

    setError(null);

    try {
      const res = (await dispatch(LoginAdmin(formValue)).unwrap()) as {
        accessToken: string;
        role?: string;
      };
      // #region agent log
      fetch("http://127.0.0.1:7491/ingest/9ee3c56f-bbdc-4afb-949c-a1d4340854c1", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "715abf" },
        body: JSON.stringify({
          sessionId: "715abf",
          runId: "post-fix",
          hypothesisId: "H-login-success",
          location: "LoginComponent.tsx:handleSubmit",
          message: "login success",
          data: { role: res.role ?? null, apiBase: getApiBaseURL() },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      localStorage.setItem("accessToken", res.accessToken);
      setAccessToken(res.accessToken);
      clearAdminProfileCache();
      reconnectLiveSocket();
      toast.success("Welcome back");
      navigate("/");
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, "Login failed");
      // #region agent log
      fetch("http://127.0.0.1:7491/ingest/9ee3c56f-bbdc-4afb-949c-a1d4340854c1", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "715abf" },
        body: JSON.stringify({
          sessionId: "715abf",
          runId: "post-fix",
          hypothesisId: "H-login-fail",
          location: "LoginComponent.tsx:handleSubmit",
          message: "login failed",
          data: {
            apiBase: getApiBaseURL(),
            errorMessage: message,
            status: (err as { response?: { status?: number } })?.response?.status ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      setError(message);
      toast.error(message);
    }
  };

  return (
    <AuthShell
      mode="login"
      eyebrow="Staff access"
      title="Sign in to your workspace"
      subtitle="Use your admin credentials to access events, investors, and live operations."
      error={error}
      onDismissError={() => setError(null)}
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
            autoComplete="current-password"
            placeholder="Enter your password"
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
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </Form>
    </AuthShell>
  );
};

export default LoginComponent;
