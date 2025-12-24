"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, Timestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Trash2, Edit2, Calendar, Trophy, Gamepad2, X } from "lucide-react";

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

    // Form State
    const [formData, setFormData] = useState({
        game: 'BGMI',
        title: '',
        map: 'Erangel',
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
            alert("Tournament Created!");
        } catch (error) {
            console.error("Error adding tournament: ", error);
        }
        setIsLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this tournament?")) {
            await deleteDoc(doc(db, "tournaments", id));
            fetchTournaments();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold font-rajdhani">All Tournaments</h2>
                <button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <Plus size={18} /> Add Tournament
                </button>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {tournaments.map((t) => (
                    <div key={t.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center">
                                <Gamepad2 className="text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{t.title || t.game}</h3>
                                <p className="text-sm text-muted-foreground">{t.date} at {t.time} • Map: {t.map}</p>
                            </div>
                        </div>
                        <div className="flex gap-6 text-sm">
                            <div className="text-center">
                                <p className="text-muted-foreground">Entry</p>
                                <p className="font-bold text-green-400">₹{t.entryFee}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-muted-foreground">Prize</p>
                                <p className="font-bold text-yellow-400">₹{t.prizePool}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-muted-foreground">Status</p>
                                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs uppercase font-bold">{t.status}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {/* Future: Edit functionality */}
                            <button onClick={() => handleDelete(t.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
                    <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl relative">
                        <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-white"><X /></button>
                        <h2 className="text-xl font-bold mb-6">Create New Tournament</h2>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Game</label>
                                <select
                                    className="w-full bg-black/50 border border-white/10 p-2 rounded-lg"
                                    value={formData.game}
                                    onChange={e => setFormData({ ...formData, game: e.target.value })}
                                >
                                    <option value="BGMI">BGMI</option>
                                    <option value="Free Fire">Free Fire</option>
                                    <option value="COD Mobile">COD Mobile</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Title (Optional)</label>
                                <input type="text" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg" placeholder="e.g. Weekly Scrims #44"
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Map</label>
                                <input type="text" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg"
                                    value={formData.map} onChange={e => setFormData({ ...formData, map: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Max Players</label>
                                <input type="number" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg"
                                    value={formData.maxPlayers} onChange={e => setFormData({ ...formData, maxPlayers: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Entry Fee (₹)</label>
                                <input type="number" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg"
                                    value={formData.entryFee} onChange={e => setFormData({ ...formData, entryFee: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Prize Pool (₹)</label>
                                <input type="number" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg"
                                    value={formData.prizePool} onChange={e => setFormData({ ...formData, prizePool: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Per Kill (₹)</label>
                                <input type="number" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg"
                                    value={formData.perKill} onChange={e => setFormData({ ...formData, perKill: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Date</label>
                                <input type="date" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white"
                                    value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-muted-foreground block mb-1">Time</label>
                                <input type="time" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg text-white"
                                    value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
                                />
                            </div>

                            <div className="md:col-span-2 border-t border-white/10 pt-4 mt-2">
                                <h3 className="text-sm font-bold mb-2 text-yellow-500">Room Details (Hidden from users until filled)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Room ID" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg"
                                        value={formData.roomId} onChange={e => setFormData({ ...formData, roomId: e.target.value })}
                                    />
                                    <input type="text" placeholder="Password" className="w-full bg-black/50 border border-white/10 p-2 rounded-lg"
                                        value={formData.roomPassword} onChange={e => setFormData({ ...formData, roomPassword: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-4">
                                <button disabled={isLoading} type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-all">
                                    {isLoading ? "Creating..." : "Create Tournament"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
