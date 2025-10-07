import {Geist, Geist_Mono} from "next/font/google";
import "@/css/globals.css";
import {AppProvider} from "@/context/appContext";
import "@/scss/index.scss"

const geistSans = Geist({
	variable: "--font-geist-sans", subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono", subsets: ["latin"],
});

export const metadata = {
	title: "CSPM Platform", description: "Cloud Security Posture Management",
};

export default function RootLayout({children}) {
	return (<html>
	<body
		className={`antialiased`}
	>
	<AppProvider>
		{children}
	</AppProvider>
	</body>
	</html>);
}
