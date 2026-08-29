export type NavItem = {
  key: string;
  label: string;
  href: string;
  icon: string;
};

export const NAV_ITEMS: NavItem[] = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { key: "reports", label: "Reports", href: "/reports", icon: "assessment" },
  { key: "schools", label: "Schools", href: "/schools", icon: "school" },
  { key: "settings", label: "Settings", href: "/settings", icon: "settings" },
];
