"use client";

import Layout from "@/components/layout";
import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/appContext";
import { fetchData } from "@/utils/fetchData";
import TableGrid from "@/components/tableGrid";
import { FaTrashAlt, FaPenAlt } from "react-icons/fa";
import Button from "@/components/button/index.jsx";

export default function Vulnerabilities() {
    const { dispatch } = useAppContext();
    const [vulnerabilities, setVulnerabilities] = useState([]);

    const loadVulnerabilities = async (
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/vulnerabilities/`,
        options = {}
    ) => {
        const { force = false, validate = false } = options;
        try {
            dispatch({ type: "SET_LOADING", payload: true });
            const data = await fetchData(url, { force, validate });
            setVulnerabilities(data?.data || []);
        } catch (error) {
            console.info("Error fetching vulnerabilities:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    useEffect(() => {
        loadVulnerabilities();
    }, []);

    const handleEdit = (vuln) => {
        alert(`Editing vulnerability: ${vuln.title}`);
    };

    const handleDelete = (vuln) => {
        if (window.confirm(`Are you sure you want to delete "${vuln.title}"?`)) {
            setVulnerabilities((prev) => prev.filter((v) => v._id !== vuln._id));
        }
    };

    const columns = [
        {
            key: "_id",
            title: "ID",
            width: 80,
            stick: true,
            render: (value) => value.slice(-6),
        },
        {
            key: "title",
            title: "Title",
            stick: true,
            searchable: true,
            width: 220,
        },
        {
            key: "tenantId",
            title: "Tenant",
            width: 200,
            render: (value) => value?.name || "-",
        },
        {
            key: "assetId",
            title: "Asset",
            width: 200,
            render: (value) => value?.name || "-",
        },
        {
            key: "source",
            title: "Source",
            width: 140,
            render: (value) => value?.charAt(0).toUpperCase() + value?.slice(1),
        },
        {
            key: "severity",
            title: "Severity",
            filterable: true,
            filterOptions: [
                { label: "Low", value: "low" },
                { label: "Medium", value: "medium" },
                { label: "High", value: "high" },
                { label: "Critical", value: "critical" },
            ],
            render: (value) => {
                const colors = {
                    low: "#22c55e",
                    medium: "#f59e0b",
                    high: "#ef4444",
                    critical: "#b91c1c",
                };
                return (
                    <span
                        style={{
                            backgroundColor: colors[value] + "20",
                            color: colors[value],
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                        }}
                    >
                        {value?.toUpperCase()}
                    </span>
                );
            },
        },
        {
            key: "status",
            title: "Status",
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Open", value: "open" },
                { label: "In Progress", value: "in_progress" },
                { label: "Resolved", value: "resolved" },
                { label: "Ignored", value: "ignored" },
            ],
            render: (value) => {
                const colors = {
                    open: "#ef4444",
                    in_progress: "#f59e0b",
                    resolved: "#22c55e",
                    ignored: "#6b7280",
                };
                return (
                    <span style={{ color: colors[value], fontWeight: 600 }}>
                        {value?.replace("_", " ")?.toUpperCase()}
                    </span>
                );
            },
        },
        {
            key: "detectedAt",
            title: "Detected At",
            width: 180,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
        {
            key: "lastUpdatedAt",
            title: "Last Updated",
            width: 180,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
        {
            key: "actions",
            title: "Actions",
            render: (value, row) => (
                <div className="rtg-cell">
                    <Button
                        onClick={() => handleEdit(row)}
                        text={`Edit`}
                        iconRight={<FaPenAlt />}
                        small
                        className={`m-2 !bg-blue-100 hover:!bg-blue-400 hover:!text-white !text-gray-800 !border-2 !border-blue-400`}
                    />

                    <Button
                        onClick={() => handleDelete(row)}
                        text={`Delete`}
                        danger
                        iconRight={<FaTrashAlt />}
                        small
                        className={`m-2 !bg-white hover:!bg-red-500 hover:!text-white !text-red-500 !border-2 !border-red-500`}
                    />
                </div>
            ),
        },
    ];

    return (
        <Layout>
            <TableGrid
                columns={columns}
                data={vulnerabilities}
                paginationMode="client"
                pageSizeOptions={[5, 10, 20]}
                maxHeight="65vh"
                maxWidth="100%"
            />
        </Layout>
    );
}
