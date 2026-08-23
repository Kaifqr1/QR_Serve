import { demoMenuData } from "@/lib/demoMenu";
import { GuestMenu } from "./PublicMenu";

export default function DemoMenu() {
  return (
    <GuestMenu
      slug={demoMenuData.restaurant.slug}
      initialMenu={demoMenuData}
      demo
    />
  );
}
