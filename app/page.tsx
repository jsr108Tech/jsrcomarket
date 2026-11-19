import GroceryApp from "@/components/grocery-app";
import { AuthProvider } from "@/components/providers/auth-provider";

export default function Home() {
  return (
    <AuthProvider>
      <GroceryApp />
    </AuthProvider>
  );
}
