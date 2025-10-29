"use client";

import { createContext, useContext, useEffect, useReducer, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { appReducer, initialState } from "./reducer";
import notificationsData from "@/data/samples/notifications.json";
import { fetchData } from "@/utils/fetchData";
import handleLogout from "@/utils/handleLogout/index.jsx";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
    const pathname = usePathname();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    const savedState =
        typeof window !== "undefined" && sessionStorage.getItem("appState")
            ? JSON.parse(sessionStorage.getItem("appState"))
            : initialState;

    const [state, dispatch] = useReducer(appReducer, {
        ...savedState,
        isInitialized: savedState?.isInitialized || false,
    });

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

    const initializeApp = async () => {
        setLoading(true);
        try {
            let { user, isAuthenticated } = state;

            if (!isAuthenticated || !user) {
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
                        method: "POST",
                        credentials: "include",
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data?.user) {
                            dispatch({
                                type: "LOGIN",
                                payload: { user: data.user, token: data.token },
                            });
                            user = data.user;
                            isAuthenticated = true;
                        }
                    } else {
                        dispatch({ type: "SET_INITIALIZED", payload: true });
                        setLoading(false);
                        return;
                    }
                } catch (err) {
                    console.warn("Session refresh failed:", err.message);
                    dispatch({ type: "SET_INITIALIZED", payload: true });
                    setLoading(false);
                    return;
                }
            }

            if (isAuthenticated && user) {
                const tenantData = await fetchData(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/tenants`,
                    {
                        force: false,
                        validate: true,
                    }
                );

                if (tenantData.logOut) {
                    handleLogout(dispatch);
                }

                if (!tenantData?.data?.length) throw new Error("No tenants found");

                dispatch({ type: "SET_TENANTS", payload: tenantData });
                dispatch({ type: "SELECT_TENANT", payload: tenantData.data[0] });

                dispatch({
                    type: "SET_NOTIFICATIONS",
                    payload: notificationsData.notifications || [],
                });
                dispatch({
                    type: "SET_NOTIFICATION_SETTINGS",
                    payload: notificationsData.notificationSettings || {},
                });
            }

            dispatch({ type: "SET_INITIALIZED", payload: true });
        } catch (err) {
            console.error("App initialization failed:", err);
            dispatch({ type: "SET_INITIALIZED", payload: false });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeApp();
    }, []);

    useEffect(() => {
        if (!loading && state.isAuthenticated && !state.isInitialized) {
            const maxRetries = 5;
            if (retryCount < maxRetries) {
                const retryDelay = 5000;
                console.warn(`Retrying initialization... Attempt ${retryCount + 1}`);
                const timer = setTimeout(() => {
                    setRetryCount((prev) => prev + 1);
                    initializeApp();
                }, retryDelay);
                return () => clearTimeout(timer);
            } else {
                console.error("Max retries reached. Initialization failed permanently.");
            }
        }
    }, [state.isInitialized, loading, retryCount, state.isAuthenticated]);

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
