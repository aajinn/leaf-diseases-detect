"use client";

import { useState } from "react";
import {
  Header,
  Sidebar,
  LoadingSpinner,
  ErrorBoundary,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Component that throws an error for testing ErrorBoundary
function ErrorComponent(): never {
  throw new Error("This is a test error!");
}

export default function SharedDemoPage() {
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);

  const mockUser = {
    name: "John Doe",
    email: "john.doe@example.com",
  };

  const handleLogout = () => {
    alert("Logout clicked!");
  };

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Demo */}
      <Header user={mockUser} onLogout={handleLogout} />

      <div className="flex">
        {/* Sidebar Demo */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Shared Components Demo</h1>
              <p className="text-muted-foreground">
                Interactive demonstration of all shared components
              </p>
            </div>

            {/* Header Component */}
            <Card>
              <CardHeader>
                <CardTitle>Header Component</CardTitle>
                <CardDescription>
                  Navigation header with logo, links, and user menu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm">
                    The header is displayed at the top of this page. Features:
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>Logo with home link</li>
                    <li>Desktop navigation (Dashboard, Detect, Admin)</li>
                    <li>User dropdown menu</li>
                    <li>Responsive mobile menu</li>
                    <li>Active link highlighting</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Sidebar Component */}
            <Card>
              <CardHeader>
                <CardTitle>Sidebar Component</CardTitle>
                <CardDescription>
                  Collapsible navigation sidebar with icons
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm">
                    The sidebar is displayed on the left side of this page. Features:
                  </p>
                  <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                    <li>Navigation items with icons</li>
                    <li>Active state highlighting</li>
                    <li>Collapsible with toggle button</li>
                    <li>Smooth transitions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* LoadingSpinner Component */}
            <Card>
              <CardHeader>
                <CardTitle>LoadingSpinner Component</CardTitle>
                <CardDescription>
                  Animated spinner with size variants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-8 items-center justify-around p-6 rounded-lg border bg-muted/50">
                  <div className="text-center">
                    <LoadingSpinner size="sm" />
                    <p className="text-xs mt-2 text-muted-foreground">Small</p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner size="md" />
                    <p className="text-xs mt-2 text-muted-foreground">Medium</p>
                  </div>
                  <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="text-xs mt-2 text-muted-foreground">Large</p>
                  </div>
                </div>

                <div className="p-6 rounded-lg border bg-muted/50">
                  <LoadingSpinner text="Loading data..." size="md" />
                </div>

                <Button onClick={simulateLoading} disabled={loading}>
                  {loading ? "Loading..." : "Simulate 3s Loading"}
                </Button>

                {loading && (
                  <div className="p-6 rounded-lg border bg-muted/50">
                    <LoadingSpinner text="Please wait..." size="lg" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ErrorBoundary Component */}
            <Card>
              <CardHeader>
                <CardTitle>ErrorBoundary Component</CardTitle>
                <CardDescription>
                  Catches and displays component errors gracefully
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border p-4 bg-muted/50">
                  <p className="text-sm mb-4">
                    Click the button below to trigger an error and see the ErrorBoundary in action:
                  </p>
                  <Button
                    onClick={() => setShowError(!showError)}
                    variant={showError ? "destructive" : "default"}
                  >
                    {showError ? "Hide Error" : "Trigger Error"}
                  </Button>
                </div>

                {showError && (
                  <ErrorBoundary onReset={() => setShowError(false)}>
                    <ErrorComponent />
                  </ErrorBoundary>
                )}

                {!showError && (
                  <div className="rounded-lg border p-4 bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      No error currently. Click the button above to see the error boundary.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Usage Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Usage Examples</CardTitle>
                <CardDescription>
                  Code snippets for using these components
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Import</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`import { Header, Sidebar, LoadingSpinner, ErrorBoundary } from "@/components/shared";`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Header</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`<Header 
  user={{ name: "John Doe", email: "john@example.com" }}
  onLogout={() => console.log("Logout")}
/>`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Sidebar</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`<Sidebar className="h-screen" />`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">LoadingSpinner</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`<LoadingSpinner text="Loading..." size="lg" />`}</code>
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">ErrorBoundary</h3>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    <code>{`<ErrorBoundary onReset={() => console.log("Reset")}>
  <YourComponent />
</ErrorBoundary>`}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
