

export const handleLogout = async () => {
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  dispatch({ type: "LOGOUT" });
  router.push("/login");
};

