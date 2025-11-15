"use client";

import Layout from "@/components/layout";
import TableGrid from "@/components/tableGrid";
import React, { useEffect, useRef, useState } from "react";
import { useAppContext } from "@/context/appContext";
import { fetchData } from "@/utils/fetchData";
import Button from "@/components/button/index.jsx";
import { FaDownload } from "react-icons/fa";
import { ProgressLoader } from "@/components/loaders/index.jsx";

export default function Assets() {
    const { dispatch } = useAppContext();

    const [assets, setAssets] = useState([]);
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
        return `${process.env.NEXT_PUBLIC_API_URL}/api/assets/export?${queryParams.toString()}`;
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

    const loadAssets = async (options = {}) => {
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

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/assets?${queryParams.toString()}`;
            const result = await fetchData(url, { force, validate });

            if (result?.data) {
                setAssets(result.data);
            }
            if (result?.pagination) {
                setPaginationData(result.pagination);
            }
        } catch (error) {
            console.info("Error fetching assets:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    useEffect(() => {
        loadAssets({ validate: true });
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

    const handleEdit = (asset) => {
        alert(`Editing asset: ${asset.name}`);
    };

    const handleDelete = (asset) => {
        if (window.confirm(`Are you sure you want to delete ${asset.name}?`)) {
            setAssets((prev) => prev.filter((a) => a.id !== asset.id));
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
            key: "name",
            title: "Asset Name",
            searchable: true,
            sortable: true,
            width: 200,
            stick: true,
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
            key: "resource_type",
            title: "Type",
            filterable: false,
            searchable: true,
            sortable: true,
            filterOptions: [
                { label: "VM", value: "vm" },
                { label: "S3", value: "s3" },
                { label: "Bucket", value: "bucket" },
            ],
            render: (value) => (
                <span
                    style={{
                        backgroundColor: value === "vm" ? "#f0f7ff" : "#fef7e6",
                        color: value === "vm" ? "#0b62a8" : "#9c6b00",
                        padding: "2px 6px",
                        borderRadius: "6px",
                        fontSize: "12px",
                    }}
                >
                    {value?.toUpperCase() || "-"}
                </span>
            ),
        },
        {
            key: "provider",
            title: "Provider",
            width: 120,
            filterable: true,
            sortable: true,
            filterOptions: [
                { label: "AWS", value: "aws" },
                { label: "Azure", value: "azure" },
                { label: "GCP", value: "gcp" },
                { label: "On-Prem", value: "on_prem" },
            ],
            render: (value) => value?.toUpperCase() || "-",
        },
        {
            key: "region",
            title: "Region",
            width: 120,
            searchable: true,
            sortable: true,
            render: (value) => value?.toUpperCase() || "-",
        },
        {
            key: "environment",
            title: "Environment",
            width: 120,
            filterable: true,
            sortable: true,
            filterOptions: [
                { label: "Development", value: "development" },
                { label: "Staging", value: "staging" },
                { label: "Production", value: "production" },
                { label: "Test", value: "test" },
            ],
            render: (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "-"),
        },
        {
            key: "lifecycle_state",
            title: "Lifecycle",
            filterable: true,
            sortable: true,
            filterOptions: [
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
                { label: "Terminated", value: "terminated" },
                { label: "Decommissioned", value: "decommissioned" },
            ],
            render: (value) => {
                const color =
                    value === "active"
                        ? "#22c55e"
                        : value === "terminated" || value === "decommissioned"
                          ? "#ef4444"
                          : "#f59e0b";
                return (
                    <span style={{ color, fontWeight: 600 }}>
                        {value ? value.charAt(0).toUpperCase() + value.slice(1) : "-"}
                    </span>
                );
            },
        },
        {
            key: "health_status",
            title: "Health",
            filterable: true,
            sortable: true,
            filterOptions: [
                { label: "Healthy", value: "healthy" },
                { label: "Warning", value: "warning" },
                { label: "Critical", value: "critical" },
                { label: "Unknown", value: "unknown" },
            ],
            render: (value) => {
                const color =
                    value === "critical"
                        ? "#ef4444"
                        : value === "warning"
                          ? "#f59e0b"
                          : value === "healthy"
                            ? "#22c55e"
                            : "#9ca3af";
                return (
                    <span style={{ color, fontWeight: 600 }}>
                        {value ? value.charAt(0).toUpperCase() + value.slice(1) : "-"}
                    </span>
                );
            },
        },
        {
            key: "created_at",
            title: "Created At",
            width: 160,
            sortable: true,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
        {
            key: "updated_at",
            title: "Updated At",
            width: 160,
            sortable: true,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
    ];

    return (
        <Layout>
            <TableGrid
                columns={columns}
                data={assets}
                paginationMode="server"
                controlledPage={page}
                controlledPageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                totalCount={paginationData?.total}
                onSearch={handleColumnSearch}
                onFilter={handleFilterChange}
                onSort={handleSort}
                pageSizeOptions={[10, 20, 50]}
                maxHeight="60vh"
                maxWidth="100%"
                renderNoData={() => "No assets found"}
            />
            <div className="reports-main-container">
                <div className="report__container-exportbtn">
                    <Button
                        onClick={() => downloadFile("pdf")}
                        disabled={downloadProgress.isDownloading}
                        text={
                            downloadProgress.isDownloading && docType === "pdf"
                                ? "Exporting..."
                                : "Download as PDF"
                        }
                        danger
                        iconRight={<FaDownload />}
                    />

                    <Button
                        onClick={() => downloadFile("xlsx")}
                        disabled={downloadProgress.isDownloading}
                        text={
                            downloadProgress.isDownloading && docType === "xlsx"
                                ? "Exporting..."
                                : "Download as Excel"
                        }
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
