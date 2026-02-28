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
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
