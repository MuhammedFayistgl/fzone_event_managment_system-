import { type ReactNode } from "react";
import { Container, Content } from "rsuite";

interface Props {
    children: ReactNode;
}

const ResponsivePage = ({ children }: Props) => {
    return (
        <Container
            style={{
                minHeight: "100vh", // ✅ no fixed height issues
                padding: "16px",
                background: "#e0e5ec", // ✅ neumorphism base color
            }}
        >
            <Content
                style={{
                    background: "#e0e5ec",
                    borderRadius: "16px",

                    padding: "20px",

                    // ✅ remove fixed height (important)
                    height: "auto",
                    minHeight: "calc(100vh - 32px)",

                    overflow: "auto",

                    // 🔥 neumorphism shadow
                    boxShadow: `
                        8px 8px 15px #bebebe,
                        -8px -8px 15px #ffffff
                    `,
                }}
            >
                {children}
            </Content>
        </Container>
    );
};

export default ResponsivePage;