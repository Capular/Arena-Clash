"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { doc, getDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ArrowLeft, Save, Trash2, Power, ImageIcon, Plus, X, MapPin, Settings, Bot } from "lucide-react";
import GsapLoader, { GsapLoaderInline } from "@/components/ui/GsapLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import gsap from "gsap";

interface Game {
    id: string;
    name: string;
    coverImage?: string;
    description?: string;
    isActive: boolean;
    createdAt?: any;
    gamemodes?: string[];
    rules?: string;
    bannerImages?: string[];
    socialLinks?: {
        discord?: string;
        website?: string;
    };
    defaultSettings?: {
        minEntryFee?: number;
        maxEntryFee?: number;
        perKillBonus?: number;
    };
}

type TabId = "overview" | "gamemodes" | "settings" | "automation";

export default function GameDetailPage() {
    const params = useParams();
    const router = useRouter();
    const gameId = params.id as string;

    const [game, setGame] = useState<Game | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>("overview");

    // Form states
    const [name, setName] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [description, setDescription] = useState("");
    const [gamemodes, setGamemodes] = useState<string[]>([]);
    const [newGamemode, setNewGamemode] = useState("");
    const [rules, setRules] = useState("");
    const [discord, setDiscord] = useState("");
    const [website, setWebsite] = useState("");
    const [minEntryFee, setMinEntryFee] = useState(0);
    const [maxEntryFee, setMaxEntryFee] = useState(0);
    const [perKillBonus, setPerKillBonus] = useState(0);

    // Refs for GSAP
    const headerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const tabContentRef = useRef<HTMLDivElement>(null);

    const fetchGame = async () => {
        setIsLoading(true);
        try {
            const docRef = doc(db, "games", gameId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() } as Game;
                setGame(data);
                // Populate form
                setName(data.name || "");
                setCoverImage(data.coverImage || "");
                setDescription(data.description || "");
                setGamemodes(data.gamemodes || []);
                setRules(data.rules || "");
                setDiscord(data.socialLinks?.discord || "");
                setWebsite(data.socialLinks?.website || "");
                setMinEntryFee(data.defaultSettings?.minEntryFee || 0);
                setMaxEntryFee(data.defaultSettings?.maxEntryFee || 0);
                setPerKillBonus(data.defaultSettings?.perKillBonus || 0);
            } else {
                router.push("/admin/games");
            }
        } catch (error) {
            console.error("Error fetching game:", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchGame();
    }, [gameId]);

    // GSAP Animations
    useEffect(() => {
        if (!isLoading && game) {
            gsap.fromTo(headerRef.current, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out" });
            gsap.fromTo(contentRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.1 });
        }
    }, [isLoading, game]);

    // Tab change animation
    useEffect(() => {
        if (tabContentRef.current) {
            gsap.fromTo(tabContentRef.current, { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.3, ease: "power2.out" });
        }
    }, [activeTab]);

    const handleSave = async () => {
        if (!game) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "games", game.id), {
                name: name.trim(),
                coverImage: coverImage.trim(),
                description: description.trim(),
                gamemodes,
                rules: rules.trim(),
                socialLinks: {
                    discord: discord.trim(),
                    website: website.trim(),
                },
                defaultSettings: {
                    minEntryFee,
                    maxEntryFee,
                    perKillBonus,
                },
            });
            // Success animation
            gsap.fromTo(".save-btn", { scale: 1 }, { scale: 1.05, duration: 0.1, yoyo: true, repeat: 1 });
            fetchGame();
        } catch (error) {
            console.error("Error saving game:", error);
        }
        setIsSaving(false);
    };

    const handleToggleStatus = async () => {
        if (!game) return;
        try {
            await updateDoc(doc(db, "games", game.id), {
                isActive: !game.isActive
            });
            fetchGame();
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const handleDelete = async () => {
        if (!game) return;
        if (confirm("Are you sure you want to delete this game? This action cannot be undone.")) {
            await deleteDoc(doc(db, "games", game.id));
            router.push("/admin/games");
        }
    };

    const addGamemode = () => {
        if (newGamemode.trim() && !gamemodes.includes(newGamemode.trim())) {
            setGamemodes([...gamemodes, newGamemode.trim()]);
            setNewGamemode("");
        }
    };

    const removeGamemode = (modeName: string) => {
        setGamemodes(gamemodes.filter(m => m !== modeName));
    };

    const tabs = [
        { id: "overview" as TabId, label: "Overview", icon: ImageIcon },
        { id: "gamemodes" as TabId, label: "Gamemodes", icon: MapPin },
        { id: "automation" as TabId, label: "Automation", icon: Bot },
        { id: "settings" as TabId, label: "Settings", icon: Settings },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <GsapLoader size="lg" className="text-primary" />
            </div>
        );
    }

    if (!game) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <p>Game not found.</p>
                <Button variant="link" onClick={() => router.push("/admin/games")}>Go back</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div ref={headerRef} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/admin/games")} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-rajdhani text-foreground">{game.name}</h1>
                        <p className="text-sm text-muted-foreground">
                            {game.isActive ? (
                                <span className="text-green-500">● Active</span>
                            ) : (
                                <span className="text-red-500">● Inactive</span>
                            )}
                            {" · "}Added {game.createdAt?.toDate ? game.createdAt.toDate().toLocaleDateString() : "recently"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleToggleStatus} className="gap-1.5">
                        <Power size={14} /> {game.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
                        <Trash2 size={14} /> Delete
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving} className="save-btn gap-1.5">
                        {isSaving ? <GsapLoaderInline size="sm" className="mr-1" /> : <Save size={14} />} Save Changes
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar - Cover Image */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
                        <div className="aspect-[3/4] bg-gradient-to-br from-primary/20 to-transparent relative">
                            {coverImage ? (
                                <img src={coverImage} alt={name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-16 h-16 text-muted-foreground/20" />
                                </div>
                            )}
                        </div>
                        <div className="p-4 space-y-2">
                            <Label className="text-foreground text-xs">Cover Image URL</Label>
                            <Input
                                placeholder="https://..."
                                value={coverImage}
                                onChange={(e) => setCoverImage(e.target.value)}
                                className="bg-muted/30 border-border text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {/* Tabs */}
                    <div className="flex gap-1 mb-6 bg-muted/30 p-1 rounded-lg w-fit">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                                    ? "bg-card text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div ref={tabContentRef}>
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                {/* Name */}
                                <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
                                    <h3 className="font-bold text-foreground font-rajdhani">Basic Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Game Name</Label>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="bg-muted/30 border-border"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Discord Server</Label>
                                            <Input
                                                placeholder="https://discord.gg/..."
                                                value={discord}
                                                onChange={(e) => setDiscord(e.target.value)}
                                                className="bg-muted/30 border-border"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-foreground">Website</Label>
                                        <Input
                                            placeholder="https://..."
                                            value={website}
                                            onChange={(e) => setWebsite(e.target.value)}
                                            className="bg-muted/30 border-border"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
                                    <h3 className="font-bold text-foreground font-rajdhani">Description</h3>
                                    <Textarea
                                        placeholder="Write a brief description about this game..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="bg-muted/30 border-border min-h-[120px]"
                                    />
                                </div>

                                {/* Rules */}
                                <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
                                    <h3 className="font-bold text-foreground font-rajdhani">Tournament Rules</h3>
                                    <Textarea
                                        placeholder="Enter default tournament rules for this game..."
                                        value={rules}
                                        onChange={(e) => setRules(e.target.value)}
                                        className="bg-muted/30 border-border min-h-[150px]"
                                    />
                                    <p className="text-xs text-muted-foreground">These rules will be shown to players before joining tournaments.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === "gamemodes" && (
                            <div className="space-y-6">
                                <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
                                    <h3 className="font-bold text-foreground font-rajdhani">Available Gamemodes</h3>
                                    <p className="text-sm text-muted-foreground">Add gamemodes that are available for tournaments in this game.</p>

                                    {/* Add Gamemode */}
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Enter gamemode (e.g. Battle Royale, Clash Squad)"
                                            value={newGamemode}
                                            onChange={(e) => setNewGamemode(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && addGamemode()}
                                            className="bg-muted/30 border-border"
                                        />
                                        <Button onClick={addGamemode} disabled={!newGamemode.trim()}>
                                            <Plus size={16} /> Add
                                        </Button>
                                    </div>

                                    {/* Gamemodes List */}
                                    {gamemodes.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4">
                                            {gamemodes.map((modeName, idx) => (
                                                <div
                                                    key={idx}
                                                    className="gamemode-item flex items-center justify-between bg-muted/30 border border-border/50 rounded-lg px-3 py-2 group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={14} className="text-primary" />
                                                        <span className="text-sm text-foreground">{modeName}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => removeGamemode(modeName)}
                                                        className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-muted-foreground border border-dashed border-border/50 rounded-lg">
                                            <MapPin className="mx-auto h-8 w-8 opacity-20 mb-2" />
                                            <p className="text-sm">No gamemodes added yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === "settings" && (
                            <div className="space-y-6">
                                <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
                                    <h3 className="font-bold text-foreground font-rajdhani">Default Tournament Settings</h3>
                                    <p className="text-sm text-muted-foreground">These values will be suggested when creating tournaments for this game.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Min Entry Fee (₹)</Label>
                                            <Input
                                                type="number"
                                                value={minEntryFee}
                                                onChange={(e) => setMinEntryFee(Number(e.target.value))}
                                                className="bg-muted/30 border-border"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Max Entry Fee (₹)</Label>
                                            <Input
                                                type="number"
                                                value={maxEntryFee}
                                                onChange={(e) => setMaxEntryFee(Number(e.target.value))}
                                                className="bg-muted/30 border-border"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-foreground">Per Kill Bonus (₹)</Label>
                                            <Input
                                                type="number"
                                                value={perKillBonus}
                                                onChange={(e) => setPerKillBonus(Number(e.target.value))}
                                                className="bg-muted/30 border-border"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === "automation" && (
                            <div className="space-y-6">
                                <div className="bg-card border border-border/50 rounded-xl p-10 text-center space-y-4">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Bot className="w-8 h-8 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-xl text-foreground font-rajdhani">Automation Features</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Configure automated tournament creation, result verification, and bot integration for this game.
                                    </p>
                                    <div className="pt-4">
                                        <Button variant="outline" disabled>Coming Soon</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
