import type { FC } from 'react';
import { Link, Panel } from 'rsuite';
import { motion } from "framer-motion";
// import { Link } from 'react-router-dom';

interface CardTemplateProps {
  cardData: number;
  color?: string;
  size?: string;
}

const CardTemplate: FC<CardTemplateProps> = ({ cardData, color }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.3 }}
      style={{ borderRadius: "20px" }}
    >
      <Panel
        bordered
        style={{
          padding: "4px",
          marginTop: '10px',
          borderRadius: "20px",
          background: color || "#1a5394",
          boxShadow: `
            8px 8px 16px #edeff1,
            -8px -8px 16px #ffffff
          `,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <div>
            <p style={{ margin: 0, color: "white", fontSize: "10px" }}>
              PARTICIPENT DATABASE
            </p>

            <h3 style={{ margin: 0, color: 'white', fontSize: "40px" }}>
              {cardData}
            </h3>

            <Link
              style={{ textDecoration: 'none', color: 'white', fontSize: "10px" }}
              href="/investors-list"
            >
              MANAGE PARTICIPENT
            </Link>
          </div>
        </div>
      </Panel>
    </motion.div>
  );
};

export default CardTemplate;