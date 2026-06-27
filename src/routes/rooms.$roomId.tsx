import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Room, RoomEvent, Track, type RemoteParticipant, type Participant } from "livekit-client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteLivekitRoom,
  getLivekitToken,
  muteLivekitParticipant,
  promoteLivekitParticipant,
  removeLivekitParticipant,
} from "@/lib/livekit.functions";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Mic, MicOff, Hand, LogOut, Users, Lock, Globe, Crown, Loader2,
  UserMinus, Volume2, Copy, Check, Shield, X, ArrowLeft, Radio, Smile,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const REACTION_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "👏", "🚀", "💡"] as const;
const REACTION_TTL_MS = 3200;

interface LiveReaction {
  id: string;
  userId: string;
  emoji: string;
}
import type { Room as DbRoom, RoomParticipant } from "@/lib/rooms";
import { ProfileViewDialog } from "@/components/ProfileViewDialog";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/rooms/$roomId")({
  component: RoomPage,
});

interface ProfileLite {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  professional_title: string | null;
  avatar_url: string | null;
}

function RoomPage() {
  const { roomId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const tokenFn = useServerFn(getLivekitToken);
  const promoteParticipantFn = useServerFn(promoteLivekitParticipant);
  const muteParticipantFn = useServerFn(muteLivekitParticipant);
  const removeParticipantFn = useServerFn(removeLivekitParticipant);
  const deleteRoomFn = useServerFn(deleteLivekitRoom);

  const [room, setRoom] = useState<DbRoom | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [loading, setLoading] = useState(true);
  const [passwordPrompt, setPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");

  // LiveKit
  const lkRoomRef = useRef<Room | null>(null);
  const [lkConnected, setLkConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [muted, setMuted] = useState(true);
  const [speakingIds, setSpeakingIds] = useState<Set<string>>(new Set());
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const audioElsRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

  const isHost = !!user && !!room && user.id === room.host_id;
  const myParticipant = useMemo(
    () => participants.find((p) => p.user_id === user?.id) ?? null,
    [participants, user?.id],
  );
  const isModerator = myParticipant?.role === "moderator";
  const canModerate = isHost || isModerator;
  const canPublish = myParticipant?.role === "host" || myParticipant?.role === "moderator" || myParticipant?.role === "speaker";

  // Profile view dialog
  const [viewProfileId, setViewProfileId] = useState<string | null>(null);
  const openProfile = useCallback((uid: string) => setViewProfileId(uid), []);

  // Live reactions
  const [reactions, setReactions] = useState<LiveReaction[]>([]);
  const reactionChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const pushReaction = useCallback((userId: string, emoji: string) => {
    const id = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setReactions((prev) => [...prev, { id, userId, emoji }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== id));
    }, REACTION_TTL_MS);
  }, []);


  const loadProfiles = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    const { data } = await supabase
      .from("profiles")
      .select("id,first_name,last_name,username,professional_title,avatar_url")
      .in("id", ids);
    setProfiles((prev) => {
      const next = { ...prev };
      (data ?? []).forEach((p) => { next[(p as ProfileLite).id] = p as ProfileLite; });
      return next;
    });
  }, []);

  const reloadParticipants = useCallback(async () => {
    const { data } = await supabase
      .from("room_participants")
      .select("*")
      .eq("room_id", roomId);
    const list = (data ?? []) as unknown as RoomParticipant[];
    setParticipants(list);
    await loadProfiles(list.map((p) => p.user_id));
  }, [roomId, loadProfiles]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("rooms").select("*").eq("id", roomId).maybeSingle();
      if (cancelled) return;
      setRoom((data as unknown as DbRoom) ?? null);
      await reloadParticipants();
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [roomId, reloadParticipants]);

  // Realtime subscription for participants + room status
  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` }, async (payload) => {
        const row = payload.new as unknown as RoomParticipant;
        // System message: someone joined
        if (row.user_id !== user?.id) {
          const { data: pr } = await supabase
            .from("profiles")
            .select("first_name,last_name,username")
            .eq("id", row.user_id)
            .maybeSingle();
          const name = [pr?.first_name, pr?.last_name].filter(Boolean).join(" ") || pr?.username || "Someone";
          toast(`${name} joined the room`, { icon: "👋" });
        }
        reloadParticipants();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` }, () => {
        reloadParticipants();
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "room_participants", filter: `room_id=eq.${roomId}` }, async (payload) => {
        const oldRow = payload.old as Partial<RoomParticipant>;
        // If I was removed by host, force-leave
        if (oldRow.user_id && user && oldRow.user_id === user.id) {
          toast.error("You have been removed from this room.");
          disconnect();
          setTimeout(() => navigate({ to: "/" }), 800);
          return;
        }
        if (oldRow.user_id) {
          const pr = profiles[oldRow.user_id];
          const name = [pr?.first_name, pr?.last_name].filter(Boolean).join(" ") || pr?.username || "A member";
          toast(`${name} left the room`, { icon: "👋" });
        }
        reloadParticipants();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, (payload) => {
        setRoom(payload.new as unknown as DbRoom);
        if ((payload.new as unknown as DbRoom).status === "ended") {
          toast.info("Room has ended");
          disconnect();
          setTimeout(() => navigate({ to: "/" }), 1500);
        }
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` }, () => {
        toast.info("Room has ended");
        disconnect();
        setTimeout(() => navigate({ to: "/" }), 800);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?.id]);


  // Realtime broadcast channel for emoji reactions (low-latency fanout)
  useEffect(() => {
    const ch = supabase.channel(`room-reactions:${roomId}`, {
      config: { broadcast: { self: true } },
    });
    ch.on("broadcast", { event: "reaction" }, (msg) => {
      const payload = msg.payload as { userId?: string; emoji?: string } | undefined;
      if (payload?.userId && payload.emoji) pushReaction(payload.userId, payload.emoji);
    }).subscribe();
    reactionChannelRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      reactionChannelRef.current = null;
    };
  }, [roomId, pushReaction]);

  const sendReaction = useCallback(async (emoji: string) => {
    if (!user || !room) return;
    if (!myParticipant) { toast.error("Join the room to react"); return; }
    const ch = reactionChannelRef.current;
    if (ch) {
      ch.send({ type: "broadcast", event: "reaction", payload: { userId: user.id, emoji } });
    }
    // Persist (fire-and-forget); RLS ensures only participants can insert
    void supabase.from("room_reactions").insert({ room_id: room.id, user_id: user.id, emoji } as never);
  }, [user, room, myParticipant]);


  // ---- LiveKit connect ----
  const connectToLivekit = useCallback(async (allowPublish: boolean) => {
    if (!room) return;
    if (lkRoomRef.current && lkConnected) return;
    setConnecting(true);
    try {
      const { token, url } = await tokenFn({ data: { roomName: room.livekit_room, canPublish: allowPublish } });
      const lk = new Room({ adaptiveStream: true, dynacast: true });
      lkRoomRef.current = lk;

      lk.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach() as HTMLAudioElement;
          el.autoplay = true;
          audioElsRef.current?.appendChild(el);
        }
      });
      lk.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((el) => el.remove());
      });
      lk.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
        setSpeakingIds(new Set(speakers.map((s) => s.identity)));
      });
      const refreshRemotes = () => setRemoteParticipants(Array.from(lk.remoteParticipants.values()));
      lk.on(RoomEvent.ParticipantConnected, refreshRemotes);
      lk.on(RoomEvent.ParticipantDisconnected, refreshRemotes);
      lk.on(RoomEvent.ConnectionStateChanged, () => {
        setLkConnected(lk.state === "connected");
      });
      lk.on(RoomEvent.Disconnected, () => {
        setLkConnected(false);
        lkRoomRef.current = null;
        setRemoteParticipants([]);
        setSpeakingIds(new Set());
      });
      lk.on(RoomEvent.Reconnected, () => toast.success("Reconnected"));
      lk.on(RoomEvent.Reconnecting, () => toast.info("Reconnecting…"));

      await lk.connect(url, token);
      setLkConnected(true);
      refreshRemotes();
      if (allowPublish) {
        try {
          // request mic permission, then start muted
          await lk.localParticipant.setMicrophoneEnabled(true);
          await lk.localParticipant.setMicrophoneEnabled(false);
          setMuted(true);
        } catch (micErr) {
          console.error(micErr);
          toast.error("Microphone access denied — you can listen but not speak");
        }
      }
      toast.success("Connected to voice");
    } catch (e) {
      console.error("LiveKit connect failed", e);
      toast.error("Failed to connect: " + ((e as Error).message ?? "unknown error"));
      try { lkRoomRef.current?.disconnect(); } catch { /* noop */ }
      lkRoomRef.current = null;
      setLkConnected(false);
    } finally {
      setConnecting(false);
    }
  }, [room, tokenFn, lkConnected]);

  const disconnect = useCallback(() => {
    try { lkRoomRef.current?.disconnect(); } catch { /* noop */ }
    lkRoomRef.current = null;
    setLkConnected(false);
    setRemoteParticipants([]);
    setSpeakingIds(new Set());
  }, []);

  useEffect(() => {
    return () => { try { lkRoomRef.current?.disconnect(); } catch { /* noop */ } };
  }, []);

  // Re-publish if role changes (e.g. listener accepted to speaker)
  useEffect(() => {
    const lk = lkRoomRef.current;
    if (!lk || !lkConnected) return;
    const hasPublish = lk.localParticipant.permissions?.canPublish === true;
    if (canPublish && !hasPublish) {
      disconnect();
      setTimeout(() => { void connectToLivekit(true); }, 150);
    }
  }, [canPublish, lkConnected, connectToLivekit, disconnect]);

  // ---- Join flow ----
  const joinRoom = useCallback(async () => {
    if (!user || !room) return;
    if (room.status === "locked" && room.host_id !== user.id) {
      toast.error("Room is locked"); return;
    }
    if (room.status === "ended") { toast.error("Room has ended"); return; }

    let myRole: RoomParticipant["role"] = myParticipant?.role
      ?? (room.host_id === user.id ? "host" : "listener");

    if (!myParticipant) {
      myRole = room.host_id === user.id ? "host" : "listener";
      const { error } = await supabase.from("room_participants").insert({
        room_id: room.id, user_id: user.id, role: myRole,
      } as never);
      if (error && !error.message.toLowerCase().includes("duplicate")) {
        toast.error(error.message); return;
      }
      await reloadParticipants();
    }
    await connectToLivekit(myRole === "host" || myRole === "speaker");
  }, [user, room, myParticipant, connectToLivekit, reloadParticipants]);

  const handleJoin = async () => {
    if (!user || !room) return;
    if (room.is_private && room.host_id !== user.id && !myParticipant) {
      setPasswordPrompt(true);
      return;
    }
    await joinRoom();
  };

  const submitPassword = async () => {
    if (!room) return;
    if (passwordInput !== (room.password ?? "")) return toast.error("Wrong password");
    setPasswordPrompt(false);
    await joinRoom();
  };

  // ---- Voice controls ----
  const toggleMute = async () => {
    const lk = lkRoomRef.current;
    if (!lk || !canPublish) return;
    const nextMuted = !muted;
    await lk.localParticipant.setMicrophoneEnabled(!nextMuted);
    setMuted(nextMuted);
  };

  const handleRaiseHand = async () => {
    if (!user || !myParticipant) return toast.error("Join the room before raising your hand");
    const { error } = await supabase.from("room_participants")
      .update({ hand_raised: !myParticipant.hand_raised } as never)
      .eq("id", myParticipant.id);
    if (error) return toast.error(error.message);
    await reloadParticipants();
    toast.success(myParticipant.hand_raised ? "Hand lowered" : "Hand raised — host will see your request");
  };

  const leaveRoom = async () => {
    if (!user) return;
    disconnect();
    if (myParticipant) {
      await supabase.from("room_participants").delete().eq("id", myParticipant.id);
    }
    navigate({ to: "/" });
  };

  // Self-demote: speaker moves themselves to audience
  const moveToAudience = async () => {
    if (!user || !myParticipant) return;
    if (myParticipant.role !== "speaker") return;
    setActionBusy("self-demote");
    try {
      const lk = lkRoomRef.current;
      try { await lk?.localParticipant.setMicrophoneEnabled(false); } catch { /* noop */ }
      setMuted(true);
      const { error } = await supabase.from("room_participants")
        .update({ role: "listener", hand_raised: false } as never)
        .eq("id", myParticipant.id);
      if (error) throw error;
      // reconnect without publish permission
      disconnect();
      setTimeout(() => { void connectToLivekit(false); }, 150);
      toast.success("You moved to the audience");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not move to audience");
    } finally {
      setActionBusy(null);
    }
  };

  // ---- Host actions ----
  const acceptHand = async (p: RoomParticipant) => {
    if (!room) return;
    setActionBusy(`accept-${p.id}`);
    try {
      const { error } = await supabase.from("room_participants")
      .update({ role: "speaker", hand_raised: false } as never)
      .eq("id", p.id);
      if (error) throw error;
      const livekitResult = await promoteParticipantFn({ data: { roomName: room.livekit_room, targetIdentity: p.user_id } });
      await reloadParticipants();
      toast.success(livekitResult.ok ? "Listener promoted to speaker" : "Speaker role saved — they will reconnect with mic access");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not promote listener");
    } finally {
      setActionBusy(null);
    }
  };
  const rejectHand = async (p: RoomParticipant) => {
    const { error } = await supabase.from("room_participants")
      .update({ hand_raised: false } as never)
      .eq("id", p.id);
    if (error) return toast.error(error.message);
    await reloadParticipants();
    toast.success("Request dismissed");
  };
  const muteParticipant = async (p: RoomParticipant) => {
    if (!room) return;
    setActionBusy(`mute-${p.id}`);
    try {
      const livekitResult = await muteParticipantFn({ data: { roomName: room.livekit_room, targetIdentity: p.user_id } });
      const { error } = await supabase.from("room_participants")
      .update({ role: "listener" } as never)
      .eq("id", p.id);
      if (error) throw error;
      await reloadParticipants();
      toast.success(livekitResult.ok ? "Participant muted and moved to listeners" : "Participant moved to listeners");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not mute participant");
    } finally {
      setActionBusy(null);
    }
  };
  const removeParticipant = async (p: RoomParticipant) => {
    if (!room) return;
    setActionBusy(`remove-${p.id}`);
    try {
      await removeParticipantFn({ data: { roomName: room.livekit_room, targetIdentity: p.user_id } });
      const { error } = await supabase.from("room_participants").delete().eq("id", p.id);
      if (error) throw error;
      await reloadParticipants();
      toast.success("Participant removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove participant");
    } finally {
      setActionBusy(null);
    }
  };
  const toggleLock = async () => {
    if (!room) return;
    const next = room.status === "locked" ? "active" : "locked";
    const { error } = await supabase.from("rooms").update({ status: next } as never).eq("id", room.id);
    if (error) return toast.error(error.message);
    setRoom({ ...room, status: next });
    toast.success(next === "locked" ? "Room locked" : "Room unlocked");
  };
  const endRoom = async () => {
    if (!room) return;
    setActionBusy("end-room");
    try {
      await deleteRoomFn({ data: { roomName: room.livekit_room } });
      // Wipe participants first (RLS allows host); trigger then deletes the room + related rows.
      await supabase.from("room_participants").delete().eq("room_id", room.id);
      // Belt & braces: explicitly delete in case there were no participants.
      await supabase.from("rooms").delete().eq("id", room.id);
      disconnect();
      toast.success("Room ended");
      setTimeout(() => navigate({ to: "/" }), 500);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not end room");
    } finally {
      setActionBusy(null);
    }
  };

  const copyLink = async () => {
    const url = window.location.href;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        ok = true;
      }
    } catch { /* fall through */ }
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch { /* noop */ }
    }
    if (ok) {
      setCopied(true);
      toast.success("Room link copied");
      setTimeout(() => setCopied(false), 1500);
    } else {
      toast.error("Couldn't copy. URL: " + url);
    }
    // Try native share on mobile if available
    if (!ok && typeof navigator.share === "function") {
      try { await navigator.share({ title: room?.title ?? "Room", url }); } catch { /* noop */ }
    }
  };

  // ---- Render ----
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Card className="mx-auto mt-20 max-w-md p-8 text-center">
          <h2 className="text-xl font-bold">Room not found</h2>
          <p className="mt-2 text-sm text-muted-foreground">This room doesn't exist or has been removed.</p>
          <Button asChild className="mt-4"><Link to="/">Back to home</Link></Button>
        </Card>
      </div>
    );
  }

  const speakers = participants.filter((p) => p.role === "host" || p.role === "speaker");
  const listeners = participants.filter((p) => p.role === "listener");
  const handRaises = participants.filter((p) => p.hand_raised && p.role === "listener");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link>
          </Button>
        </div>

        <Card className={`relative overflow-hidden border-border shadow-card`}>
          <div className={`h-24 bg-gradient-to-br ${room.cover_gradient ?? "from-blue-500 to-indigo-600"}`}>
            <div className="pointer-events-none absolute inset-0 grid-bg opacity-20" />
          </div>
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {room.status === "active" && (
                    <Badge className="rounded-full bg-success/15 text-success hover:bg-success/15">
                      <Radio className="mr-1 h-3 w-3 animate-pulse" /> Live
                    </Badge>
                  )}
                  {room.status === "locked" && (
                    <Badge variant="outline" className="rounded-full"><Lock className="mr-1 h-3 w-3" /> Locked</Badge>
                  )}
                  {room.status === "ended" && (
                    <Badge variant="outline" className="rounded-full">Ended</Badge>
                  )}
                  {room.is_private && (
                    <Badge variant="outline" className="rounded-full"><Lock className="mr-1 h-3 w-3" /> Private</Badge>
                  )}
                  {room.language && (
                    <Badge variant="outline" className="rounded-full"><Globe className="mr-1 h-3 w-3" /> {room.language}</Badge>
                  )}
                  {room.skill_level && <Badge variant="secondary" className="rounded-full">{room.skill_level}</Badge>}
                </div>
                <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{room.title}</h1>
                {room.description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{room.description}</p>}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {participants.length} / {room.max_participants}</span>
                  {room.topic && <span>· {room.topic}</span>}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyLink}>
                  {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                  {copied ? "Copied" : "Share link"}
                </Button>
                {myParticipant && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" title="Send a reaction">
                        <Smile className="mr-1 h-4 w-4" /> React
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2" align="end">
                      <div className="flex gap-1">
                        {REACTION_EMOJIS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => sendReaction(e)}
                            className="grid h-10 w-10 place-items-center rounded-lg text-2xl transition-all hover:scale-125 hover:bg-muted active:scale-110"
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {!lkConnected ? (
                  <>
                    {myParticipant?.role === "listener" && (
                      <Button variant={myParticipant.hand_raised ? "default" : "outline"} onClick={handleRaiseHand}>
                        <Hand className="mr-1 h-4 w-4" />
                        {myParticipant.hand_raised ? "Hand raised" : "Raise hand"}
                      </Button>
                    )}
                    <Button onClick={handleJoin} disabled={connecting || room.status === "ended"} className="bg-gradient-primary">
                      {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Join voice
                    </Button>
                  </>
                ) : (
                  <>
                    {canPublish ? (
                      <>
                        <Button onClick={toggleMute} variant={muted ? "outline" : "default"}>
                          {muted ? <MicOff className="mr-1 h-4 w-4" /> : <Mic className="mr-1 h-4 w-4" />}
                          {muted ? "Unmute" : "Mute"}
                        </Button>
                        {myParticipant?.role === "speaker" && (
                          <Button variant="outline" onClick={moveToAudience} disabled={actionBusy === "self-demote"} title="Stop speaking and return to listeners">
                            {actionBusy === "self-demote" && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                            <Users className="mr-1 h-4 w-4" /> Move to audience
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button variant={myParticipant?.hand_raised ? "default" : "outline"} onClick={handleRaiseHand}>
                        <Hand className="mr-1 h-4 w-4" />
                        {myParticipant?.hand_raised ? "Hand raised" : "Raise hand"}
                      </Button>
                    )}
                    <Button variant="destructive" onClick={leaveRoom}>
                      <LogOut className="mr-1 h-4 w-4" /> Leave
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Host controls */}
            {isHost && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Host controls</span>
                <Button variant="outline" size="sm" onClick={toggleLock}>
                  <Lock className="mr-1 h-3.5 w-3.5" />
                  {room.status === "locked" ? "Unlock" : "Lock"} room
                </Button>
                <Button variant="destructive" size="sm" onClick={endRoom} disabled={actionBusy === "end-room"}>
                  {actionBusy === "end-room" && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                  End room
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Hand raise requests (host only) */}
        {isHost && handRaises.length > 0 && (
          <Card className="mt-4 border-amber-300/40 bg-amber-50/40 p-4 dark:bg-amber-950/20">
            <div className="flex items-center gap-2">
              <Hand className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold">Hand raise requests ({handRaises.length})</h3>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {handRaises.map((p) => {
                const pr = profiles[p.user_id];
                return (
                  <div key={p.id} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-card">
                    <button type="button" onClick={() => openProfile(p.user_id)} className="rounded-full transition hover:opacity-80" aria-label="View profile">
                      <Avatar profile={pr} size={32} />
                    </button>
                    <div className="text-sm">
                      <button type="button" onClick={() => openProfile(p.user_id)} className="font-semibold hover:underline">{displayName(pr)}</button>
                      <div className="text-[10px] text-muted-foreground">{pr?.professional_title ?? "Listener"}</div>
                    </div>
                    <Button size="sm" onClick={() => acceptHand(p)} disabled={actionBusy === `accept-${p.id}`} className="ml-2">
                      {actionBusy === `accept-${p.id}` && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectHand(p)}><X className="h-3 w-3" /></Button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Speakers */}
        <section className="mt-6">
          <SectionHeader icon={Mic} title="Speakers" count={speakers.length} />
          {speakers.length === 0 ? (
            <Empty label="No speakers yet." />
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {speakers.map((p) => {
                const pr = profiles[p.user_id];
                const speaking = speakingIds.has(p.user_id);
                return (
                  <Card key={p.id} className={`relative p-4 text-center transition-all ${speaking ? "ring-2 ring-primary shadow-glow" : ""}`}>
                    {p.role === "host" && (
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary text-[10px]">
                        <Crown className="mr-0.5 h-2.5 w-2.5" /> Host
                      </Badge>
                    )}
                    <button type="button" onClick={() => openProfile(p.user_id)} className="relative mx-auto block w-fit rounded-full transition hover:opacity-90" aria-label="View profile">
                      <Avatar profile={pr} size={64} />
                      <ReactionLayer reactions={reactions.filter((r) => r.userId === p.user_id)} />
                      {speaking && <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-success text-primary-foreground"><Volume2 className="h-3 w-3" /></span>}
                    </button>
                    <button type="button" onClick={() => openProfile(p.user_id)} className="mt-2 block w-full truncate text-sm font-semibold hover:underline">{displayName(pr)}</button>
                    <div className="truncate text-[10px] text-muted-foreground">{pr?.professional_title ?? "Speaker"}</div>
                    <div className="mt-2 flex justify-center gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={() => openProfile(p.user_id)}>View profile</Button>
                      {isHost && p.user_id !== user?.id && (
                        <>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => muteParticipant(p)} disabled={actionBusy === `mute-${p.id}`} title="Mute and move to listener">
                            <MicOff className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeParticipant(p)} disabled={actionBusy === `remove-${p.id}`} title="Remove">
                            <UserMinus className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Listeners */}
        <section className="mt-8">
          <SectionHeader icon={Users} title="Listeners" count={listeners.length} />
          {listeners.length === 0 ? (
            <Empty label="No listeners yet." />
          ) : (
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {listeners.map((p) => {
                const pr = profiles[p.user_id];
                return (
                  <div key={p.id} className="relative flex flex-col items-center text-center">
                    <button type="button" onClick={() => openProfile(p.user_id)} className="relative rounded-full transition hover:opacity-90" aria-label="View profile">
                      <Avatar profile={pr} size={48} />
                      <ReactionLayer reactions={reactions.filter((r) => r.userId === p.user_id)} />
                      {p.hand_raised && (
                        <span className="absolute -top-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-white">
                          <Hand className="h-3 w-3" />
                        </span>
                      )}
                    </button>
                    <button type="button" onClick={() => openProfile(p.user_id)} className="mt-1 w-full truncate text-xs font-medium hover:underline">{displayName(pr)}</button>
                    <div className="mt-1 flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => openProfile(p.user_id)}>View</Button>
                      {isHost && (
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeParticipant(p)} disabled={actionBusy === `remove-${p.id}`}>
                          <UserMinus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div ref={audioElsRef} className="hidden" />
        {/* avoid unused warning */}
        <span className="hidden">{remoteParticipants.length}</span>
      </main>

      <ProfileViewDialog
        userId={viewProfileId}
        open={viewProfileId !== null}
        onOpenChange={(open) => { if (!open) setViewProfileId(null); }}
      />

      <Dialog open={passwordPrompt} onOpenChange={setPasswordPrompt}>
        <DialogContent>
          <DialogHeader><DialogTitle>This room is private</DialogTitle></DialogHeader>
          <Input value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Room password" type="password" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordPrompt(false)}>Cancel</Button>
            <Button onClick={submitPassword}>Enter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function displayName(p?: ProfileLite | null) {
  if (!p) return "Member";
  return [p.first_name, p.last_name].filter(Boolean).join(" ") || p.username || "Member";
}

function Avatar({ profile, size = 48 }: { profile?: ProfileLite | null; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!profile?.avatar_url) { setUrl(null); return; }
    supabase.storage.from("avatars").createSignedUrl(profile.avatar_url, 60 * 60).then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [profile?.avatar_url]);
  const style = { width: size, height: size };
  if (url) return <img src={url} alt="" style={style} className="rounded-full object-cover ring-2 ring-border" />;
  return (
    <div style={style} className="grid place-items-center rounded-full bg-gradient-primary font-bold text-primary-foreground">
      {(profile?.first_name?.[0] ?? "?").toUpperCase()}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, count }: { icon: React.ComponentType<{ className?: string }>; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      <Badge variant="secondary" className="rounded-full">{count}</Badge>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="mt-3 text-sm italic text-muted-foreground">{label}</p>;
}

function ReactionLayer({ reactions }: { reactions: LiveReaction[] }) {
  if (reactions.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-2 z-10">
      {reactions.map((r) => (
        <span
          key={r.id}
          className="reaction-float absolute left-1/2 text-3xl drop-shadow-lg"
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}
