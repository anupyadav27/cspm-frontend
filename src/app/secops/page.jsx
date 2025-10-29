"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { useAppContext } from "@/context/appContext";
import { fetchData } from "@/utils/fetchData";
import TableGrid from "@/components/tableGrid";
import { useAuthActions } from "@/context/appContext/useAuthActions/index.jsx";

export default function SecOps() {
    const { state, dispatch } = useAppContext();
    const [secops, setSecops] = useState([]);
    const { handleLogout } = useAuthActions();

    const loadSecOps = async (
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/secops`,
        options = {}
    ) => {
        const { force = false, validate = false } = options;
        try {
            dispatch({ type: "SET_LOADING", payload: true });
            const result = await fetchData(url, { force, validate });

            if (result?.logOut) {
                handleLogout();
                return;
            }

            if (result?.data) {
                setSecops(result.data);
            }
        } catch (error) {
            console.error("Error fetching SecOps:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    useEffect(() => {
        loadSecOps();
    }, []);

    const columns = [
        {
            key: "_id",
            title: "ID",
            width: 90,
            render: (value) => value?.slice(-6),
        },
        {
            key: "tenantId",
            title: "Tenant",
            searchable: true,
            width: 180,
            render: (value) => value?.name || "-",
        },
        {
            key: "project",
            title: "Project",
            searchable: true,
            width: 160,
        },
        {
            key: "repository",
            title: "Repository",
            width: 300,
        },
        {
            key: "branch",
            title: "Branch",
            width: 120,
        },
        {
            key: "commitId",
            title: "Commit ID",
            width: 100,
        },
        {
            key: "tool",
            title: "Tool",
            width: 120,
        },
        {
            key: "ruleName",
            title: "Rule Name",
            width: 300,
        },
        {
            key: "severity",
            title: "Severity",
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Critical", value: "critical" },
                { label: "High", value: "high" },
                { label: "Medium", value: "medium" },
                { label: "Low", value: "low" },
            ],
            width: 130,
            render: (value) => {
                const color =
                    value === "critical"
                        ? "#dc2626"
                        : value === "high"
                          ? "#f97316"
                          : value === "medium"
                            ? "#eab308"
                            : "#22c55e";
                return (
                    <span
                        style={{
                            backgroundColor: color + "20",
                            color,
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontWeight: 600,
                            textTransform: "capitalize",
                        }}
                    >
                        {value}
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
                { label: "Resolved", value: "resolved" },
            ],
            width: 130,
            render: (value) => (
                <span
                    style={{
                        color: value === "resolved" ? "#22c55e" : "#ef4444",
                        fontWeight: 600,
                        textTransform: "capitalize",
                    }}
                >
                    {value}
                </span>
            ),
        },
        {
            key: "type",
            title: "Type",
            width: 130,
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Bug", value: "bug" },
                { label: "Vulnerability", value: "vulnerability" },
                { label: "Code Smell", value: "code_smell" },
            ],
            render: (value) => (
                <span
                    style={{
                        backgroundColor: "#f3f4f6",
                        color: "#111827",
                        padding: "2px 6px",
                        borderRadius: "6px",
                        textTransform: "capitalize",
                    }}
                >
                    {value}
                </span>
            ),
        },
        {
            key: "owner",
            title: "Owner",
            filterable: true,
            width: 140,
        },
        {
            key: "filePath",
            title: "File Path",
            width: 220,
        },
        {
            key: "line",
            title: "Line",
            width: 70,
        },
        {
            key: "introducedAt",
            title: "Introduced At",
            width: 180,
            render: (value) => {
                if (!value) return "-";
                const date = new Date(value);
                return date.toLocaleString();
            },
        },
        {
            key: "fixedAt",
            title: "Fixed At",
            width: 180,
            render: (value) => {
                if (!value) return "-";
                const date = new Date(value);
                return date.toLocaleString();
            },
        },
    ];

    return (
        <Layout>
            <TableGrid
                columns={columns}
                data={secops}
                paginationMode="client"
                pageSizeOptions={[5, 10, 20]}
                maxHeight="60vh"
                maxWidth="100%"
            />
        </Layout>
    );
}
