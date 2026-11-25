import { GroupsClient } from "./groups-client";

export const metadata = {
  title: "Private groups",
  robots: { index: false, follow: false },
};

export default function GroupsPage() {
  return <GroupsClient />;
}
