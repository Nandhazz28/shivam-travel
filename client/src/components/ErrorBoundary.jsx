import { Component } from "react";
import { RefreshCcw, Home } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary] Unhandled UI error:", error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-center px-4 py-16 bg-gray-50/50">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Something went wrong
        </h1>
        <p className="text-gray-600 text-sm sm:text-base max-w-md leading-relaxed mt-3">
          An unexpected error occurred while displaying this page. Please try
          reloading — if the problem continues, contact us via our Contact
          page.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 w-full max-w-xs sm:max-w-none">
          <button
            type="button"
            onClick={this.handleReload}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            <RefreshCcw size={18} aria-hidden="true" />
            <span>Reload Page</span>
          </button>
          <a
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 active:scale-[0.98] text-gray-700 hover:text-gray-900 px-6 py-3 rounded-xl font-semibold text-sm shadow-xs transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
          >
            <Home size={18} aria-hidden="true" />
            <span>Back to Home</span>
          </a>
        </div>
      </main>
    );
  }
}
