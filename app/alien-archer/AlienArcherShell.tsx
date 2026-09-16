"use client";
import Link from 'next/link';import FrameWorld from '../world/FrameWorld';import {ToolsSection} from '../components/WorldTools';
export default function AlienArcherShell(){return <main className="alien-archer-screen"><Link className="alien-archer-back" href="/urf-3d">← VOID SELECT</Link><ToolsSection title="Alien game"><p>All models live in Spawn shit. Use Physics to select, resize, and take control.</p></ToolsSection><FrameWorld className="alien-archer-frame" src="/alien-archer-game/index.html" title="Alien Archer physics sandbox"/></main>;}
