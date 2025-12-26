"use client";

import { useRef, useState } from "react";
import { Swords } from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface GamemodeCardProps {
    mode: string;
    onClick: () => void;
}

export default function GamemodeCard({ mode, onClick }: GamemodeCardProps) {
    const cardRef = useRef<HTMLButtonElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
        gsap.to(cardRef.current, {
            scale: 1.03,
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
            duration: 0.2,
            ease: "power2.out",
        });
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        gsap.to(cardRef.current, {
            scale: 1,
            boxShadow: "0 0 0 rgba(0,0,0,0)",
            duration: 0.25,
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
            className={cn(
                "text-left p-4 rounded-xl will-change-transform transition-colors duration-150",
                isHovered
                    ? "bg-primary/10 border border-primary/50"
                    : "bg-card border border-border/50"
            )}
        >
            <span className={cn(
                "block text-lg font-bold font-rajdhani transition-colors duration-150",
                isHovered ? "text-primary" : "text-foreground"
            )}>
                {mode}
            </span>
            <span className={cn(
                "text-xs mt-1 flex items-center gap-1 transition-colors duration-150",
                isHovered ? "text-primary/70" : "text-muted-foreground"
            )}>
                View Scrims <Swords size={12} />
            </span>
        </button>
    );
}
