import { motion } from "framer-motion";

export default function Splash() {
    return (
        <div style={{
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#ffffff"
        }}>
            <motion.h1
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                F ZONE         
            </motion.h1>
        </div>
    );
}