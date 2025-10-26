import { useAppContext } from "@/context/appContext";
import usersData from "@/data/samples/users.json";

export const useAuthActions = () => {
    const { state, dispatch } = useAppContext();

    const handleLogin = async (email, password) => {
        const user = usersData.users.find((u) => u.email === email && u.password === password);

        if (user) {
            const userWithoutPassword = { ...user };
            delete userWithoutPassword.password;

            dispatch({
                type: "LOGIN",
                payload: {
                    user: userWithoutPassword,
                    role: user.role,
                    token: "demo-token",
                },
            });

            sessionStorage.setItem(
                "appState",
                JSON.stringify({
                    user: userWithoutPassword,
                    role: user.role,
                    token: "demo-token",
                })
            );

            return { success: true, user: userWithoutPassword };
        }

        return { success: false, error: "Invalid email or password" };
    };

    const handleLogout = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });

            const data = await res.json();

            alert(JSON.stringify(data));

            sessionStorage.clear();

            if ("caches" in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map((name) => caches.delete(name)));
            }

            dispatch({ type: "LOGOUT" });

            document.cookie.split(";").forEach((cookie) => {
                const name = cookie.split("=")[0].trim();
                document.cookie = `${name}=; Max-Age=0; path=/;`;
                document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
            });

            const currentPath = window.location.pathname;

            if (data?.sso && data?.redirectUrl && currentPath !== data.redirectUrl) {
                window.location.href = data.redirectUrl;
                return;
            }

            if (currentPath !== "/auth/login") {
                window.location.href = "/auth/login";
            }
        } catch (error) {
            console.error("Logout error:", error);

            sessionStorage.clear();
            if ("caches" in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map((name) => caches.delete(name)));
            }
            dispatch({ type: "LOGOUT" });

            const currentPath = window.location.pathname;
            if (currentPath !== "/auth/login") {
                window.location.href = "/auth/login";
            }
        }
    };

    return {
        state,
        handleLogin,
        handleLogout,
    };
};
