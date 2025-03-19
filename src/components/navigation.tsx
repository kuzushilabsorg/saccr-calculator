import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calculator, FileSpreadsheet, BarChart } from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "SACCR Calculator",
      href: "/",
      icon: <Calculator className="h-4 w-4 mr-2" />,
    },
    {
      name: "Initial Margin",
      href: "/initial-margin",
      icon: <BarChart className="h-4 w-4 mr-2" />,
    },
    {
      name: "VM-CSA Analysis",
      href: "/vm-csa",
      icon: <FileSpreadsheet className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <nav className="flex space-x-2">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={pathname === item.href ? "default" : "outline"}
            className={cn(
              "h-9",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            {item.icon}
            {item.name}
          </Button>
        </Link>
      ))}
    </nav>
  );
}
