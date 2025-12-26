"use client";

import { useRef } from "react";
import { Swords } from "lucide-react";
import gsap from "gsap";

interface GamemodeCardProps {
    mode: string;
    onClick: () => void;
}

export default function GamemodeCard({ mode, onClick }: GamemodeCardProps) {
    const cardRef = useRef<HTMLButtonElement>(null);
    const titleRef = useRef<HTMLSpanElement>(null);
    const subtitleRef = useRef<HTMLSpanElement>(null);

    const handleMouseEnter = () => {
        gsap.to(cardRef.current, {
            scale: 1.03,
            backgroundColor: "hsl(var(--primary) / 0.08)",
            borderColor: "hsl(var(--primary) / 0.5)",
            duration: 0.2,
            ease: "power2.out",
        });
        gsap.to(titleRef.current, {
            color: "hsl(var(--primary))",
            duration: 0.15,
            ease: "power2.out",
        });
        gsap.to(subtitleRef.current, {
            color: "hsl(var(--primary) / 0.7)",
            duration: 0.15,
            ease: "power2.out",
        });
    };

    const handleMouseLeave = () => {
        gsap.to(cardRef.current, {
            scale: 1,
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border) / 0.5)",
            duration: 0.25,
            ease: "power2.out",
        });
        gsap.to(titleRef.current, {
            color: "hsl(var(--foreground))",
            duration: 0.15,
            ease: "power2.out",
        });
        gsap.to(subtitleRef.current, {
            color: "hsl(var(--muted-foreground))",
            duration: 0.15,
            ease: "power2.out",
        });
    };

    const handleMouseDown = () => {
        gsap.to(cardRef.current, {
            scale: 0.97,
            duration: 0.1,
            ease: "power2.out",
        });
    };

    const handleMouseUp = () => {
        gsap.to(cardRef.current, {
            scale: 1.03,
            duration: 0.1,
            ease: "power2.out",
        });
    };

    return (
        <button
            ref={cardRef}
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            className="bg-card border border-border/50 text-left p-4 rounded-xl will-change-transform"
        >
            <span ref={titleRef} className="block text-lg font-bold text-foreground font-rajdhani">
                {mode}
            </span>
            <span ref={subtitleRef} className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                View Scrims <Swords size={12} />
            </span>
        </button>
    );
}
