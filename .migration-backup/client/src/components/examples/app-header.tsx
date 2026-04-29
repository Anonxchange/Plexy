import { AppHeader } from "../app-header";
import { ThemeProvider } from "../theme-provider";

export default function AppHeaderExample() {
  return (
    <ThemeProvider>
      <AppHeader />
    </ThemeProvider>
  );
}
