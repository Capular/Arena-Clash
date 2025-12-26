"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, deleteDoc, doc, Timestamp, query, orderBy, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Trash2, Gamepad2, PlusCircle, Pencil, Power, ImageIcon } from "lucide-react";
import gsap from "gsap";
import GsapLoader, { GsapLoaderInline } from "@/components/ui/GsapLoader";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Game {
    id: string;
    name: string;
    coverImage?: string;
    isActive: boolean;
    createdAt?: any;
}

export default function AdminGames() {
    const router = useRouter();
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAddLoading, setIsAddLoading] = useState(false);
    const [newGameName, setNewGameName] = useState("");
    const [newGameCover, setNewGameCover] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Edit state
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingGame, setEditingGame] = useState<Game | null>(null);
    const [editGameName, setEditGameName] = useState("");
    const [editGameCover, setEditGameCover] = useState("");
    const [isEditLoading, setIsEditLoading] = useState(false);

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

        setIsAddLoading(true);
        try {
            await addDoc(collection(db, "games"), {
                name: newGameName.trim(),
                coverImage: newGameCover.trim() || "",
                isActive: true,
                createdAt: Timestamp.now()
            });
            setNewGameName("");
            setNewGameCover("");
            setIsDialogOpen(false);
            fetchGames();
        } catch (error) {
            console.error("Error adding game:", error);
        }
        setIsAddLoading(false);
    };

    const handleDeleteGame = async (id: string) => {
        if (confirm("Are you sure you want to delete this game? This action cannot be undone.")) {
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

    const openEditDialog = (game: Game) => {
        setEditingGame(game);
        setEditGameName(game.name);
        setEditGameCover(game.coverImage || "");
        setIsEditDialogOpen(true);
    };

    const handleEditGame = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGame || !editGameName.trim()) return;

        setIsEditLoading(true);
        try {
            await updateDoc(doc(db, "games", editingGame.id), {
                name: editGameName.trim(),
                coverImage: editGameCover.trim() || ""
            });
            setIsEditDialogOpen(false);
            setEditingGame(null);
            fetchGames();
        } catch (error) {
            console.error("Error updating game:", error);
        }
        setIsEditLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-rajdhani text-foreground">All Games</h2>

                {/* Add Game Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 gap-2">
                            <PlusCircle size={18} /> Add New Game
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-card border-border">
                        <DialogHeader>
                            <DialogTitle className="text-foreground">Add Game</DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Add a new game to the platform. It will appear in tournament creation and user filters.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddGame} className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-foreground">Game Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. BGMI, COD Mobile, Valorant"
                                    value={newGameName}
                                    onChange={(e) => setNewGameName(e.target.value)}
                                    className="bg-muted/30 border-border text-foreground"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cover" className="text-foreground">Cover Image URL</Label>
                                <Input
                                    id="cover"
                                    placeholder="https://example.com/game-cover.jpg"
                                    value={newGameCover}
                                    onChange={(e) => setNewGameCover(e.target.value)}
                                    className="bg-muted/30 border-border text-foreground"
                                />
                                <p className="text-xs text-muted-foreground">Paste a direct link to an image (optional)</p>
                            </div>
                            {newGameCover && (
                                <div className="rounded-lg overflow-hidden border border-border aspect-video bg-muted/10">
                                    <img src={newGameCover} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                </div>
                            )}
                            <DialogFooter>
                                <Button type="submit" disabled={isAddLoading || !newGameName.trim()} className="w-full">
                                    {isAddLoading ? <GsapLoaderInline size="sm" className="mr-2" /> : null}
                                    Add Game
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Edit Game Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Edit Game</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Update game details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditGame} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-foreground">Game Name *</Label>
                            <Input
                                id="edit-name"
                                placeholder="e.g. BGMI, COD Mobile, Valorant"
                                value={editGameName}
                                onChange={(e) => setEditGameName(e.target.value)}
                                className="bg-muted/30 border-border text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-cover" className="text-foreground">Cover Image URL</Label>
                            <Input
                                id="edit-cover"
                                placeholder="https://example.com/game-cover.jpg"
                                value={editGameCover}
                                onChange={(e) => setEditGameCover(e.target.value)}
                                className="bg-muted/30 border-border text-foreground"
                            />
                        </div>
                        {editGameCover && (
                            <div className="rounded-lg overflow-hidden border border-border aspect-video bg-muted/10">
                                <img src={editGameCover} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={isEditLoading || !editGameName.trim()} className="w-full">
                                {isEditLoading ? <GsapLoaderInline size="sm" className="mr-2" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <GsapLoader size="lg" className="text-primary" />
                </div>
            ) : games.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-muted/5">
                    <Gamepad2 className="mx-auto h-12 w-12 opacity-20 mb-4" />
                    <p>No games added yet. Click "Add New Game" to start.</p>
                </div>
            ) : (
                <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {games.map((game) => (
                        <div
                            key={game.id}
                            className={`relative bg-card border rounded-2xl overflow-hidden ${game.isActive ? 'border-border/50' : 'border-red-500/30 opacity-60'
                                }`}
                            onMouseEnter={(e) => {
                                gsap.to(e.currentTarget, { y: -4, duration: 0.3, ease: "power2.out" });
                                gsap.to(e.currentTarget.querySelector('.game-cover'), { scale: 1.05, duration: 0.5, ease: "power2.out" });
                            }}
                            onMouseLeave={(e) => {
                                gsap.to(e.currentTarget, { y: 0, duration: 0.3, ease: "power2.out" });
                                gsap.to(e.currentTarget.querySelector('.game-cover'), { scale: 1, duration: 0.5, ease: "power2.out" });
                            }}
                        >
                            {/* Cover Image */}
                            <div className="aspect-[16/10] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent relative overflow-hidden">
                                {game.coverImage ? (
                                    <img
                                        src={game.coverImage}
                                        alt={game.name}
                                        className="game-cover w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                                    </div>
                                )}

                                {/* Status Badge */}
                                <div className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-md ${game.isActive
                                    ? 'bg-green-500/80 text-white'
                                    : 'bg-red-500/80 text-white'
                                    }`}>
                                    {game.isActive ? 'Active' : 'Inactive'}
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={() => handleDeleteGame(game.id)}
                                    className="absolute top-3 right-3 p-2 bg-black/50 backdrop-blur-md text-white/70 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    title="Delete Game"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <h3 className="font-bold text-lg text-foreground font-rajdhani mb-1 truncate">{game.name}</h3>
                                <p className="text-xs text-muted-foreground mb-4">
                                    Added {game.createdAt?.toDate ? game.createdAt.toDate().toLocaleDateString() : 'Just now'}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 gap-1.5 text-xs h-9"
                                        onClick={() => router.push(`/admin/games/${game.id}`)}
                                    >
                                        <Pencil size={14} /> Edit
                                    </Button>
                                    <Button
                                        variant={game.isActive ? "destructive" : "default"}
                                        size="sm"
                                        className={`flex-1 gap-1.5 text-xs h-9 ${!game.isActive ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                        onClick={() => toggleGameStatus(game)}
                                    >
                                        <Power size={14} /> {game.isActive ? 'Deactivate' : 'Activate'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
