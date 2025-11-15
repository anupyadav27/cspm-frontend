"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { useAppContext } from "@/context/appContext";
import { fetchData } from "@/utils/fetchData";
import TableGrid from "@/components/tableGrid";
import { useAuthActions } from "@/context/appContext/useAuthActions/index.jsx";

export default function Policies() {
    const { state, dispatch } = useAppContext();
    const { handleLogout } = useAuthActions();

    const [policies, setPolicies] = useState([]);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchFilters, setSearchFilters] = useState({});
    const [filterValues, setFilterValues] = useState({});
    const [paginationData, setPaginationData] = useState(null);

    const loadPolicies = async (options = {}) => {
        try {
            const { force = false, validate = false } = options;
            dispatch({ type: "SET_LOADING", payload: true });

            const queryParams = new URLSearchParams();

            queryParams.append("page", page);
            queryParams.append("pageSize", pageSize);

            for (const [key, value] of Object.entries(searchFilters)) {
                if (value && value.trim() !== "") {
                    let searchKey = key;
                    if (key === "tenantId") {
                        searchKey = "tenantId__name";
                    }
                    queryParams.append(`${searchKey}_search`, value.trim());
                }
            }

            for (const [key, value] of Object.entries(filterValues)) {
                if (value && value !== "") {
                    queryParams.append(key, value);
                }
            }

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/policies?${queryParams.toString()}`;
            const result = await fetchData(url, { force, validate });

            if (result?.logOut) {
                handleLogout(dispatch);
                return;
            }

            setPolicies(result?.data || []);
            setPaginationData(result?.pagination || null);
        } catch (error) {
            console.info("Error fetching Policies:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    useEffect(() => {
        loadPolicies({ force: false, validate: true });
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
            render: (value) => value?.slice(-6),
        },
        {
            key: "name",
            title: "Name",
            searchable: true,
            width: 200,
        },
        {
            key: "description",
            title: "Description",
            width: 300,
            searchable: true,
            render: (value) => (value?.length > 60 ? value.slice(0, 60) + "..." : value),
        },
        {
            key: "category",
            title: "Category",
            width: 140,
            filterable: true,
            filterOptions: [
                { label: "IAM", value: "IAM" },
                { label: "SCP", value: "SCP" },
                { label: "SecurityHub", value: "SecurityHub" },
                { label: "ConfigRule", value: "ConfigRule" },
                { label: "Custom", value: "Custom" },
            ],
        },
        {
            key: "type",
            title: "Type",
            width: 100,
        },
        {
            key: "document",
            title: "Rule",
            width: 300,
            render: (value) => value?.rule || "-",
        },
        {
            key: "version",
            title: "Version",
            width: 100,
        },
        {
            key: "validationStatus",
            title: "Validation Status",
            width: 160,
            filterable: true,
            filterOptions: [
                { label: "Valid", value: "valid" },
                { label: "Warning", value: "warning" },
                { label: "Error", value: "error" },
                { label: "Unknown", value: "unknown" },
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
                    {value || "unknown"}
                </span>
            ),
        },
        {
            key: "complianceStatus",
            title: "Compliance Status",
            width: 160,
            filterable: true,
            filterOptions: [
                { label: "Compliant", value: "compliant" },
                { label: "Non-Compliant", value: "non_compliant" },
                { label: "Unknown", value: "unknown" },
            ],
            render: (value) => (
                <span
                    style={{
                        color:
                            value === "compliant"
                                ? "#22c55e"
                                : value === "non_compliant"
                                  ? "#ef4444"
                                  : "#6b7280",
                        fontWeight: 600,
                        textTransform: "capitalize",
                    }}
                >
                    {value?.replace("_", " ") || "Unknown"}
                </span>
            ),
        },
        {
            key: "enforcedBy",
            title: "Enforced By",
            width: 140,
            filterable: true,
            filterOptions: [
                { label: "IAM", value: "IAM" },
                { label: "Config", value: "Config" },
                { label: "SecurityHub", value: "SecurityHub" },
                { label: "Manual", value: "Manual" },
            ],
        },
        {
            key: "enforcementStatus",
            title: "Enforcement Status",
            width: 160,
            filterable: true,
            filterOptions: [
                { label: "Enforced", value: "enforced" },
                { label: "Not Enforced", value: "not_enforced" },
                { label: "Partially Enforced", value: "partially_enforced" },
            ],
            render: (value) => (
                <span
                    style={{
                        color: value === "enforced" ? "#22c55e" : "#ef4444",
                        fontWeight: 600,
                        textTransform: "capitalize",
                    }}
                >
                    {value?.replace("_", " ") || "Not Enforced"}
                </span>
            ),
        },
        {
            key: "lastEvaluatedAt",
            title: "Last Evaluated At",
            width: 180,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
        {
            key: "createdAt",
            title: "Created At",
            width: 180,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
        {
            key: "updatedAt",
            title: "Updated At",
            width: 180,
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
    ];

    return (
        <Layout>
            <TableGrid
                columns={columns}
                data={policies}
                paginationMode="server"
                controlledPage={page}
                controlledPageSize={pageSize}
                onPageChange={(p) => setPage(p)}
                onPageSizeChange={(s) => setPageSize(s)}
                totalCount={paginationData?.total}
                onSearch={handleColumnSearch}
                onFilter={handleFilterChange}
                pageSizeOptions={[5, 10, 20]}
                maxHeight="60vh"
                maxWidth="100%"
                renderNoData={() => "No Policies Found"}
            />
        </Layout>
    );
}
