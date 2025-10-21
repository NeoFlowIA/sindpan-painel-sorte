import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "secondary" | "accent";
}

export function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  variant = "default" 
}: KPICardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10";
      case "secondary":
        return "border-secondary/20 bg-gradient-to-br from-secondary/5 to-secondary/10";
      case "accent":
        return "border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10";
      default:
        return "border-border bg-card";
    }
  };

  const getIconVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "bg-primary text-primary-foreground";
      case "secondary":
        return "bg-secondary text-secondary-foreground";
      case "accent":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className={`${getVariantStyles()} shadow-md hover:shadow-lg transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-xs md:text-sm font-medium text-muted-foreground truncate">{title}</h3>
        <div className={`p-1.5 md:p-2 rounded-lg ${getIconVariantStyles()}`}>
          <Icon className="w-3 h-3 md:w-4 md:h-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">{value}</div>
        {subtitle && (
          <p className="text-xs md:text-sm text-muted-foreground">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span
              className={`text-xs md:text-sm font-medium ${
                trend.isPositive ? "text-success" : "text-destructive"
              }`}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">vs período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}