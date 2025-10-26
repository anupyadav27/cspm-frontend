"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { useAppContext } from "@/context/appContext";
import { fetchData } from "@/utils/fetchData";
import TableGrid from "@/components/tableGrid";

export default function Threats() {
    const { state, dispatch } = useAppContext();
    const [threats, setThreats] = useState([]);

    const loadThreats = async (
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/threats`,
        options = {}
    ) => {
        const { force = false, validate = false } = options;
        try {
            dispatch({ type: "SET_LOADING", payload: true });
            const data = await fetchData(url, { force, validate });
            setThreats(data?.data || []);
        } catch (error) {
            console.error("Error fetching threats:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    useEffect(() => {
        loadThreats();
    }, []);

    const handleEdit = (threat) => {
        alert(`Editing threat: ${threat.title}`);
    };

    const handleDelete = (threat) => {
        if (window.confirm(`Are you sure you want to delete "${threat.title}"?`)) {
            setThreats((prev) => prev.filter((t) => t._id !== threat._id));
        }
    };

    const columns = [
        {
            key: "_id",
            title: "ID",
            width: 80,
            render: (value) => value?.slice(-6),
        },
        {
            key: "title",
            title: "Title",
            searchable: true,
            width: 400,
        },
        {
            key: "tenantId",
            title: "Tenant",
            width: 180,
            render: (value) => value?.name || "-",
        },
        {
            key: "assetId",
            title: "Asset",
            width: 200,
            render: (value) => value?.name || "-",
        },
        {
            key: "severity",
            title: "Severity",
            filterable: true,
            width: 120,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Low", value: "low" },
                { label: "Medium", value: "medium" },
                { label: "High", value: "high" },
                { label: "Critical", value: "critical" },
            ],
            render: (value) => {
                const colorMap = {
                    low: "#22c55e",
                    medium: "#eab308",
                    high: "#f97316",
                    critical: "#ef4444",
                };
                return (
                    <span
                        style={{
                            color: colorMap[value] || "#555",
                            fontWeight: 600,
                            textTransform: "capitalize",
                        }}
                    >
                        {value || "-"}
                    </span>
                );
            },
        },
        {
            key: "status",
            title: "Status",
            filterable: true,
            width: 160,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Active", value: "active" },
                { label: "Resolved", value: "resolved" },
                { label: "Investigating", value: "investigating" },
                { label: "False Positive", value: "false_positive" },
            ],
            render: (value) => {
                const colorMap = {
                    active: "#22c55e",
                    resolved: "#3b82f6",
                    investigating: "#f59e0b",
                    false_positive: "#ef4444",
                };
                return (
                    <span
                        style={{
                            color: colorMap[value] || "#555",
                            fontWeight: 600,
                            textTransform: "capitalize",
                        }}
                    >
                        {value?.replace("_", " ")}
                    </span>
                );
            },
        },
        {
            key: "region",
            title: "Region",
            width: 140,
            render: (value) => value?.toUpperCase() || "-",
        },
        {
            key: "source",
            title: "Source",
            width: 160,
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Manual", value: "manual" },
                { label: "CloudWatch", value: "cloudwatch" },
                { label: "GuardDuty", value: "guardduty" },
                { label: "SecurityHub", value: "security_hub" },
                { label: "External Feed", value: "external_feed" },
            ],
            render: (value) =>
                value ? value.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "-",
        },
        {
            key: "confidence",
            title: "Confidence",
            width: 120,
            render: (value) => `${value || 0}%`,
        },
        {
            key: "detectedAt",
            title: "Detected At",
            width: 160,
            render: (value) => {
                if (!value) return "-";
                const date = new Date(value);
                return date.toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                });
            },
        },
        {
            key: "lastUpdatedAt",
            title: "Last Updated",
            width: 160,
            render: (value) => {
                if (!value) return "-";
                const date = new Date(value);
                return date.toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                });
            },
        },
        {
            key: "actions",
            title: "Actions",
            width: 140,
            render: (value, row) => (
                <div className="rtg-cell">
                    <button className="rtg__btn rtg__btn--edit" onClick={() => handleEdit(row)}>
                        Edit
                    </button>
                    <button className="rtg__btn rtg__btn--delete" onClick={() => handleDelete(row)}>
                        Delete
                    </button>
                </div>
            ),
        },
    ];

    return (
        <Layout>
            <TableGrid
                columns={columns}
                data={threats}
                paginationMode="client"
                pageSizeOptions={[5, 10, 20]}
                maxHeight="65vh"
                maxWidth="100%"
            />
        </Layout>
    );
}
