import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const NotFound = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="flex items-center justify-center py-32">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-light">404</h1>
        <p className="text-sm text-muted-foreground">Page not found</p>
        <Button asChild variant="outline" className="text-xs tracking-[0.1em] uppercase">
          <Link to="/">Go Home</Link>
        </Button>
      </div>
    </main>
    <Footer />
  </div>
);

export default NotFound;
