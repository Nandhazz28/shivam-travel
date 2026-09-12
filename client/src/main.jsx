import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import "./index.css";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";
import { ContentProvider } from "./context/ContentContext.jsx";
import { BusinessSettingsProvider } from "./context/BusinessSettingsContext.jsx";
import { SEOSettingsProvider } from "./context/SEOSettingsContext.jsx";
import { AdminAuthProvider } from "./context/AdminAuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <HelmetProvider>
          <LanguageProvider>
            <ContentProvider>
              <BusinessSettingsProvider>
                <SEOSettingsProvider>
                  <AdminAuthProvider>
                    <ToastProvider>
                      <App />
                    </ToastProvider>
                  </AdminAuthProvider>
                </SEOSettingsProvider>
              </BusinessSettingsProvider>
            </ContentProvider>
          </LanguageProvider>
        </HelmetProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
