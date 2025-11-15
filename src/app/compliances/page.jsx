"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { useAppContext } from "@/context/appContext";
import { fetchData } from "@/utils/fetchData";
import TableGrid from "@/components/tableGrid";

export default function Compliances() {
    const { dispatch } = useAppContext();

    const [compliances, setCompliances] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchFilters, setSearchFilters] = useState({});
    const [filterValues, setFilterValues] = useState({});
    const [paginationData, setPaginationData] = useState(null);

    const loadCompliances = async () => {
        try {
            dispatch({ type: "SET_LOADING", payload: true });

            const queryParams = new URLSearchParams();

            queryParams.append("page", page);
            queryParams.append("pageSize", pageSize);

            for (const [key, value] of Object.entries(searchFilters)) {
                if (value?.trim()) {
                    queryParams.append(`${key}_search`, value.trim());
                }
            }

            for (const [key, value] of Object.entries(filterValues)) {
                if (value) {
                    queryParams.append(key, value);
                }
            }

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/compliances?${queryParams.toString()}`;
            const result = await fetchData(url);

            if (result?.data) {
                setCompliances(result.data);
            }
            if (result?.pagination) {
                setPaginationData(result.pagination);
            }
        } catch (error) {
            console.info("Error fetching compliances:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    useEffect(() => {
        loadCompliances();
    }, [page, pageSize, searchFilters, filterValues]);

    const handleColumnSearch = ({ key, value }) => {
        setSearchFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterChange = ({ key, value }) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

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
            stick: true,
            render: (value) => value?.slice(-6) || "-",
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
                { label: "Custom", value: "Custom" },
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
                { label: "Not Applicable", value: "not_applicable" },
                { label: "Unknown", value: "unknown" },
            ],
            render: (value) => {
                const config = {
                    compliant: { text: "Compliant", color: "#22c55e", bg: "#dcfce7" },
                    non_compliant: { text: "Non-Compliant", color: "#ef4444", bg: "#fee2e2" },
                    not_applicable: { text: "N/A", color: "#6b7280", bg: "#f3f4f6" },
                    unknown: { text: "Unknown", color: "#9ca3af", bg: "#f3f4f6" },
                }[value] || { text: "-", color: "#333", bg: "#f4f4f4" };

                return (
                    <span
                        style={{
                            backgroundColor: config.bg,
                            color: config.color,
                            padding: "3px 6px",
                            borderRadius: "6px",
                            fontWeight: 600,
                            fontSize: "12px",
                        }}
                    >
                        {config.text}
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
                const colorMap = {
                    low: "#16a34a",
                    medium: "#f59e0b",
                    high: "#dc2626",
                    critical: "#991b1b",
                };
                const display = value ? value.charAt(0).toUpperCase() + value.slice(1) : "-";
                return (
                    <span style={{ color: colorMap[value] || "#444", fontWeight: 600 }}>
                        {display}
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
                return new Date(value).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                });
            },
        },
        {
            key: "actions",
            title: "Actions",
            width: 140,
            render: (value, row) => (
                <div className="rtg-cell flex gap-1">
                    <button
                        className="rtg__btn rtg__btn--edit text-xs px-2 py-1"
                        onClick={() => handleView(row)}
                    >
                        View
                    </button>
                    <button
                        className="rtg__btn rtg__btn--delete text-xs px-2 py-1"
                        onClick={() => handleDelete(row)}
                    >
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
                paginationMode="server"
                controlledPage={page}
                controlledPageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                totalCount={paginationData?.total}
                onSearch={handleColumnSearch}
                onFilter={handleFilterChange}
                pageSizeOptions={[5, 10, 20, 50]}
                maxHeight="65vh"
                maxWidth="100%"
                renderNoData={() => "No compliance controls found"}
            />
        </Layout>
    );
}
