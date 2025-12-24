import { useState } from "react";
import { Trophy, Users, Coins, Loader2, Gamepad2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, runTransaction, increment, getDoc, setDoc, collection, Timestamp } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TournamentCardProps {
    id: string;
    title: string;
    prizePool: string;
    entryFee: string; // Keep as string for display, parse for logic if needed
    currentSlots: number;
    maxSlots: number;
    isLive?: boolean;
    game?: string;
}

export default function TournamentCard({
    id,
    title,
    prizePool,
    entryFee,
    currentSlots,
    maxSlots,
    isLive,
    game
}: TournamentCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [ingameName, setIngameName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleJoin = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("Please login to join tournaments!");
            return;
        }

        if (!ingameName.trim()) {
            alert("Please enter your in-game name.");
            return;
        }

        setIsLoading(true);
        const feeString = String(entryFee);
        const feeAmount = Number(feeString.replace(/[^0-9.-]+/g, ""));

        try {
            await runTransaction(db, async (transaction) => {
                // --- READ PHASE ---
                const tournamentRef = doc(db, "tournaments", id);
                const userRef = doc(db, "users", user.uid);
                const participantRef = doc(db, "tournaments", id, "participants", user.uid);

                const [tournamentDoc, userDoc, pDoc] = await Promise.all([
                    transaction.get(tournamentRef),
                    transaction.get(userRef),
                    transaction.get(participantRef)
                ]);

                // --- VALIDATION PHASE ---
                if (!tournamentDoc.exists()) throw "Tournament does not exist!";
                if (!userDoc.exists()) throw "User profile not found!";
                if (pDoc.exists()) throw "You have already joined this tournament!";

                const tData = tournamentDoc.data();
                if (tData.currentPlayers >= tData.maxPlayers) {
                    throw "Tournament is full!";
                }

                const userData = userDoc.data();
                if (userData.walletBalance < feeAmount) {
                    throw `Insufficient balance! You need ₹${feeAmount}. Current: ₹${userData.walletBalance}`;
                }

                // --- WRITE PHASE ---
                // 1. Deduct Balance
                transaction.update(userRef, {
                    walletBalance: increment(-feeAmount)
                });

                // 2. Add Participant
                transaction.set(participantRef, {
                    userId: user.uid,
                    displayName: user.displayName,
                    email: user.email,
                    ingameName: ingameName,
                    joinedAt: Timestamp.now(),
                    feePaid: feeAmount
                });

                // 3. Increment Player Count
                transaction.update(tournamentRef, {
                    currentPlayers: increment(1)
                });

                // 4. Record Transaction
                const pendingTxRef = doc(collection(db, "transactions"));
                transaction.set(pendingTxRef, {
                    userId: user.uid,
                    amount: feeAmount,
                    type: 'entry',
                    description: `Joined Tournament: ${title}`,
                    status: 'success',
                    timestamp: Timestamp.now()
                });
            });

            setIsOpen(false);
            alert("Successfully joined tournament!");
        } catch (e: any) {
            console.error(e);
            alert(e.toString().replace("Error: ", ""));
        }
        setIsLoading(false);
    };

    const isFull = currentSlots >= maxSlots;
    const progress = (currentSlots / maxSlots) * 100;

    return (
        <div className="group relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)]">
            {/* Banner */}
            <div className="h-40 w-full bg-gradient-to-br from-neutral-900 to-neutral-800 group-hover:scale-105 transition-transform duration-500 relative">
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                <div className="absolute top-3 right-3 flex gap-2">
                    <span className="bg-black/60 text-white text-xs font-bold px-2 py-1 rounded backdrop-blur-md uppercase">{game}</span>
                    {isLive && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded animate-pulse shadow-lg shadow-red-500/20">LIVE</span>
                    )}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
            </div>

            <div className="p-5 relative">
                <h3 className="font-rajdhani font-bold text-2xl text-white mb-1 group-hover:text-primary transition-colors truncate">{title}</h3>
                <p className="text-muted-foreground text-sm mb-4">Battle Royale • Squad • {game}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                        <Trophy className="text-yellow-500 h-4 w-4" />
                        <span>Prize: <span className="font-bold text-white text-yellow-400">₹{prizePool}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-300">
                        <Coins className="text-primary h-4 w-4" />
                        <span>Entry: <span className="font-bold text-white text-green-400">₹{entryFee}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-300 col-span-2">
                        <Users className="text-blue-400 h-4 w-4" />
                        <span>{currentSlots}/{maxSlots} Joined</span>
                        <div className="ml-auto w-24 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-primary/80 transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <button disabled={isFull} className="w-full py-3 bg-white/5 hover:bg-primary hover:text-white border border-white/10 hover:border-primary rounded-xl font-bold font-rajdhani tracking-wide transition-all duration-300 shadow-lg shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-inherit disabled:hover:border-white/10">
                            {isFull ? "FULL" : "JOIN TOURNAMENT"}
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-neutral-900 border-white/10 text-white sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-rajdhani text-2xl">Confirm Registration</DialogTitle>
                        </DialogHeader>

                        <div className="py-4 space-y-4">
                            <div className="p-4 bg-black/40 rounded-lg border border-white/5 space-y-2">
                                <h4 className="text-sm font-bold text-muted-foreground uppercase">Confirmation Details</h4>
                                <div className="flex justify-between text-sm">
                                    <span>Tournament</span>
                                    <span className="font-bold text-white">{title}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Entry Fee</span>
                                    <span className="font-bold text-green-400">₹{entryFee}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ingame">In-Game Name (IGN)</Label>
                                <Input
                                    id="ingame"
                                    placeholder="e.g. Mortal"
                                    className="bg-black/50 border-white/10"
                                    value={ingameName}
                                    onChange={(e) => setIngameName(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Make sure this matches your name in {game} exactly.</p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                className="w-full bg-primary hover:bg-primary/90 font-bold"
                                onClick={handleJoin}
                                disabled={isLoading}
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Registering..." : `Pay ₹${entryFee} & Join`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
