import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRoom } from "@/lib/rooms";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Mic } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function CreateRoomModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    topic: "",
    skill_level: "All levels",
    language: "English",
    max_participants: 50,
    is_private: false,
    password: "",
  });

  const update = (k: keyof typeof form, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!user) return;
    if (!form.title.trim()) return toast.error("Title is required");
    if (form.is_private && !form.password.trim()) return toast.error("Password required for private room");
    setBusy(true);
    try {
      const room = await createRoom(
        {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          topic: form.topic.trim() || undefined,
          skill_level: form.skill_level,
          language: form.language,
          max_participants: form.max_participants,
          is_private: form.is_private,
          password: form.password,
        },
        user.id,
      );
      // Add host as participant
      await supabase.from("room_participants").insert({
        room_id: room.id,
        user_id: user.id,
        role: "host",
      } as never);
      toast.success("Room created");
      onOpenChange(false);
      navigate({ to: "/rooms/$roomId", params: { roomId: room.id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
              <Mic className="h-4 w-4" />
            </span>
            Create a learning room
          </DialogTitle>
          <DialogDescription>Start a live voice room. You'll be the host.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="React for Beginners" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="What's this room about?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Topic</Label>
              <Input value={form.topic} onChange={(e) => update("topic", e.target.value)} placeholder="Programming" />
            </div>
            <div>
              <Label>Language</Label>
              <Select value={form.language} onValueChange={(v) => update("language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Skill level</Label>
              <Select value={form.skill_level} onValueChange={(v) => update("skill_level", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All levels">All levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max participants</Label>
              <Input type="number" min={2} max={200} value={form.max_participants}
                onChange={(e) => update("max_participants", Number(e.target.value) || 50)} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <div className="text-sm font-semibold">Private room</div>
              <div className="text-xs text-muted-foreground">Require a password to join</div>
            </div>
            <Switch checked={form.is_private} onCheckedChange={(v) => update("is_private", v)} />
          </div>
          {form.is_private && (
            <div>
              <Label>Password</Label>
              <Input type="text" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Enter a password" />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
            <Button onClick={submit} disabled={busy} className="bg-gradient-primary">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create room
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
