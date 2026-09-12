import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FloatingButtons from "../components/FloatingButtons";

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 antialiased selection:bg-red-600 selection:text-white">
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
