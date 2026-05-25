import { useState, useRef } from "react";
import {
    Container, Content, Center, Panel,
    Form, Button, PasswordInput,
    Schema, type FormInstance
} from "rsuite";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../redux/store";
import { LoginAdmin } from "../redux/store/slices/ExtraSlice/LoginExtraSlice";
import { setAccessToken } from "../api/axios";
import { reconnectLiveSocket } from "../live/socket";
import { useNavigate } from "react-router-dom";

type LoginFormType = {
    email: string;
    password: string;
};

const { StringType } = Schema.Types;

const model = Schema.Model({
    email: StringType()
        .isEmail("Valid email enter ചെയ്യണം")
        .isRequired("Email required"),

    password: StringType()
        .minLength(6, "Minimum 6 characters")
        .isRequired("Password required"),
});

const LoginComponent = () => {
    const [formValue, setFormValue] = useState<LoginFormType>({
        email: "",
        password: ""
    });

    const formRef = useRef<FormInstance | null>(null);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const handleChange = (value: Record<string, any>) => {
        setFormValue(value as LoginFormType);
    };

    const handleSubmit = async () => {
        if (!formRef.current?.check()) return;

        try {
            const res = await dispatch(LoginAdmin(formValue)).unwrap() as { accessToken: string };
            localStorage.setItem("accessToken", res.accessToken);
            setAccessToken(res.accessToken);
            reconnectLiveSocket();
            navigate("/");
        } catch (err: unknown) {
            const error = err as any;
            alert(error?.response?.data?.message || "Login Failed");
        }
    };

    return (
        <div className="app-page min-h-screen flex items-center justify-center">
            <div className="app-glow" aria-hidden />
            <Container className="relative z-10" style={{ height: "auto" }}>
                <Content>
                    <Center>
                        <Panel bordered className="app-card" style={{ width: 360, padding: 24 }}>
                            <h3 className="text-center text-app-text font-bold mb-4">Login</h3>
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
                                    <Form.Control name="email" />
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control accepter={PasswordInput} name="password" />
                                </Form.Group>
                                <Button appearance="primary" block type="submit">
                                    Login
                                </Button>
                            </Form>
                        </Panel>
                    </Center>
                </Content>
            </Container>
        </div>
    );
};

export default LoginComponent;
