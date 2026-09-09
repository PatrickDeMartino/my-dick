"use client";

import { usePathname } from "next/navigation";
import styles from "./AssetsRoomDoor.module.css";

export default function AssetsRoomDoor() {
  const pathname = usePathname();
  if (!pathname.startsWith("/brain-room")) return null;
  return <a className={styles.door} href="/assets-room">◇ ASSETS ROOM</a>;
}
