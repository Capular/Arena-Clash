"use client";

import { useEffect, useState } from "react";
import { collectionGroup, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth/AuthProvider";
import { Loader2, Calendar, Trophy, Gamepad2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Registration {
    tournamentId: string;
    tournamentTitle: string;
    ingameName: string;
    joinedAt: any;
    status: string; // 'Upcoming', 'Live', 'Completed'
    game: string;
    prizePool: string;
}

export default function MyRegistrationsView() {
    const { user } = useAuth();
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRegistrations = async () => {
            if (!user) return;

            try {
                // Query all 'participants' subcollections where userId matches current user
                const q = query(collectionGroup(db, 'participants'), where('userId', '==', user.uid));
                const querySnapshot = await getDocs(q);

                const promises = querySnapshot.docs.map(async (pDoc) => {
                    const data = pDoc.data();
                    // Parent of participant doc is 'participants' collection, parent of that is the Tournament Doc
                    // path: tournaments/{id}/participants/{uid}
                    // pDoc.ref.parent.parent should be the tournament doc ref
                    const tournamentRef = pDoc.ref.parent.parent;

                    if (tournamentRef) {
                        const tDoc = await getDoc(tournamentRef);
                        if (tDoc.exists()) {
                            const tData = tDoc.data();
                            return {
                                tournamentId: tDoc.id,
                                tournamentTitle: tData.title,
                                ingameName: data.ingameName,
                                joinedAt: data.joinedAt,
                                status: tData.status || (tData.isLive ? 'Live' : 'Upcoming'),
                                game: tData.game || 'Unknown',
                                prizePool: tData.prizePool
                            } as Registration;
                        }
                    }
                    return null;
                });

                const results = await Promise.all(promises);
                const validResults = results.filter((r): r is Registration => r !== null);
                // Sort by recent
                validResults.sort((a, b) => b.joinedAt.seconds - a.joinedAt.seconds);

                setRegistrations(validResults);
            } catch (error) {
                console.error("Error fetching registrations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRegistrations();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (registrations.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-white mb-2 font-rajdhani">No Registrations Yet</h2>
                <p className="text-muted-foreground">Join a tournament to see it here!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
            <h2 className="text-3xl font-bold text-white font-rajdhani flex items-center gap-3">
                <Calendar className="text-primary" />
                My Registrations
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registrations.map((reg) => (
                    <Card key={reg.tournamentId} className="bg-card/50 border-border hover:border-primary/50 transition-all group overflow-hidden">
                        <div className="h-24 bg-gradient-to-br from-neutral-900 to-black relative">
                            <div className="absolute inset-0 bg-primary/10 mix-blend-overlay" />
                            <Badge className={`absolute top-3 right-3 ${reg.status === 'Live' ? 'bg-red-500 animate-pulse' : 'bg-primary'}`}>
                                {reg.status}
                            </Badge>
                            <div className="absolute bottom-3 left-4 flex items-center gap-2">
                                <Gamepad2 className="w-4 h-4 text-white/70" />
                                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">{reg.game}</span>
                            </div>
                        </div>
                        <CardHeader>
                            <CardTitle className="font-rajdhani text-xl text-white truncate">{reg.tournamentTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">IGN:</span>
                                <span className="text-white font-mono bg-white/5 px-2 py-1 rounded">{reg.ingameName}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Prize Pool:</span>
                                <span className="text-yellow-400 font-bold">₹{reg.prizePool}</span>
                            </div>
                            <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs text-muted-foreground">
                                <span>Joined: {reg.joinedAt?.toDate ? reg.joinedAt.toDate().toLocaleDateString() : 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
