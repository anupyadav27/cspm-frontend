"use client";

import React, { useEffect, useRef, useState } from "react";
import Layout from "@/components/layout";
import { useAppContext } from "@/context/appContext";
import { fetchData } from "@/utils/fetchData";
import TableGrid from "@/components/tableGrid";
import { useAuthActions } from "@/context/appContext/useAuthActions";
import { ProgressLoader } from "@/components/loaders";
import Button from "@/components/button";
import { FaDownload } from "react-icons/fa";

export default function Reports() {
    const { dispatch } = useAppContext();
    const { handleLogout } = useAuthActions();

    const [reports, setReports] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchFilters, setSearchFilters] = useState({});
    const [filterValues, setFilterValues] = useState({});
    const [paginationData, setPaginationData] = useState(null);

    const [downloadProgress, setDownloadProgress] = useState({ isDownloading: false, progress: 0 });

    const searchFiltersRef = useRef(searchFilters);
    const filterValuesRef = useRef(filterValues);
    useEffect(() => {
        searchFiltersRef.current = searchFilters;
        filterValuesRef.current = filterValues;
    }, [searchFilters, filterValues]);

    const buildExportUrl = (doctype) => {
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

        queryParams.append("doctype", doctype);
        return `${process.env.NEXT_PUBLIC_API_URL}/api/reports/export?${queryParams.toString()}`;
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
            const fileName = `reports_export_${new Date().toISOString().split("T")[0]}.${extension}`;

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

    const loadReports = async (options = {}) => {
        const { force = false, validate = false } = options;
        try {
            dispatch({ type: "SET_LOADING", payload: true });

            const queryParams = new URLSearchParams();

            queryParams.append("page", String(page));
            queryParams.append("pageSize", String(pageSize));

            for (const [key, value] of Object.entries(searchFilters)) {
                if (value?.trim()) {
                    queryParams.append(`${key}_search`, value.trim());
                }
            }

            for (const [key, value] of Object.entries(filterValues)) {
                if (value !== undefined && value !== null && value !== "") {
                    queryParams.append(key, String(value));
                }
            }

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/reports?${queryParams.toString()}`;
            const result = await fetchData(url, { force, validate });

            if (result?.logOut) {
                handleLogout(dispatch);
                return;
            }

            if (result?.data) {
                setReports(result.data);
            }
            if (result?.pagination) {
                setPaginationData(result.pagination);
            }
        } catch (error) {
            console.info("Error fetching Reports:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    useEffect(() => {
        loadReports({ validate: true });
    }, [page, pageSize, searchFilters, filterValues]);

    const handleColumnSearch = ({ key, value }) => {
        setSearchFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleFilterChange = ({ key, value }) => {
        setFilterValues((prev) => ({ ...prev, [key]: value }));
    };

    const columns = [
        {
            key: "_id",
            title: "ID",
            width: 90,
            stick: true,
            render: (value) => value?.slice(-6) || "-",
        },
        {
            key: "tenantId",
            title: "Tenant",
            width: 180,
            render: (value) => value?.name || "-",
        },
        {
            key: "title",
            title: "Title",
            searchable: true,
            width: 250,
        },
        {
            key: "description",
            title: "Description",
            searchable: true,
            width: 300,
            render: (value) => {
                if (!value) return "-";
                return value.length > 60 ? value.slice(0, 60) + "..." : value;
            },
        },
        {
            key: "type",
            title: "Type",
            filterable: true,
            width: 160,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Compliance", value: "compliance" },
                { label: "Security Posture", value: "security_posture" },
                { label: "Vulnerability", value: "vulnerability" },
                { label: "Audit", value: "audit" },
                { label: "Custom", value: "custom" },
            ],
            render: (value) => (
                <span
                    style={{
                        backgroundColor: value === "compliance" ? "#e0f2fe" : "#f0fdf4",
                        color: value === "compliance" ? "#0284c7" : "#16a34a",
                        padding: "2px 6px",
                        borderRadius: "6px",
                        textTransform: "capitalize",
                    }}
                >
                    {value?.replace(/_/g, " ") || "-"}
                </span>
            ),
        },
        {
            key: "format",
            title: "Format",
            filterable: true,
            width: 100,
            filterOptions: [
                { label: "All", value: "" },
                { label: "PDF", value: "pdf" },
                { label: "CSV", value: "csv" },
                { label: "JSON", value: "json" },
                { label: "XLSX", value: "xlsx" },
            ],
            render: (value) => (
                <span
                    style={{
                        backgroundColor: "#f3f4f6",
                        color: "#111827",
                        padding: "2px 6px",
                        borderRadius: "6px",
                        textTransform: "uppercase",
                    }}
                >
                    {value || "-"}
                </span>
            ),
        },
        {
            key: "generatedBy",
            title: "Generated By",
            width: 200,
            render: (value) => {
                if (!value) return "-";
                const name = value.name
                    ? `${value.name.first || ""} ${value.name.last || ""}`.trim()
                    : value.email?.split("@")[0] || "-";
                return `${name} (${value.email ? value.email.split("@")[0] : "?"})`;
            },
        },
        {
            key: "scheduled",
            title: "Scheduled",
            filterable: true,
            width: 120,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Yes", value: "true" },
                { label: "No", value: "false" },
            ],
            render: (value) => (
                <span style={{ color: value ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                    {value ? "Yes" : "No"}
                </span>
            ),
        },
        {
            key: "status",
            title: "Status",
            filterable: true,
            width: 130,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Pending", value: "pending" },
                { label: "Completed", value: "completed" },
                { label: "Failed", value: "failed" },
            ],
            render: (value) => {
                const config = {
                    completed: { text: "Completed", color: "#22c55e", bg: "#dcfce7" },
                    failed: { text: "Failed", color: "#ef4444", bg: "#fee2e2" },
                    pending: { text: "Pending", color: "#eab308", bg: "#fef9c3" },
                }[value] || { text: "-", color: "#333", bg: "#f4f4f4" };

                return (
                    <span
                        style={{
                            backgroundColor: config.bg,
                            color: config.color,
                            padding: "2px 6px",
                            borderRadius: "6px",
                            fontWeight: 600,
                        }}
                    >
                        {config.text}
                    </span>
                );
            },
        },
        {
            key: "triggeredByAutomation",
            title: "Automation",
            filterable: true,
            width: 120,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Yes", value: "true" },
                { label: "No", value: "false" },
            ],
            render: (value) => (
                <span style={{ color: value ? "#16a34a" : "#71717a", fontWeight: 500 }}>
                    {value ? "Yes" : "No"}
                </span>
            ),
        },
        {
            key: "generatedAt",
            title: "Generated At",
            width: 170,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
        {
            key: "createdAt",
            title: "Created At",
            width: 170,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
        {
            key: "updatedAt",
            title: "Updated At",
            width: 170,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
        {
            key: "relatedAssets",
            title: "Assets",
            width: 90,
            render: (value) => (Array.isArray(value) ? value.length : 0),
        },
        {
            key: "relatedPolicies",
            title: "Policies",
            width: 100,
            render: (value) => (Array.isArray(value) ? value.length : 0),
        },
        {
            key: "relatedCompliance",
            title: "Compliance",
            width: 110,
            render: (value) => (Array.isArray(value) ? value.length : 0),
        },
        {
            key: "fileUrl",
            title: "Download",
            width: 120,
            render: (value) =>
                value ? (
                    <a
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        View
                    </a>
                ) : (
                    "-"
                ),
        },
    ];

    return (
        <Layout>
            <TableGrid
                columns={columns}
                data={reports}
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
                renderNoData={() => "No reports found"}
            />
            <div className="reports-main-container">
                <div className="report__container-exportbtn">
                    <Button
                        onClick={() => downloadFile("pdf")}
                        disabled={downloadProgress.isDownloading}
                        text={downloadProgress.isDownloading ? "Exporting..." : "Download as PDF"}
                        danger
                        iconRight={<FaDownload />}
                    />

                    <Button
                        onClick={() => downloadFile("xlsx")}
                        disabled={downloadProgress.isDownloading}
                        text={downloadProgress.isDownloading ? "Exporting..." : "Download as Excel"}
                        success
                        iconRight={<FaDownload />}
                    />
                </div>

                {downloadProgress.isDownloading && (
                    <div className="progress__loader-container">
                        <ProgressLoader
                            value={downloadProgress.progress}
                            max={100}
                            color={`success`}
                            showLabel={true}
                        />
                    </div>
                )}
            </div>
        </Layout>
    );
}
