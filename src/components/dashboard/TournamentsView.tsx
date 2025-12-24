"use client";

import { useEffect, useState } from "react";
import TournamentCard from "./TournamentCard";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Tournament {
    id: string;
    title: string;
    prizePool: string;
    entryFee: string;
    currentSlots: number;
    maxSlots: number;
    isLive: boolean;
    game: string;
}

interface TournamentsViewProps {
    selectedGame?: string;
}

export default function TournamentsView({ selectedGame }: TournamentsViewProps) {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Query active tournaments
        let q = query(collection(db, "tournaments"));

        // In a real app with many docs, use 'where' in query. 
        // For small data, client-side filtering also works but 'where' is better.
        // However, if we don't have indexes set up, 'where' might require one. 
        // Let's stick to client-side filter for agility unless we have a lot of data.
        // Actually, 'where' is simple enough.

        // Note: If 'selectedGame' changes, this effect re-runs.
        if (selectedGame) {
            q = query(collection(db, "tournaments"), where("game", "==", selectedGame));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const tournamentsData: Tournament[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Fallback filter if needed, but query handles it
                tournamentsData.push({
                    id: doc.id,
                    title: data.title,
                    prizePool: data.prizePool,
                    entryFee: data.entryFee,
                    currentSlots: data.currentSlots,
                    maxSlots: data.maxSlots,
                    isLive: data.isLive,
                    game: data.game || "Free Fire"
                });
            });
            setTournaments(tournamentsData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedGame]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
            {/* Header removed from here as it's now global */}

            {tournaments.length === 0 ? (
                <div className="text-center py-20 bg-card/50 rounded-2xl border border-border border-dashed">
                    <p className="text-muted-foreground">No active tournaments found for <span className="text-white">{selectedGame || "All Games"}</span>.</p>
                    <p className="text-sm text-neutral-500">Check back later or try another game.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {tournaments.map((t) => (
                        <TournamentCard
                            key={t.id}
                            id={t.id}
                            title={t.title}
                            prizePool={t.prizePool}
                            entryFee={t.entryFee}
                            currentSlots={t.currentSlots}
                            maxSlots={t.maxSlots}
                            isLive={t.isLive}
                            game={t.game}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
