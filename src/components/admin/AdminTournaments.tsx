"use client";

import { useState, useEffect, useRef } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Trash2, Gamepad2, X, Loader2 } from "lucide-react";
import gsap from "gsap";

interface Tournament {
    id: string;
    game: string;
    title: string;
    map: string;
    entryFee: number;
    prizePool: number;
    perKill: number;
    date: string;
    time: string;
    maxPlayers: number;
    currentPlayers: number;
    roomId?: string;
    roomPassword?: string;
    status: 'upcoming' | 'live' | 'completed';
}

export default function AdminTournaments() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        game: 'Free Fire',
        title: '',
        map: 'Bermuda',
        entryFee: 0,
        prizePool: 0,
        perKill: 0,
        date: '',
        time: '',
        maxPlayers: 100,
        roomId: '',
        roomPassword: ''
    });

    const fetchTournaments = async () => {
        const q = query(collection(db, "tournaments"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tournament));
        setTournaments(data);
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    // Animate list items
    useEffect(() => {
        if (listRef.current && tournaments.length > 0) {
            gsap.fromTo(
                listRef.current.children,
                { y: 10, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out" }
            );
        }
    }, [tournaments]);

    // Animate modal
    useEffect(() => {
        if (isFormOpen) {
            gsap.fromTo(
                ".admin-modal",
                { scale: 0.95, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }
            );
        }
    }, [isFormOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await addDoc(collection(db, "tournaments"), {
                ...formData,
                currentPlayers: 0,
                status: 'upcoming',
                createdAt: Timestamp.now()
            });
            setIsFormOpen(false);
            fetchTournaments();
        } catch (error) {
            console.error("Error adding tournament: ", error);
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this tournament?")) {
            await deleteDoc(doc(db, "tournaments", id));
            fetchTournaments();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-foreground">All Tournaments</h2>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                    <Plus size={16} /> Add
                </button>
            </div>

            {/* Tournament List */}
            <div ref={listRef} className="space-y-2">
                {tournaments.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50 hover:border-border transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Gamepad2 className="text-primary w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground text-sm">{t.title || t.game}</h3>
                                <p className="text-xs text-muted-foreground">{t.date} • {t.time} • {t.map}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden md:block">
                                <p className="text-xs text-muted-foreground">Entry / Prize</p>
                                <p className="text-sm font-medium">₹{t.entryFee} / ₹{t.prizePool}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded font-medium ${t.status === 'live' ? 'bg-red-500/10 text-red-500' :
                                    t.status === 'completed' ? 'bg-muted text-muted-foreground' :
                                        'bg-primary/10 text-primary'
                                }`}>
                                {t.status}
                            </span>
                            <button onClick={() => handleDelete(t.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <div className="admin-modal bg-card border border-border rounded-xl p-6 w-full max-w-lg relative">
                        <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                            <X size={18} />
                        </button>
                        <h2 className="text-lg font-semibold mb-4">Create Tournament</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Game</label>
                                    <select
                                        className="w-full bg-muted/50 border border-border p-2 rounded-lg text-sm"
                                        value={formData.game}
                                        onChange={e => setFormData({ ...formData, game: e.target.value })}
                                    >
                                        <option value="Free Fire">Free Fire</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Title</label>
                                    <input type="text" className="w-full bg-muted/50 border border-border p-2 rounded-lg text-sm"
                                        placeholder="Tournament name"
                                        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Entry (₹)</label>
                                    <input type="number" className="w-full bg-muted/50 border border-border p-2 rounded-lg text-sm"
                                        value={formData.entryFee} onChange={e => setFormData({ ...formData, entryFee: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Prize (₹)</label>
                                    <input type="number" className="w-full bg-muted/50 border border-border p-2 rounded-lg text-sm"
                                        value={formData.prizePool} onChange={e => setFormData({ ...formData, prizePool: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Per Kill (₹)</label>
                                    <input type="number" className="w-full bg-muted/50 border border-border p-2 rounded-lg text-sm"
                                        value={formData.perKill} onChange={e => setFormData({ ...formData, perKill: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Map</label>
                                    <input type="text" className="w-full bg-muted/50 border border-border p-2 rounded-lg text-sm"
                                        value={formData.map} onChange={e => setFormData({ ...formData, map: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Date</label>
                                    <input type="date" className="w-full bg-muted/50 border border-border p-2 rounded-lg text-sm"
                                        value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground block mb-1">Time</label>
                                    <input type="time" className="w-full bg-muted/50 border border-border p-2 rounded-lg text-sm"
                                        value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Max Players</label>
                                <input type="number" className="w-full bg-muted/50 border border-border p-2 rounded-lg text-sm"
                                    value={formData.maxPlayers} onChange={e => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                                />
                            </div>

                            <div className="border-t border-border pt-4">
                                <p className="text-xs text-muted-foreground mb-2">Room Details (optional)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Room ID" className="w-full bg-muted/50 border border-border p-2 rounded-lg text-sm"
                                        value={formData.roomId} onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                                    />
                                    <input type="text" placeholder="Password" className="w-full bg-muted/50 border border-border p-2 rounded-lg text-sm"
                                        value={formData.roomPassword} onChange={e => setFormData({ ...formData, roomPassword: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button disabled={isLoading} type="submit" className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm">
                                {isLoading ? <Loader2 className="animate-spin mx-auto w-4 h-4" /> : "Create Tournament"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
