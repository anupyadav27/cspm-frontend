"use client";

import Layout from "@/components/layout";
import TableGrid from "@/components/tableGrid";
import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/appContext";
import { fetchData } from "@/utils/fetchData";

export default function Assets() {
    const { dispatch } = useAppContext();
    const [assets, setAssets] = useState([]);

    const loadAssets = async (
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/assets/`,
        options = {}
    ) => {
        const { force = false, validate = false } = options;
        try {
            dispatch({ type: "SET_LOADING", payload: true });
            const data = await fetchData(url, { force, validate });
            setAssets(data?.data || []);
        } catch (error) {
            console.error("Error fetching assets:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    useEffect(() => {
        loadAssets();
    }, []);

    const handleEdit = (asset) => {
        alert(`Editing asset: ${asset.name}`);
    };

    const handleDelete = (asset) => {
        if (window.confirm(`Are you sure you want to delete ${asset.name}?`)) {
            setAssets((prev) => prev.filter((a) => a._id !== asset._id));
        }
    };

    const columns = [
        {
            key: "_id",
            title: "ID",
            width: 70,
            stick: true,
            render: (value) => value.slice(-6),
        },
        {
            key: "name",
            title: "Asset Name",
            searchable: true,
            width: 200,
            stick: true,
        },
        {
            key: "tenantId",
            title: "Tenant",
            width: 180,
            render: (value) => value?.name || "-",
            searchable: true,
        },
        {
            key: "resourceType",
            title: "Type",
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
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
                    {value?.toUpperCase()}
                </span>
            ),
        },
        {
            key: "provider",
            title: "Provider",
            width: 120,
            render: (value) => value?.toUpperCase() || "-",
        },
        {
            key: "region",
            title: "Region",
            width: 120,
            render: (value) => value?.toUpperCase() || "-",
        },
        {
            key: "environment",
            title: "Environment",
            width: 120,
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Development", value: "development" },
                { label: "Staging", value: "staging" },
                { label: "Production", value: "production" },
            ],
            render: (value) => value?.charAt(0).toUpperCase() + value?.slice(1) || "-",
        },
        {
            key: "lifecycleState",
            title: "Lifecycle",
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
                { label: "Terminated", value: "terminated" },
            ],
            render: (value) => {
                const color =
                    value === "active" ? "#22c55e" : value === "terminated" ? "#ef4444" : "#f59e0b";
                return (
                    <span style={{ color, fontWeight: 600 }}>
                        {value?.charAt(0).toUpperCase() + value?.slice(1)}
                    </span>
                );
            },
        },
        {
            key: "healthStatus",
            title: "Health",
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Critical", value: "critical" },
                { label: "Warning", value: "warning" },
                { label: "Healthy", value: "healthy" },
            ],
            render: (value) => {
                const color =
                    value === "critical" ? "#ef4444" : value === "warning" ? "#f59e0b" : "#22c55e";
                return (
                    <span style={{ color, fontWeight: 600 }}>
                        {value?.charAt(0).toUpperCase() + value?.slice(1)}
                    </span>
                );
            },
        },
        {
            key: "createdAt",
            title: "Created At",
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
        {
            key: "updatedAt",
            title: "Updated At",
            render: (value) => (value ? new Date(value).toLocaleString() : "-"),
        },
        {
            key: "actions",
            title: "Actions",
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
            <div className="w-auto h-20 flex items-center justify-center bg-white m-[3vh]">
                <p className="font-medium text-5xl">Assets</p>
            </div>
            <TableGrid
                columns={columns}
                data={assets}
                paginationMode="client"
                pageSizeOptions={[5, 10, 20]}
                maxHeight="60vh"
                maxWidth="100%"
            />
        </Layout>
    );
}
