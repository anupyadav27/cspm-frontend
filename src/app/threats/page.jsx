"use client";

import Layout from "@/components/layout";
import TableGrid from "@/components/tableGrid";
import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "@/context/appContext";
import { fetchData } from "@/utils/fetchData";
import Button from "@/components/button/index.jsx";
import {
    FaBug,
    FaShieldAlt,
    FaExclamationTriangle,
    FaDatabase,
    FaNetworkWired,
    FaDownload,
    FaSearch,
} from "react-icons/fa";
import { ProgressLoader } from "@/components/loaders/index.jsx";

export default function Threats() {
    const { dispatch } = useAppContext();

    const [threats, setThreats] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchFilters, setSearchFilters] = useState({});
    const [filterValues, setFilterValues] = useState({});
    const [sortConfig, setSortConfig] = useState({ sortBy: null, order: null });
    const [paginationData, setPaginationData] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState({ isDownloading: false, progress: 0 });
    const [docType, setDocType] = useState("xlsx");

    const searchFiltersRef = useRef(searchFilters);
    const filterValuesRef = useRef(filterValues);
    useEffect(() => {
        searchFiltersRef.current = searchFilters;
        filterValuesRef.current = filterValues;
    }, [searchFilters, filterValues]);

    const buildExportUrl = (doctype) => {
        setDocType(doctype);
        const queryParams = new URLSearchParams();

        for (const [key, value] of Object.entries(searchFiltersRef.current)) {
            if (value?.trim()) {
                queryParams.append(`${key}_search`, value.trim());
            }
        }

        for (const [key, value] of Object.entries(filterValuesRef.current)) {
            if (value !== undefined && value !== null && value !== "") {
                queryParams.append(key, String(value));
            }
        }
        if (sortConfig.sortBy) {
            queryParams.append("sort_by", sortConfig.sortBy);
            queryParams.append("order", sortConfig.order?.toLowerCase() || "asc");
        }

        queryParams.append("doctype", doctype);
        return `${process.env.NEXT_PUBLIC_API_URL}/api/threats/export?${queryParams.toString()}`;
    };

    const downloadFile = async (doctype) => {
        setDownloadProgress({ isDownloading: true, progress: 0 });
        try {
            const url = buildExportUrl(doctype);

            const progressInterval = setInterval(() => {
                setDownloadProgress((prev) => {
                    const newProgress = Math.min(prev.progress + 5, 95);
                    return { isDownloading: true, progress: newProgress };
                });
            }, 200);

            const response = await fetch(url, {
                method: "GET",
                credentials: "include",
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.info("Export failed:", error);
                alert("Failed to generate export. Please try again.");
                setDownloadProgress({ isDownloading: false, progress: 0 });
                return;
            }

            const contentLength = response.headers.get("Content-Length");
            const total = parseInt(contentLength, 10);
            let loaded = 0;

            const reader = response.body.getReader();
            const chunks = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                loaded += value.length;
                if (total) {
                    const progress = Math.round((loaded * 100) / total);
                    setDownloadProgress({ isDownloading: true, progress });
                }
            }
            reader.releaseLock();

            const blob = new Blob(chunks);
            const extension = doctype === "pdf" ? "pdf" : "xlsx";
            const fileName = `threats_export_${new Date().toISOString().split("T")[0]}.${extension}`;

            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            setDownloadProgress({ isDownloading: false, progress: 100 });
            setTimeout(() => setDownloadProgress({ isDownloading: false, progress: 0 }), 1000);
        } catch (error) {
            console.info("Download error:", error);
            alert("Download failed. Please try again.");
        } finally {
            if (downloadProgress.isDownloading) {
                setDownloadProgress({ isDownloading: false, progress: 0 });
            }
        }
    };

    const loadThreats = async (options = {}) => {
        const { force = false, validate = false } = options;
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

            if (sortConfig.sortBy && sortConfig.order) {
                queryParams.append("sort_by", sortConfig.sortBy);
                queryParams.append("order", sortConfig.order.toLowerCase());
            }

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/threats?${queryParams.toString()}`;
            const result = await fetchData(url, { force, validate });

            if (result?.data) {
                setThreats(result.data);
            }
            if (result?.pagination) {
                setPaginationData(result.pagination);
            }
        } catch (error) {
            console.info("Error fetching threats:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    useEffect(() => {
        loadThreats({ validate: true });
    }, [page, pageSize, searchFilters, filterValues, sortConfig]);

    const handleColumnSearch = ({ key, value }) => {
        setSearchFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterChange = ({ key, value }) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const handleSort = ({ sortBy, order }) => {
        setSortConfig({ sortBy, order });
    };

    const handleEdit = (threat) => {
        alert(`Editing threat: ${threat.title || threat.name}`);
    };

    const handleDelete = (threat) => {
        if (
            window.confirm(`Are you sure you want to delete threat ${threat.title || threat.name}?`)
        ) {
            setThreats((prev) => prev.filter((t) => t.id !== threat.id));
        }
    };

    const getIconForType = (type) => {
        switch (type?.toLowerCase()) {
            case "malware":
            case "trojan":
                return <FaBug className="text-red-500" />;
            case "ddos":
                return <FaExclamationTriangle className="text-orange-500" />;
            case "unauthorized_access":
            case "privilege_escalation":
                return <FaShieldAlt className="text-purple-500" />;
            case "data_exfiltration":
                return <FaDatabase className="text-green-500" />;
            case "network_intrusion":
                return <FaNetworkWired className="text-blue-500" />;
            default:
                return <FaBug className="text-gray-500" />;
        }
    };

    const columns = [
        {
            key: "id",
            title: "ID",
            width: 70,
            stick: true,
            sortable: true,
            render: (value) => value?.slice(-6) || "-",
        },
        {
            key: "title",
            title: "Threat Title",
            searchable: true,
            sortable: true,
            width: 220,
            stick: true,
            render: (value, row) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 500 }}>{value || row.name || "-"}</span>
                </div>
            ),
        },
        {
            key: "tenant_id",
            title: "Tenant ID",
            searchable: true,
            sortable: true,
            width: 180,
            render: (value) => value?.slice(-6) || "-",
        },
        {
            key: "tenants__name",
            title: "Tenant Name",
            searchable: true,
            sortable: true,
            width: 180,
        },
        {
            key: "severity",
            title: "Severity",
            filterable: true,
            sortable: true,
            filterOptions: [
                { label: "Critical", value: "critical" },
                { label: "High", value: "high" },
                { label: "Medium", value: "medium" },
                { label: "Low", value: "low" },
            ],
            render: (value) => {
                const severity = value?.toLowerCase() || "";
                let bgColor = "#e5e7eb";
                let color = "#374151";

                switch (severity) {
                    case "critical":
                        bgColor = "#fee2e2";
                        color = "#dc2626";
                        return (
                            <span
                                style={{
                                    backgroundColor: bgColor,
                                    color: color,
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <FaExclamationTriangle />
                                {value?.toUpperCase() || "-"}
                            </span>
                        );
                    case "high":
                        bgColor = "#fef3c7";
                        color = "#b45309";
                        return (
                            <span
                                style={{
                                    backgroundColor: bgColor,
                                    color: color,
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <FaExclamationTriangle />
                                {value?.toUpperCase() || "-"}
                            </span>
                        );
                    case "medium":
                        bgColor = "#e5e7eb";
                        color = "#374151";
                        return (
                            <span
                                style={{
                                    backgroundColor: bgColor,
                                    color: color,
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <FaBug />
                                {value?.toUpperCase() || "-"}
                            </span>
                        );
                    case "low":
                        bgColor = "#dcfce7";
                        color = "#166534";
                        return (
                            <span
                                style={{
                                    backgroundColor: bgColor,
                                    color: color,
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                <FaShieldAlt />
                                {value?.toUpperCase() || "-"}
                            </span>
                        );
                    default:
                        bgColor = "#e5e7eb";
                        color = "#374151";
                }

                return (
                    <span
                        style={{
                            backgroundColor: bgColor,
                            color: color,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                        }}
                    >
                        {value?.toUpperCase() || "-"}
                    </span>
                );
            },
        },
        {
            key: "description",
            title: "Description",
            searchable: true,
            sortable: false,
            width: 300,
            render: (value) => (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FaSearch style={{ color: "#9ca3af", fontSize: "12px" }} />
                    <span style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.4" }}>
                        {value?.substring(0, 80) || "-"}
                        {value?.length > 80 ? "..." : ""}
                    </span>
                </div>
            ),
        },
        {
            key: "status",
            title: "Status",
            filterable: true,
            sortable: true,
            filterOptions: [
                { label: "Active", value: "active" },
                { label: "Investigating", value: "investigating" },
                { label: "Resolved", value: "resolved" },
                { label: "False Positive", value: "false_positive" },
            ],
            render: (value) => {
                const status = value?.toLowerCase() || "";
                let bgColor = "#e5e7eb";
                let color = "#374151";

                switch (status) {
                    case "active":
                        bgColor = "#fef3c7";
                        color = "#b45309";
                        break;
                    case "investigating":
                        bgColor = "#dbeafe";
                        color = "#1d4ed8";
                        break;
                    case "resolved":
                        bgColor = "#dcfce7";
                        color = "#166534";
                        break;
                    case "false_positive":
                        bgColor = "#ede9fe";
                        color = "#7e22ce";
                        break;
                    default:
                        bgColor = "#e5e7eb";
                        color = "#374151";
                }

                return (
                    <span
                        style={{
                            backgroundColor: bgColor,
                            color: color,
                            padding: "4px 8px",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                        }}
                    >
                        {value ? value.charAt(0).toUpperCase() + value.slice(1) : "-"}
                    </span>
                );
            },
        },
        // {
        //     key: "type",
        //     title: "Type",
        //     filterable: true,
        //     searchable: true,
        //     sortable: true,
        //     filterOptions: [
        //         { label: "Malware", value: "malware" },
        //         { label: "DDoS", value: "ddos" },
        //         { label: "Unauthorized Access", value: "unauthorized_access" },
        //         { label: "Data Exfiltration", value: "data_exfiltration" },
        //         { label: "Network Intrusion", value: "network_intrusion" },
        //         { label: "Privilege Escalation", value: "privilege_escalation" },
        //     ],
        //     render: (value) => {
        //         const type = value?.toLowerCase() || "";
        //         let bgColor = "#e5e7eb";
        //         let color = "#374151";
        //
        //         switch (type) {
        //             case "malware":
        //             case "trojan":
        //                 bgColor = "#fee2e2";
        //                 color = "#dc2626";
        //                 break;
        //             case "ddos":
        //                 bgColor = "#fef3c7";
        //                 color = "#b45309";
        //                 break;
        //             case "unauthorized_access":
        //             case "privilege_escalation":
        //                 bgColor = "#dbeafe";
        //                 color = "#1d4ed8";
        //                 break;
        //             case "data_exfiltration":
        //                 bgColor = "#dcfce7";
        //                 color = "#166534";
        //                 break;
        //             case "network_intrusion":
        //                 bgColor = "#ede9fe";
        //                 color = "#7e22ce";
        //                 break;
        //             default:
        //                 bgColor = "#e5e7eb";
        //                 color = "#374151";
        //         }
        //
        //         return (
        //             <span
        //                 style={{
        //                     backgroundColor: bgColor,
        //                     color: color,
        //                     padding: "4px 8px",
        //                     borderRadius: "6px",
        //                     fontSize: "12px",
        //                     fontWeight: 600,
        //                     display: "inline-flex",
        //                     alignItems: "center",
        //                     gap: "4px",
        //                 }}
        //             >
        //                 {getIconForType(type)}
        //                 {value?.toUpperCase() || "-"}
        //             </span>
        //         );
        //     },
        // },
        // {
        //     key: "region",
        //     title: "Region",
        //     width: 120,
        //     searchable: true,
        //     sortable: true,
        //     render: (value) => value?.toUpperCase() || "-",
        // // },
        // {
        //     key: "confidence",
        //     title: "Confidence",
        //     width: 100,
        //     sortable: true,
        //     render: (value) => {
        //         if (value === null || value === undefined) return "-";
        //         const confidence = parseInt(value);
        //         let color = "#10b981"; // Default green for low scores
        //         if (confidence >= 90)
        //             color = "#dc2626"; // Red for high confidence
        //         else if (confidence >= 70)
        //             color = "#f59e0b"; // Yellow for medium
        //         else if (confidence >= 50) color = "#fbbf24"; // Amber for low-medium
        //
        //         return (
        //             <span style={{ color, fontWeight: 600, fontSize: "14px" }}>{confidence}%</span>
        //         );
        //     },
        // },
        {
            key: "created_at",
            title: "Detected At",
            width: 160,
            sortable: true,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
        {
            key: "updated_at",
            title: "Last Updated",
            width: 160,
            sortable: true,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
    ];

    return (
        <Layout>
            <TableGrid
                columns={columns}
                data={threats}
                paginationMode="server"
                controlledPage={page}
                controlledPageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                totalCount={paginationData?.total}
                onSearch={handleColumnSearch}
                onFilter={handleFilterChange}
                onSort={handleSort}
                pageSizeOptions={[10, 20, 50, 100]}
                maxHeight="60vh"
                maxWidth="100%"
                renderNoData={() => (
                    <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                        <FaBug size={48} style={{ margin: "0 auto 16px", color: "#d1d5db" }} />
                        <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
                            No Threats Found
                        </h3>
                        <p>There are currently no threats matching your search criteria.</p>
                    </div>
                )}
            />

            <div className="threats__main-container">
                <div className="threats__container-exportbtn">
                    <Button
                        onClick={() => downloadFile("pdf")}
                        disabled={downloadProgress.isDownloading}
                        text={
                            downloadProgress.isDownloading && docType === "pdf"
                                ? "Exporting PDF..."
                                : "Download PDF"
                        }
                        danger
                        iconRight={<FaDownload />}
                    />

                    <Button
                        onClick={() => downloadFile("xlsx")}
                        disabled={downloadProgress.isDownloading}
                        text={
                            downloadProgress.isDownloading && docType === "xlsx"
                                ? "Exporting Excel..."
                                : "Download Excel"
                        }
                        success
                        iconRight={<FaDownload />}
                    />
                </div>

                {downloadProgress.isDownloading && (
                    <div
                        className="progress__loader-container"
                        style={{ maxWidth: "500px", margin: "0 auto" }}
                    >
                        <ProgressLoader
                            value={downloadProgress.progress}
                            max={100}
                            color={`success`}
                            showLabel={true}
                        />
                    </div>
                )}
            </div>
            {JSON.stringify(threats[0], null, 2)}
        </Layout>
    );
}
