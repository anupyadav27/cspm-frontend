"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/sideBar";
import Header from "@/components/header";
import SpinnerLoaderOverlay from "@/components/spinnerLoaderOverlay";
import { useAppContext } from "@/context/appContext";

import OnboardingSubSidebar from "@/components/subSidebars/OnboardingSubSidebar";
import ScansSubSidebar from "@/components/subSidebars/ScansSubSidebar";
import InventorySubSidebar from "@/components/subSidebars/InventorySubSidebar";
import ThreatsSubSidebar from "@/components/subSidebars/ThreatsSubSidebar";
import ComplianceSubSidebar from "@/components/subSidebars/ComplianceSubSidebar.jsx";
import IamSubSidebar from "@/components/subSidebars/IamSubSidebar";
import DataSecuritySubSidebar from "@/components/subSidebars/DataSecuritySubSidebar";
import SecOpsSubSidebar from "@/components/subSidebars/SecOpsSubSidebar";
import SettingsSubSidebar from "@/components/subSidebars/SettingsSubSidebar";

export default function Layout({ children, headerLabel, isLoading = false }) {
    const { state, dispatch } = useAppContext();
    const appLoading = state.isLoading;

    const pathname = usePathname();
    const router = useRouter();

    const [isClient, setIsClient] = useState(false);
    const [activeSection, setActiveSection] = useState("dashboard");
    const [hoveredSection, setHoveredSection] = useState(null);

    const hideTimeoutRef = useRef(null);
    
    const sectionsWithSubSidebar = [
        "onboarding",
        "scans",
        "inventory",
        "threats",
        "compliance",
        "iam",
        "datasec",
        "secops",
        "settings",
    ];

    useEffect(() => {
        setIsClient(true);
        return () => {
            if (hideTimeoutRef.current) {
                clearTimeout(hideTimeoutRef.current);
            }
        };
    }, []);
    
    useEffect(() => {
        const firstSegment = pathname.split("/")[1];
        setActiveSection(firstSegment || "dashboard");
    }, [pathname]);
    
    const handleSectionClick = (section) => {
        if (!pathname.startsWith(`/${section}`)) {
            dispatch({ type: "SET_LOADING", payload: true });
            router.push(`/${section}`);
        }
    };
    
    const cancelHide = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    };

    const scheduleHide = () => {
        hideTimeoutRef.current = setTimeout(() => {
            setHoveredSection(null);
        }, 200);
    };
    
    const shouldShowSubSidebar = hoveredSection && sectionsWithSubSidebar.includes(hoveredSection);

    const renderSubSidebar = () => {
        if (!shouldShowSubSidebar) return null;

        switch (hoveredSection) {
            case "onboarding":
                return <OnboardingSubSidebar />;
            case "scans":
                return <ScansSubSidebar />;
            case "inventory":
                return <InventorySubSidebar />;
            case "threats":
                return <ThreatsSubSidebar />;
            case "compliance":
                return <ComplianceSubSidebar />;
            case "iam":
                return <IamSubSidebar />;
            case "datasec":
                return <DataSecuritySubSidebar />;
            case "secops":
                return <SecOpsSubSidebar />;
            case "settings":
                return <SettingsSubSidebar />;
            default:
                return null;
        }
    };

    return (
        <div className="layout">
            <Sidebar
                activeSection={activeSection}
                onSectionHover={(id) => {
                    cancelHide();
                    setHoveredSection(id);
                }}
                onSectionLeave={scheduleHide}
                onSectionClick={handleSectionClick}
            />

            <div className="layout__main">
                <Header title={headerLabel || activeSection} />

                {shouldShowSubSidebar && (
                    <div onMouseEnter={cancelHide} onMouseLeave={scheduleHide}>
                        {renderSubSidebar()}
                    </div>
                )}

                <div className="layout__body">
                    <div className="layout__content">
                        {isClient && <SpinnerLoaderOverlay isLoading={appLoading || isLoading} />}
                        
                        {(() => {
                            // Route Protection Matrix
                            const role = state?.role?.name || "user";
                            
                            // Define explicit protection zones
                            const adminOnlySections = ["settings", "secops"];
                            const elevatedSections = ["iam", "datasec"]; // e.g. tenant_admin, admin
                            
                            let isAuthorized = true;
                            
                            if (adminOnlySections.includes(activeSection) && !["admin", "tenant_admin"].includes(role)) {
                                isAuthorized = false;
                            }
                            
                            if (elevatedSections.includes(activeSection) && !["admin", "tenant_admin"].includes(role)) {
                                isAuthorized = false;
                            }

                            if (!isAuthorized) {
                                return (
                                    <div className="flex flex-col items-center justify-center p-12 text-center h-full">
                                        <div className="text-6xl mb-4 text-red-500">
                                            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
                                        <p className="text-gray-500 max-w-md">
                                            Your current Role ({role}) does not have permission to view the {headerLabel || activeSection} section. Switch tenants or contact an administrator.
                                        </p>
                                    </div>
                                );
                            }

                            return children;
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
