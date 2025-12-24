"use client";
import TournamentsView from "@/components/dashboard/TournamentsView";
import { useSearchParams } from "next/navigation";

export default function TournamentsPage() {
    const searchParams = useSearchParams();
    const selectedGame = searchParams.get("game") || "All Games";

    return <TournamentsView selectedGame={selectedGame === "All Games" ? undefined : selectedGame} />;
}
