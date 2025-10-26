"use client";
import Layout from "@/components/layout";
import TableGrid from "@/components/tableGrid";
import React, { useEffect, useState } from "react";
import { useAppContext } from "@/context/appContext";

export default function Tenants() {
    const { state, dispatch } = useAppContext();
    const [tenants, setTenants] = useState([]);

    useEffect(() => {
        setTenants(state?.tenants?.data);
        dispatch({ type: "SET_LOADING", payload: false });
    }, []);

    const handleEdit = (tenant) => {
        alert(`Editing tenant: ${tenant.name}`);
    };

    const handleDelete = (tenant) => {
        if (window.confirm(`Are you sure you want to delete ${tenant.name}?`)) {
            setTenants((prev) => prev.filter((t) => t._id !== tenant._id));
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
            title: "Tenant Name",
            searchable: true,
            width: 180,
            stick: true,
        },
        {
            key: "plan",
            title: "Plan",
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Standard", value: "standard" },
                { label: "Enterprise", value: "enterprise" },
            ],
            render: (value) => (
                <span
                    style={{
                        backgroundColor: value === "enterprise" ? "#e6f3ff" : "#fef7e6",
                        color: value === "enterprise" ? "#0b62a8" : "#9c6b00",
                        padding: "2px 6px",
                        borderRadius: "6px",
                        fontSize: "12px",
                    }}
                >
                    {value?.charAt(0).toUpperCase() + value?.slice(1)}
                </span>
            ),
        },
        {
            key: "status",
            title: "Status",
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Active", value: "active" },
                { label: "Inactive", value: "inactive" },
            ],
            render: (value) => (
                <span
                    style={{
                        color: value === "active" ? "#22c55e" : "#ef4444",
                        fontWeight: 600,
                    }}
                >
                    {value?.charAt(0).toUpperCase() + value?.slice(1)}
                </span>
            ),
        },
        {
            key: "region",
            title: "Region",
            width: 120,
            render: (value) => value?.toUpperCase() || "-",
        },
        {
            key: "contactEmail",
            title: "Contact Email",
            width: 200,
        },
        {
            key: "settings",
            title: "SSO / Theme",
            width: 180,
            render: (value) => {
                const sso = value?.security?.ssoEnabled ? "SSO Enabled" : "SSO Disabled";
                const color = value?.branding?.themeColor || "#ccc";
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div
                            style={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                background: color,
                            }}
                        ></div>
                        <span style={{ fontSize: "12px" }}>{sso}</span>
                    </div>
                );
            },
        },
        {
            key: "billing",
            title: "Payment Status",
            width: 150,
            render: (value) => (
                <span
                    style={{
                        color: value?.paymentStatus === "active" ? "#22c55e" : "#ef4444",
                        fontWeight: 600,
                    }}
                >
                    {value?.paymentStatus || "-"}
                </span>
            ),
        },
        {
            key: "createdAt",
            title: "Created",
            render: (value) => (value ? new Date(value).toLocaleDateString() : "-"),
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
                <p className="font-medium text-5xl">Tenants</p>
            </div>

            <TableGrid
                columns={columns}
                data={tenants}
                paginationMode="client"
                pageSizeOptions={[5, 10]}
                maxHeight="60vh"
                maxWidth="100%"
            />
        </Layout>
    );
}
