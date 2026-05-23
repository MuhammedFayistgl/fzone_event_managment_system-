import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RecentRegistrationsUI from "../RecentRegistrationsUI";


type Props = {
    mode?: "preview" | "full";
};

const mockData = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    name: ["Aisha", "Jaza", "Faiha"][i % 3],
    phone: "98" + Math.floor(10000000 + Math.random() * 90000000),
    category: ["Family", "VIP", "General"][i % 3],
    passStatus: i % 2 === 0 ? "RELEASED" : "PENDING",
    checkIn: i % 2 === 0,
    time: new Date(),
}));

const RecentRegistrationsContainer: React.FC<Props> = ({ mode = "preview" }) => {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");
    const [loading] = useState(false);

    const filtered = useMemo(() => {
        return mockData.filter(
            (item) =>
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.phone.includes(search)
        );
    }, [search]);

    return (
        <RecentRegistrationsUI
            preview={mode === "preview"}
            navigate={navigate}
            filtered={filtered}
            loading={loading}
            search={search}
            setSearch={setSearch}
        />
    );
};

export default RecentRegistrationsContainer;