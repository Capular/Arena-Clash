"use client";

import { useEffect, useState, useRef } from "react";
import TournamentCard from "./TournamentCard";
import { collection, onSnapshot, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import gsap from "gsap";
import GsapLoader from "@/components/ui/GsapLoader";
import { Swords, Trophy, MapPin, ArrowLeft, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import GamemodeCard from "./GamemodeCard";

interface Tournament {
    id: string;
    title: string;
    prizePool: string;
    entryFee: string;
    currentSlots: number;
    maxSlots: number;
    isLive: boolean;
    game: string;
    type?: 'scrim' | 'championship';
    map?: string; // Corresponds to gamemode often
}

interface TournamentsViewProps {
    selectedGame?: string;
}

export default function TournamentsView({ selectedGame }: TournamentsViewProps) {
    const [viewMode, setViewMode] = useState<'scrims' | 'championships'>('scrims');
    const [gamemodes, setGamemodes] = useState<string[]>([]);
    const [selectedGamemode, setSelectedGamemode] = useState<string | null>(null);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch Gamemodes when selectedGame changes (for Scrims)
    useEffect(() => {
        const fetchGamemodes = async () => {
            if (!selectedGame) {
                setGamemodes([]);
                return;
            }
            try {
                const q = query(collection(db, "games"), where("name", "==", selectedGame));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    const gameData = snapshot.docs[0].data();
                    setGamemodes(gameData.gamemodes || []);
                } else {
                    setGamemodes([]);
                }
            } catch (error) {
                console.error("Error fetching gamemodes:", error);
            }
        };

        if (viewMode === 'scrims') {
            fetchGamemodes();
            setSelectedGamemode(null); // Reset selection on game change
        }
    }, [selectedGame, viewMode]);

    // Fetch Tournaments based on filters
    useEffect(() => {
        setLoading(true);
        let q = query(collection(db, "tournaments"));

        // Base Type Filter
        const typeFilter = viewMode === 'championships' ? 'championship' : 'scrim';
        // Note: Firestore might need index for compound queries. 
        // We'll filter client-side if needed for simple prototype, but try query first.
        // Or simpler: Fetch relevant to game, then filter in memory if index is missing.

        let constraints: any[] = [];

        // Filter by Type
        // We will do this client side for now to avoid "index required" errors during dev
        // unless we are sure about indexes. But let's try to be efficient.
        // Actually, let's just fetch all for the filtered game and filter by type in JS.

        if (selectedGame) {
            constraints.push(where("game", "==", selectedGame));
        }

        q = query(collection(db, "tournaments"), ...constraints);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let data: Tournament[] = [];
            snapshot.forEach((doc) => {
                const t = doc.data() as any;
                data.push({
                    id: doc.id,
                    title: t.title,
                    prizePool: t.prizePool,
                    entryFee: t.entryFee,
                    currentSlots: t.currentSlots,
                    maxSlots: t.maxSlots,
                    isLive: t.isLive,
                    game: t.game || "Free Fire",
                    type: t.type || 'scrim', // Default to scrim if missing
                    map: t.map
                });
            });

            // Filter specific to View Mode
            if (viewMode === 'championships') {
                data = data.filter(t => t.type === 'championship');
            } else {
                // Scrims
                data = data.filter(t => t.type !== 'championship');
                // Filter by Gamemode if selected
                if (selectedGamemode) {
                    // Match map or title containing gamemode? 
                    // Ideally we match 'map' field to Selected Gamemode
                    // Assuming 'map' in tournament stores the gamemode/map name.
                    data = data.filter(t => t.map === selectedGamemode);
                }
            }

            setTournaments(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [selectedGame, viewMode, selectedGamemode]);

    // GSAP entrance animation
    useEffect(() => {
        if (!loading && containerRef.current) {
            gsap.fromTo(
                containerRef.current,
                { opacity: 0, y: 10 },
                { opacity: 1, y: 0, duration: 0.4, ease: "power2.out", clearProps: "all" }
            );
        }
    }, [loading, viewMode, selectedGamemode]);

    return (
        <div className="space-y-6">
            {/* View Mode Toggle */}
            <div className="flex gap-4 border-b border-border/40 pb-1">
                <button
                    onClick={() => setViewMode('scrims')}
                    className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${viewMode === 'scrims' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Swords size={18} /> Scrims
                    {viewMode === 'scrims' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary animate-in fade-in zoom-in duration-300" />
                    )}
                </button>
                <button
                    onClick={() => setViewMode('championships')}
                    className={`pb-3 px-2 text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${viewMode === 'championships' ? 'text-yellow-500' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    <Trophy size={18} /> Championships
                    {viewMode === 'championships' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-yellow-500 animate-in fade-in zoom-in duration-300" />
                    )}
                </button>
            </div>

            <div ref={containerRef} className="min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <GsapLoader size="lg" className="border-t-2 border-b-2 border-primary h-10 w-10" />
                    </div>
                ) : (
                    <>
                        {/* SCRIMS VIEW */}
                        {viewMode === 'scrims' && (
                            <div className="space-y-6">
                                {/* If no game selected, ask to select one */}
                                {!selectedGame ? (
                                    <div className="text-center py-16 bg-muted/5 rounded-xl border border-dashed border-border/50">
                                        <Gamepad2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-foreground font-rajdhani">Select a Game</h3>
                                        <p className="text-sm text-muted-foreground">Please select a game from the menu to view available scrims.</p>
                                    </div>
                                ) : !selectedGamemode ? (
                                    // Gamemode List
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-foreground font-rajdhani flex items-center gap-2">
                                            <MapPin size={18} className="text-primary" /> Available Gamemodes for {selectedGame}
                                        </h3>

                                        {gamemodes.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {gamemodes.map((mode, idx) => (
                                                    <GamemodeCard
                                                        key={idx}
                                                        mode={mode}
                                                        onClick={() => setSelectedGamemode(mode)}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 opacity-70">
                                                <p className="text-sm text-muted-foreground">No gamemodes configured for this game yet.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    // Filtered Tournament List (Specific Gamemode)
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedGamemode(null)}
                                                className="hover:bg-muted/50 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
                                            >
                                                <ArrowLeft size={16} /> Back to Gamemodes
                                            </Button>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">Viewing Scrims:</span>
                                                <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{selectedGamemode}</span>
                                            </div>
                                        </div>

                                        {tournaments.length === 0 ? (
                                            <div className="text-center py-16 bg-muted/5 rounded-xl border border-dashed border-border/50">
                                                <p className="text-muted-foreground">No active scrims found for <span className="text-primary font-bold">{selectedGamemode}</span>.</p>
                                                <Button
                                                    variant="link"
                                                    onClick={() => setSelectedGamemode(null)}
                                                    className="mt-2 text-primary"
                                                >
                                                    Check other gamemodes
                                                </Button>
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
                                )}
                            </div>
                        )}

                        {/* CHAMPIONSHIPS VIEW */}
                        {viewMode === 'championships' && (
                            <div className="space-y-6">
                                {tournaments.length === 0 ? (
                                    <div className="text-center py-20 bg-muted/5 rounded-xl border border-dashed border-border/50">
                                        <Trophy className="w-12 h-12 text-yellow-500/20 mx-auto mb-4" />
                                        <p className="text-muted-foreground">No active championships at the moment.</p>
                                        <p className="text-sm text-neutral-500">Stay tuned for big events!</p>
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
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
