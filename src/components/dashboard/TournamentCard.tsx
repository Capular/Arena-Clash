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
    const participantPercentage = (currentSlots / maxSlots) * 100;

    return (
        <div className="group relative card-premium tournament-card p-6 cursor-pointer">
            {/* Shine effect on hover */}
            <div className="card-shine" />

            {/* Status indicator with pulse animation */}
            {isLive && (
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                    </span>
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wide">Live</span>
                </div>
            )}

            {/* Game icon with hover rotation */}
            <div className="mb-4 transition-transform duration-300 group-hover:rotate-6">
                <Gamepad2 className="w-10 h-10 text-primary/60" />
            </div>

            {/* Title with gradient on hover */}
            <h3 className="text-xl font-bold mb-3 transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-primary/60 font-rajdhani">
                {title}
            </h3>

            {/* Game badge */}
            {game && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-4 bg-primary/10 rounded-full border border-primary/20">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">{game}</span>
                </div>
            )}

            {/* Prize pool with animated icon */}
            <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500 transition-transform duration-300 group-hover:scale-110" />
                <span className="text-lg font-bold text-yellow-400">{prizePool}</span>
            </div>

            {/* Participants progress section */}
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        Participants
                    </span>
                    <span className="font-medium text-foreground">
                        {currentSlots}/{maxSlots}
                    </span>
                </div>

                {/* Animated progress bar */}
                <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${participantPercentage}%` }}
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </div>
                </div>
            </div>

            {/* Entry fee and Join button */}
            <div className="flex items-center justify-between mt-6">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-semibold text-foreground">{entryFee}</span>
                </div>

                {/* Join Dialog */}
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <button disabled={isFull} className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/50 font-rajdhani disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none">
                            {isFull ? "FULL" : "Join Now"}
                        </button>
                    </DialogTrigger>
                    <DialogContent className="glass-effect border-border">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold font-rajdhani">Join Tournament</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="ingameName" className="text-sm font-medium">In-Game Name</Label>
                                <Input
                                    id="ingameName"
                                    placeholder="Enter your in-game ID"
                                    value={ingameName}
                                    onChange={(e) => setIngameName(e.target.value)}
                                    className="mt-2 bg-card/50 border-border focus:border-primary transition-colors"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="p-4 bg-muted/20 rounded-lg border border-border/50 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Entry Fee:</span>
                                    <span className="font-bold text-foreground">₹{entryFee}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Prize Pool:</span>
                                    <span className="font-bold text-yellow-400">₹{prizePool}</span>
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={isLoading}
                                className="border-border hover:bg-muted/50"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleJoin}
                                disabled={isLoading}
                                className="btn-premium"
                            >
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLoading ? "Joining..." : "Confirm Join"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Glow effect on hover */}
            <div className="absolute -inset-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 rounded-xl opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100 -z-10" />
        </div>
    );
}
