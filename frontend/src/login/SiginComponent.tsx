import { useState, useRef } from "react";
import {
    Container,
    Content,
    Center,
    Panel,
    Form,
    Button,
    PasswordInput,
    Message,
    Schema,
    type FormInstance
} from "rsuite";

import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../redux/store";
import { SignupAdmin } from "../redux/store/slices/ExtraSlice/LoginExtraSlice";
import { useNavigate } from "react-router";

const { StringType } = Schema.Types;

// ✅ Validation Model
const model = Schema.Model({
    email: StringType()
        .isEmail("Enter valid email")
        .isRequired("Email is required"),

    password: StringType()
        .minLength(6, "Minimum 6 characters required")
        .isRequired("Password is required")
});

// ✅ Type
type FormType = {
    email: string;
    password: string;
};

const SignupComponent = () => {

    const [formValue, setFormValue] = useState<FormType>({
        email: "",
        password: ""
    });

    const [success, setSuccess] = useState("");

    const formRef = useRef<FormInstance | null>(null);
const navigate = useNavigate()
    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.admin);

    // ✅ handle change (RSuite fix)
    const handleChange = (value: Record<string, any>) => {
        setFormValue(value as FormType);
    };

    // ✅ submit
   const handleSubmit = async () => {
    if (!formRef.current?.check()) return;

    try {
        await dispatch(SignupAdmin(formValue)).unwrap();
        setSuccess("Signup Successful");
         // ✅ redirect after 1.5 seconds
        setTimeout(() => {
            navigate("/login");
        }, 1500);
    } catch (err: any) {
        alert(err?.response?.data?.message || "Signup Failed");
    }
};
    return (
        <Container style={{ height: "100vh" }}>
            <Content>
                <Center style={{ height: "100%" }}>
                    <Panel bordered style={{ width: 340, padding: 20 }}>

                        <h3 style={{ textAlign: "center", marginBottom: 20 }}>
                            Signup
                        </h3>

                        {/* ✅ Success */}
                        {success && (
                            <Message type="success" closable>
                                {success}
                            </Message>
                        )}

                        {/* ❌ Error */}
                        {error && (
                            <Message type="error" closable>
                                {error}
                            </Message>
                        )}

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
                                <Form.Control
                                    accepter={PasswordInput}
                                    name="password"
                                />
                            </Form.Group>

                            <Button
                                appearance="primary"
                                block
                                type="submit"
                                loading={loading}
                                disabled={loading}
                            >
                                {loading ? "Creating..." : "Signup"}
                            </Button>

                        </Form>

                    </Panel>
                </Center>
            </Content>
        </Container>
    );
};

export default SignupComponent;