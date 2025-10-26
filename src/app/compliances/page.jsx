"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { useAppContext } from "@/context/appContext";
import { fetchData } from "@/utils/fetchData";
import TableGrid from "@/components/tableGrid";

export default function Compliances() {
    const { state, dispatch } = useAppContext();
    const [compliances, setCompliances] = useState([]);

    const loadCompliances = async (
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/compliances`,
        options = {}
    ) => {
        const { force = false, validate = false } = options;
        try {
            dispatch({ type: "SET_LOADING", payload: true });
            const res = await fetchData(url, { force, validate });
            setCompliances(res?.data || []);
        } catch (error) {
            console.error("Error fetching compliances:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    useEffect(() => {
        loadCompliances();
    }, []);

    const handleView = (row) => {
        alert(`Viewing control ${row.controlId} (${row.framework})`);
    };

    const handleDelete = (row) => {
        if (window.confirm(`Delete compliance control ${row.controlId}?`)) {
            setCompliances((prev) => prev.filter((r) => r._id !== row._id));
        }
    };

    const columns = [
        {
            key: "_id",
            title: "ID",
            width: 70,
            render: (value) => value?.slice(-6),
        },
        {
            key: "tenantId",
            title: "Tenant",
            searchable: true,
            width: 200,
            render: (value) => value?.name || "-",
        },
        {
            key: "framework",
            title: "Framework",
            filterable: true,
            width: 140,
            filterOptions: [
                { label: "All", value: "" },
                { label: "CIS", value: "CIS" },
                { label: "ISO27001", value: "ISO27001" },
                { label: "HIPAA", value: "HIPAA" },
                { label: "SOC2", value: "SOC2" },
                { label: "PCI-DSS", value: "PCI-DSS" },
            ],
            render: (value) => (
                <span
                    style={{
                        backgroundColor: "#f0f9ff",
                        color: "#0369a1",
                        fontWeight: 600,
                        padding: "2px 6px",
                        borderRadius: "6px",
                        fontSize: "12px",
                    }}
                >
                    {value || "-"}
                </span>
            ),
        },
        {
            key: "controlId",
            title: "Control ID",
            searchable: true,
            width: 120,
        },
        {
            key: "controlTitle",
            title: "Control Title",
            searchable: true,
            width: 300,
            render: (value) => value || "-",
        },
        {
            key: "status",
            title: "Status",
            filterable: true,
            width: 130,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Compliant", value: "compliant" },
                { label: "Non-Compliant", value: "non_compliant" },
                { label: "Unknown", value: "unknown" },
            ],
            render: (value) => {
                const colors = {
                    compliant: { color: "#22c55e", bg: "#dcfce7" },
                    non_compliant: { color: "#ef4444", bg: "#fee2e2" },
                    unknown: { color: "#9ca3af", bg: "#f3f4f6" },
                };
                const c = colors[value] || { color: "#333", bg: "#f4f4f4" };
                return (
                    <span
                        style={{
                            backgroundColor: c.bg,
                            color: c.color,
                            padding: "3px 6px",
                            borderRadius: "6px",
                            fontWeight: 600,
                        }}
                    >
                        {value?.replace("_", " ")?.toUpperCase() || "-"}
                    </span>
                );
            },
        },
        {
            key: "severity",
            title: "Severity",
            filterable: true,
            width: 130,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Low", value: "low" },
                { label: "Medium", value: "medium" },
                { label: "High", value: "high" },
                { label: "Critical", value: "critical" },
            ],
            render: (value) => {
                const colors = {
                    low: "#16a34a",
                    medium: "#f59e0b",
                    high: "#dc2626",
                    critical: "#991b1b",
                };
                return (
                    <span
                        style={{
                            color: colors[value] || "#444",
                            fontWeight: 600,
                        }}
                    >
                        {value?.charAt(0).toUpperCase() + value?.slice(1)}
                    </span>
                );
            },
        },
        {
            key: "lastCheckedAt",
            title: "Last Checked",
            width: 170,
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
            width: 150,
            render: (value, row) => (
                <div className="rtg-cell">
                    <button className="rtg__btn rtg__btn--edit" onClick={() => handleView(row)}>
                        View
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
                data={compliances}
                paginationMode="client"
                pageSizeOptions={[5, 10, 20]}
                maxHeight="70vh"
                maxWidth="100%"
            />
        </Layout>
    );
}
