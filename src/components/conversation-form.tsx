"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { parseManualTranscript } from "@/lib/parse-transcript";
import type { Conversation } from "@/lib/types";
import { Plus } from "lucide-react";
import { useState } from "react";

interface ConversationFormProps {
  onSubmit: (conversation: Conversation) => void;
  loading?: boolean;
}

export function ConversationForm({ onSubmit, loading }: ConversationFormProps) {
  const [title, setTitle] = useState("");
  const [participant, setParticipant] = useState("");
  const [company, setCompany] = useState("");
  const [transcript, setTranscript] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !transcript.trim()) return;
    const conversation = parseManualTranscript(
      title.trim(),
      participant.trim(),
      company.trim(),
      transcript.trim(),
    );
    onSubmit(conversation);
    setTitle("");
    setParticipant("");
    setCompany("");
    setTranscript("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Conversation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="Title (e.g. Alice @ Crusoe booth)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Participant"
            value={participant}
            onChange={(e) => setParticipant(e.target.value)}
          />
          <Input
            placeholder="Company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <textarea
          className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder={'Alice: We built an inference platform...\nBob: Our hospital can\'t...'}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />
        <Button disabled={loading || !title.trim() || !transcript.trim()} onClick={handleSubmit}>
          <Plus className="size-4" />
          Process Conversation
        </Button>
      </CardContent>
    </Card>
  );
}
