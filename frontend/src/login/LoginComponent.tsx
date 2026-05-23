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

            navigate("/");

        } catch (err: unknown) {
            const error = err as any;
            alert(error?.response?.data?.message || "Login Failed");
        }
    };

    return (
        <Container style={{ height: "100vh" }}>
            <Content>
                <Center style={{ height: "100%" }}>
                    <Panel bordered style={{ width: 320, padding: 20 }}>
                        <h3 style={{ textAlign: "center" }}>Login</h3>

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
    );
};

export default LoginComponent;