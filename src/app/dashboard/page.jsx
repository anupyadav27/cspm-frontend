"use client";
import Layout from "@/components/layout";
import { useAppContext } from "@/context/appContext";
import { useEffect } from "react";

export default function Dashboard() {
    const { dispatch } = useAppContext();
    useEffect(() => {
        dispatch({ type: "SET_LOADING", payload: false });
    }, []);

    return <Layout>HII</Layout>;
}
