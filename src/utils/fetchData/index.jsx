export const fetchData = async (url, { force = false, validate = false } = {}) => {
    const headers = { Accept: "application/json" };

    let cacheMode;
    if (force) cacheMode = "no-store";
    else if (validate) cacheMode = "no-cache";
    else cacheMode = "force-cache";

    const doFetch = async () => {
        const res = await fetch(url, {
            method: "GET",
            credentials: "include",
            cache: cacheMode,
            headers,
        });
        return res;
    };

    try {
        let res = await doFetch();

        if (res.status === 401) {
            console.warn("Access token expired, attempting refresh...");

            const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
                method: "POST",
                credentials: "include",
                headers: { Accept: "application/json" },
            });

            if (refreshRes.ok) {
                console.info("Access token refreshed, retrying original request...");
                res = await doFetch();
            } else {
                console.error("Refresh failed — logging out");
                return { data: null, pagination: null, logOut: true };
            }
        }

        if (res.status === 401) {
            console.error("Still unauthorized after refresh — logging out");
            return { data: null, pagination: null, logOut: true };
        }

        if (!force && validate && res.status === 304) {
            console.info("Data not modified (304) — using browser cache");
            return { data: null, pagination: null, fromCache: true };
        }

        const data = await res.json();

        return {
            data: data?.data || [],
            pagination: data?.pagination || {},
            fromCache: false,
            logOut: false,
        };
    } catch (e) {
        console.error("Failed to fetch data:", e);
        return { data: null, pagination: null, logOut: false };
    }
};
