import React, { type ReactNode } from "react";

interface NeoCardProps {
    children: ReactNode;
}

const NeoCard: React.FC<NeoCardProps> = ({ children }) => {
    return (
        <div
            style={{
                background: "#e0e5ec",
                borderRadius: "20px",
                padding: "20px",
                boxShadow: `
          8px 8px 16px #a3b1c6,
          -8px -8px 16px #ffffff
        `,
                transition: "all 0.3s ease",
                height: "100%",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                    "inset 6px 6px 12px #a3b1c6, inset -6px -6px 12px #ffffff";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                    "8px 8px 16px #a3b1c6, -8px -8px 16px #ffffff";
            }}
        >
            {children}
        </div>
    );
};

export default NeoCard;