"use client";

import React, { useEffect, useState } from "react";
import Layout from "@/components/layout";
import { useAppContext } from "@/context/appContext";
import { fetchData } from "@/utils/fetchData";
import TableGrid from "@/components/tableGrid";

export default function Users() {
    const { state, dispatch } = useAppContext();
    const [users, setUsers] = useState([]);

    const loadUsers = async (
        url = `${process.env.NEXT_PUBLIC_API_URL}/api/users/`,
        options = {}
    ) => {
        const { force = false, validate = false } = options;
        try {
            dispatch({ type: "SET_LOADING", payload: true });
            const data = await fetchData(url, { force, validate });
            setUsers(data?.data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            dispatch({ type: "SET_LOADING", payload: false });
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const handleEdit = (user) => {
        alert(`Editing user: ${user.email}`);
    };

    const handleDelete = (user) => {
        if (window.confirm(`Are you sure you want to delete ${user.email}?`)) {
            setUsers((prev) => prev.filter((u) => u._id !== user._id));
        }
    };
    const handleRefresh = () => {};
    const handleAddUser = () => {};
    const columns = [
        {
            key: "_id",
            title: "User ID",
            width: 80,
            render: (value) => value?.slice(-6),
        },
        {
            key: "name",
            title: "Name",
            searchable: true,
            width: 160,
            render: (value) => (value ? `${value.first || ""} ${value.last || ""}`.trim() : "-"),
        },
        {
            key: "email",
            title: "Email",
            searchable: true,
            width: 220,
        },
        {
            key: "tenantId",
            title: "Tenant ID",
            width: 120,
            render: (value) => value || "-",
        },
        {
            key: "roles",
            title: "Role",
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Super Admin", value: "super_admin" },
                {
                    label: "Admin",
                    value: "admin",
                },
                { label: "Tenant Admin", value: "tenant_admin" },
                { label: "User", value: "user" },
            ],
            render: (value) => (
                <span
                    style={{
                        backgroundColor: value?.includes("super_admin")
                            ? "#e0f7e9"
                            : value?.includes("admin")
                              ? "#e6f3ff"
                              : value?.includes("tenant_admin")
                                ? "#fff3e0"
                                : "#f4f4f4",
                        color: value?.includes("super_admin")
                            ? "#15803d"
                            : value?.includes("admin")
                              ? "#0b62a8"
                              : value?.includes("tenant_admin")
                                ? "#9c6b00"
                                : "#333",
                        padding: "2px 6px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                    }}
                >
                    {value?.[0]?.name?.replace("_", " ")?.replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
            ),
        },
        {
            key: "ssoProvider",
            title: "SSO Provider",
            filterable: true,
            filterOptions: [
                { label: "All", value: "" },
                { label: "Okta", value: "okta" },
                {
                    label: "None",
                    value: "null",
                },
            ],
            width: 130,
            render: (value) => (
                <span
                    style={{
                        color: value ? "#0b62a8" : "#999",
                        fontWeight: value ? 600 : 400,
                    }}
                >
                    {value ? value.toUpperCase() : "None"}
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
                {
                    label: "Inactive",
                    value: "inactive",
                },
            ],
            width: 120,
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
            key: "createdAt",
            title: "Created At",
            width: 140,
            render: (value) => {
                if (!value) return "-";
                const date = new Date(value);
                return date.toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
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
            <TableGrid
                columns={columns}
                data={users}
                paginationMode="client"
                pageSizeOptions={[5, 10, 20]}
                maxHeight="60vh"
                maxWidth="100%"
            />
        </Layout>
    );
}
