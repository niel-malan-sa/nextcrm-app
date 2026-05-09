import { CalendarClock } from "lucide-react";
import { NavItem } from "../nav-main";

export const getSchedulingMenuItem = (): NavItem => {
  return {
    title: "Scheduling",
    url: "/scheduling",
    icon: CalendarClock,
  };
};

export default getSchedulingMenuItem;
