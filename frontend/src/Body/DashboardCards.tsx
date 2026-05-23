import { useSelector } from "react-redux";
import { Link } from "react-router";
import { Row, Col } from "rsuite";

const DashboardCards = () => {
    const totalInvestorsCount =
        useSelector((state: any) => state.summary.totalInvestorsCount?.totalInvestors) || 0;

    const cards = [
        { title: "Participant Database", value: totalInvestorsCount, color: "#f59e0b", description: "Manage Participants" },
        { title: "Entry Passes Issued", value: "290+", color: "#22c55e", description: "View All Passes" },
        { title: "Verified Check-ins", value: "145", color: "#ef4444", description: "Scanning Inactive" },
        { title: "Main Members", value: "500", color: "#3b82f6", description: "Primary Members" },
        { title: "Sub Members", value: "500", color: "#6366f1", description: "Secondary Members" },
        { title: "Male Guests", value: "500", color: "#06b6d4", description: "Guest Statistics" },
        { title: "Female Guests", value: "500", color: "#ec4899", description: "Guest Statistics" },
    ];

    return (
        <Row
            gutter={20}
            style={{
                marginTop: 10,
                justifyContent: "center",
            }}
        >
            {cards.map((card, index) => (
                <Col
                    key={index}
                    xs={24}
                    sm={12}
                    md={8}
                    lg={6}
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "24px",
                    }}
                >
                    <Link
                        to={"/investors-list"}
                        style={{
                            textDecoration: "none",
                            width: "100%",
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                maxWidth: "320px",
                                borderRadius: "18px",

                                // 🔥 GLASS + GRADIENT
                                background: `linear-gradient(135deg, ${card.color}20, ${card.color}80)`,

                                backdropFilter: "blur(10px)",
                                WebkitBackdropFilter: "blur(10px)",

                                border: "1px solid rgba(255,255,255,0.15)",

                                // 🔥 SHADOW DEPTH
                                boxShadow:
                                    "0 10px 25px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.2)",

                                padding: "18px",
                                minHeight: "150px",

                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",

                                transition: "all 0.3s ease",
                                cursor: "pointer",
                            }}

                            // 🔥 HOVER EFFECT
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px) scale(1.02)";
                                (e.currentTarget as HTMLDivElement).style.boxShadow =
                                    "0 20px 40px rgba(0,0,0,0.15)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0) scale(1)";
                                (e.currentTarget as HTMLDivElement).style.boxShadow =
                                    "0 10px 25px rgba(0,0,0,0.08)";
                            }}
                        >
                            {/* TOP */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color:card.color,
                                        // color: "#ffffffcc",
                                    }}
                                >
                                    {card.title}
                                </p>

                                {/* ICON DOT */}
                                <div
                                    style={{
                                        width: "10px",
                                        height: "10px",
                                        borderRadius: "50%",
                                        background: card.color,
                                        boxShadow: `0 0 10px ${card.color}`,
                                    }}
                                />
                            </div>

                            {/* VALUE */}
                            <h1
                                style={{
                                    fontSize: "34px",
                                    margin: "10px 0",
                                    fontWeight: 700,
                                    color: card.color,
                                    letterSpacing: "1px",
                                }}
                            >
                                {card.value}
                            </h1>

                            {/* BOTTOM */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: "12px",
                                        margin: 0,
                                          color:card.color,
                                        // color: "#ffffffaa",
                                    }}
                                >
                                    {card.description}
                                </p>

                                {/* ARROW */}
                                <span
                                    style={{
                                        fontSize: "18px",
                                        color: "#fff",
                                        transition: "transform 0.2s",
                                    }}
                                >
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