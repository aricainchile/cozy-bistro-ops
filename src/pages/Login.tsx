import { useState } from "react";
import { UtensilsCrossed, Lock, User } from "lucide-react";

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Demo login - in production this connects to backend
    onLogin("admin");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent blur-3xl" />
      </div>

      <div className="glass-card p-8 w-full max-w-md animate-slide-up relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4 shadow-lg">
            <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">RestaurantPOS</h1>
          <p className="text-muted-foreground text-sm mt-1">Sistema de Gestión de Restaurante</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Ingrese su usuario"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                placeholder="Ingrese su contraseña"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-md"
          >
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">Demo: Haga clic en Iniciar Sesión para acceder</p>
          <div className="flex gap-2 mt-3 justify-center">
            {["Garzón", "Jefe Local", "Admin"].map((role) => (
              <button
                key={role}
                onClick={() => onLogin(role.toLowerCase())}
                className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
