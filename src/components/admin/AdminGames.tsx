"use client";

import { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, query, orderBy, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Trash2, Gamepad2, Loader2 } from "lucide-react";
import gsap from "gsap";

interface Game {
    id: string;
    name: string;
    isActive: boolean;
    createdAt?: any;
}

export default function AdminGames() {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [newGameName, setNewGameName] = useState("");
    const listRef = useRef<HTMLDivElement>(null);

    const fetchGames = async () => {
        setIsLoading(true);
        const q = query(collection(db, "games"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
        setGames(data);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchGames();
    }, []);

    // Animate list
    useEffect(() => {
        if (listRef.current && games.length > 0 && !isLoading) {
            gsap.fromTo(
                listRef.current.children,
                { y: 10, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out" }
            );
        }
    }, [games, isLoading]);

    const handleAddGame = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGameName.trim()) return;

        try {
            await addDoc(collection(db, "games"), {
                name: newGameName.trim(),
                isActive: true, // Default to active
                createdAt: Timestamp.now()
            });
            setNewGameName("");
            fetchGames();
        } catch (error) {
            console.error("Error adding game:", error);
        }
    };

    const handleDeleteGame = async (id: string) => {
        if (confirm("Are you sure you want to delete this game?")) {
            await deleteDoc(doc(db, "games", id));
            fetchGames();
        }
    };

    const toggleGameStatus = async (game: Game) => {
        try {
            await updateDoc(doc(db, "games", game.id), {
                isActive: !game.isActive
            });
            fetchGames();
        } catch (error) {
            console.error("Error updating game status:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Add Game Form */}
            <form onSubmit={handleAddGame} className="flex gap-4 items-center bg-muted/30 p-4 rounded-xl border border-border/50">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Enter game name (e.g. BGMI, COD Mobile)"
                        className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:border-primary focus:outline-none transition-colors"
                        value={newGameName}
                        onChange={(e) => setNewGameName(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    disabled={!newGameName.trim()}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    <Plus size={16} /> Add Game
                </button>
            </form>

            {/* Games List */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-primary" />
                </div>
            ) : games.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <Gamepad2 className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <p>No games added yet.</p>
                </div>
            ) : (
                <div ref={listRef} className="space-y-2">
                    {games.map((game) => (
                        <div key={game.id} className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-lg hover:border-border transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <Gamepad2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground">{game.name}</h3>
                                    <p className="text-xs text-muted-foreground">
                                        Added: {game.createdAt?.toDate ? game.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => toggleGameStatus(game)}
                                    className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${game.isActive
                                            ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                            : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                        }`}
                                >
                                    {game.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </button>

                                <button
                                    onClick={() => handleDeleteGame(game.id)}
                                    className="p-2 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
