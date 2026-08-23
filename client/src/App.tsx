import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import DemoMenu from "@/pages/DemoMenu";
import Home from "@/pages/Home";
import MenuBuilder from "@/pages/MenuBuilder";
import NotFound from "@/pages/NotFound";
import PublicMenu from "@/pages/PublicMenu";
import QRStudio from "@/pages/QRStudio";
import Restaurants from "@/pages/Restaurants";
import SignIn from "@/pages/SignIn";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/demo" component={DemoMenu} />
      <Route path="/sign-in" component={SignIn} />
      <Route path="/app" component={Dashboard} />
      <Route path="/app/restaurants" component={Restaurants} />
      <Route path="/app/menu/:id" component={MenuBuilder} />
      <Route path="/app/qr/:id" component={QRStudio} />
      <Route path="/menu/:slug" component={PublicMenu} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
