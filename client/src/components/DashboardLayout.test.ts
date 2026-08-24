import { describe, expect, it } from "vitest";
import { baseMenuItems, getSidebarActiveItem } from "./DashboardLayout";

describe("DashboardLayout sidebar route matching", () => {
  it("highlights only Client venues on the shared venue directory route", () => {
    const active = getSidebarActiveItem(baseMenuItems, "/app/restaurants");

    expect(active.label).toBe("Client venues");
    expect(baseMenuItems.filter(item => item.isActive("/app/restaurants"))).toHaveLength(1);
  });

  it("highlights the specific workspace section for menu and table-card routes", () => {
    expect(getSidebarActiveItem(baseMenuItems, "/app/menu/7").label).toBe("Menu work");
    expect(getSidebarActiveItem(baseMenuItems, "/app/qr/7").label).toBe("Table cards");
  });
});
