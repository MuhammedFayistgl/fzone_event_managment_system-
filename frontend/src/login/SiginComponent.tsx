import { useState, useRef } from "react";
import {
    Container, Content, Center, Panel, Form, Button, PasswordInput, Message, Schema, type FormInstance
} from "rsuite";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { SignupAdmin } from "../redux/store/slices/ExtraSlice/LoginExtraSlice";
import { useNavigate } from "react-router";

const { StringType } = Schema.Types;

const model = Schema.Model({
    email: StringType().isEmail("Enter valid email").isRequired("Email is required"),
    password: StringType().minLength(6, "Minimum 6 characters required").isRequired("Password is required"),
});

type FormType = { email: string; password: string };

const SignupComponent = () => {
    const [formValue, setFormValue] = useState<FormType>({ email: "", password: "" });
    const [success, setSuccess] = useState("");
    const formRef = useRef<FormInstance | null>(null);
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.admin);

    const handleChange = (value: Record<string, any>) => {
        setFormValue(value as FormType);
    };

    const handleSubmit = async () => {
        if (!formRef.current?.check()) return;
        try {
            await dispatch(SignupAdmin(formValue)).unwrap();
            setSuccess("Signup Successful");
            setTimeout(() => navigate("/login"), 1500);
        } catch (err: any) {
            const msg = err?.response?.data?.message || (typeof err?.response?.data === "string" ? err.response.data : null) || "Signup Failed";
            alert(msg);
        }
    };

    return (
        <div className="app-page min-h-screen flex items-center justify-center">
            <div className="app-glow" aria-hidden />
            <Container className="relative z-10" style={{ height: "auto" }}>
                <Content>
                    <Center>
                        <Panel bordered className="app-card" style={{ width: 360, padding: 24 }}>
                            <h3 className="text-center text-app-text font-bold mb-5">Signup</h3>
                            {success && <Message type="success" closable>{success}</Message>}
                            {error && <Message type="error" closable>{error}</Message>}
                            <Form ref={formRef} fluid model={model} formValue={formValue} onChange={handleChange} onSubmit={handleSubmit}>
                                <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control name="email" />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control accepter={PasswordInput} name="password" />
                                </Form.Group>
                                <Button appearance="primary" block type="submit" loading={loading} disabled={loading}>
                                    {loading ? "Creating..." : "Signup"}
                                </Button>
                            </Form>
                        </Panel>
                    </Center>
                </Content>
            </Container>
        </div>
    );
};

export default SignupComponent;
