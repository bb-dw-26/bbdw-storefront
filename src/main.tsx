import "./instrument";
import { Component, StrictMode, type ReactNode } from "react";
import { reactErrorHandler } from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./style.css";

class AppBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main role="alert">
        <h1>Não foi possível exibir a loja.</h1>
        <p>Recarregue a página para tentar novamente.</p>
        <button onClick={() => window.location.reload()}>Recarregar</button>
      </main>
    ) : this.props.children;
  }
}

createRoot(document.getElementById("root")!, {
  // React 19: o hook captura; o boundary apenas apresenta a recuperação.
  onCaughtError: reactErrorHandler(),
  onUncaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
  <StrictMode>
    <AppBoundary><App /></AppBoundary>
  </StrictMode>,
);
