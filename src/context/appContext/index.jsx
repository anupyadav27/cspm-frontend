"use client";

import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { appReducer, initialState } from "./reducer";
import notificationsData from "@/data/samples/notifications.json";
import { fetchData } from "@/utils/fetchData";
import handleLogout from "@/utils/handleLogout";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    const savedState =
        typeof window !== "undefined" && sessionStorage.getItem("appState")
            ? JSON.parse(sessionStorage.getItem("appState"))
            : initialState;

    const [state, dispatch] = useReducer(appReducer, savedState);

    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                sessionStorage.setItem("appState", JSON.stringify(state));
            } catch (err) {
                console.error("Failed to persist app state:", err);
            }
        }
    }, [state]);

    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === "appState") {
                if (e.newValue) {
                    const parsed = JSON.parse(e.newValue);
                    dispatch({ type: "SET_USER", payload: { user: parsed.user } });
                } else {
                    dispatch({ type: "LOGOUT" });
                }
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    useEffect(() => {
        const initializeApp = async () => {
            setLoading(true);
            try {
                let { user, isAuthenticated } = state;

                if (!isAuthenticated || !user) {
                    try {
                        const res = await fetch(
                            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
                            {
                                method: "POST",
                                credentials: "include",
                            }
                        );

                        if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);

                        const data = await res.json();

                        if (data?.user) {
                            dispatch({
                                type: "LOGIN",
                                payload: { user: data.user, token: data.token },
                            });
                            user = data.user;
                            isAuthenticated = true;
                        } else {
                            await handleLogout(dispatch);
                            return;
                        }
                    } catch (err) {
                        console.warn("Refresh failed:", err.message);
                        await handleLogout(dispatch);
                        return;
                    }
                }

                if (isAuthenticated && user) {
                    try {
                        const tenantData = await fetchData(
                            `${process.env.NEXT_PUBLIC_API_URL}/api/tenants`,
                            {
                                force: true,
                                validate: true,
                            }
                        );

                        if (tenantData?.data) {
                            dispatch({ type: "SET_TENANTS", payload: tenantData });
                            if (tenantData.data.length > 0) {
                                dispatch({
                                    type: "SELECT_TENANT",
                                    payload: tenantData.data[0],
                                });
                            }
                        }
                    } catch (err) {
                        console.warn("Tenant fetch failed:", err.message);
                    }

                    dispatch({
                        type: "SET_NOTIFICATIONS",
                        payload: notificationsData.notifications || [],
                    });
                    dispatch({
                        type: "SET_NOTIFICATION_SETTINGS",
                        payload: notificationsData.notificationSettings || {},
                    });
                }
            } catch (err) {
                console.error("App initialization failed:", err);
                await handleLogout(dispatch);
            } finally {
                setLoading(false);
            }
        };

        initializeApp();
    }, []);

    useEffect(() => {
        if (!loading) {
            const PUBLIC_ROUTES = ["/auth/login", "/auth/forget-password"];
            if (!state.isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
                router.replace("/auth/login");
            }
        }
    }, [state.isAuthenticated, pathname, router, loading]);

    return (
        <AppContext.Provider value={{ state, dispatch, loading }}>{children}</AppContext.Provider>
    );
};

export const useAppContext = () => useContext(AppContext);
