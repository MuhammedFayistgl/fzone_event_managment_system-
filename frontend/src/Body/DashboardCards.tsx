import type { CSSProperties } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router";
import { Row, Col } from "rsuite";

const DashboardCards = () => {
    const summary = useSelector((state: any) => state.summary.totalInvestorsCount) || {};

    const cards = [
        { title: "Participant Database", value: summary.totalInvestors ?? 0, color: "#f59e0b", description: "Manage Participants" },
        { title: "Entry Passes Issued", value: summary.entryPassesIssued ?? 0, color: "#22c55e", description: "View All Passes" },
        { title: "Verified Check-ins", value: summary.verifiedCheckIns ?? 0, color: "#ef4444", description: "Scanning Inactive" },
        { title: "Main Members", value: summary.mainMembers ?? 0, color: "#3b82f6", description: "Primary Members" },
        { title: "Sub Members", value: summary.subMembers ?? 0, color: "#6366f1", description: "Secondary Members" },
        { title: "Male Guests", value: summary.maleCount ?? 0, color: "#06b6d4", description: "Guest Statistics" },
        { title: "Female Guests", value: summary.femaleCount ?? 0, color: "#ec4899", description: "Guest Statistics" },
    ];

    return (
        <Row gutter={20} style={{ marginTop: 10, justifyContent: "center" }}>
            {cards.map((card, index) => (
                <Col
                    key={index}
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                    style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}
                >
                    <Link
                        to="/user-management"
                        className="dashboard-card-link w-full max-w-[320px] flex justify-center group"
                    >
                        <div
                            className="dashboard-stat-card w-full rounded-[18px] p-[18px] min-h-[150px] flex flex-col justify-between cursor-pointer hover:-translate-y-1.5 hover:scale-[1.02]"
                            style={{ "--card-accent": card.color } as CSSProperties}
                        >
                            <div className="flex justify-between items-center">
                                <p className="dashboard-stat-title m-0 text-[13px] font-medium">
                                    {card.title}
                                </p>
                                <div className="dashboard-stat-dot w-2.5 h-2.5 rounded-full" />
                            </div>

                            <h1 className="dashboard-stat-value text-[34px] my-2.5 font-bold tracking-wide">
                                {card.value}
                            </h1>

                            <div className="flex justify-between items-center">
                                <p className="dashboard-stat-desc text-xs m-0">
                                    {card.description}
                                </p>
                                <span className="text-lg text-app-muted transition-transform group-hover:translate-x-0.5 group-hover:text-app-cyan">
                                    →
                                </span>
                            </div>
                        </div>
                    </Link>
                </Col>
            ))}
        </Row>
    );
};

export default DashboardCards;
