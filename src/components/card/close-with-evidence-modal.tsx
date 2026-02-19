"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/lib/types";
import { assessEvidenceRelevance, AssessEvidenceRelevanceOutput } from "@/ai/flows/assess-evidence-relevance";
import { Icons } from "../icons";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useBoardContext } from "@/lib/board-context";

interface CloseWithEvidenceModalProps {
  children: React.ReactNode;
  card: Card;
}

export const EVIDENCE_SCORE_THRESHOLD = 70;

export function CloseWithEvidenceModal({ children, card }: CloseWithEvidenceModalProps) {
  const [evidence, setEvidence] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [assessment, setAssessment] = useState<AssessEvidenceRelevanceOutput | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { columns, moveCard } = useBoardContext();

  const resetState = () => {
    setAssessment(null);
    setEvidence("");
    setIsClosing(false);
  };

  const handleSubmit = async () => {
    if (!evidence.trim()) {
      toast({
        variant: "destructive",
        title: "Evidence Required",
        description: "Please provide evidence for closing this card.",
      });
      return;
    }

    setIsLoading(true);
    setAssessment(null);

    try {
      const result = await assessEvidenceRelevance({
        cardTitle: card.title,
        cardDescription: card.description,
        checklistItems: card.checklist.map(item => item.text),
        evidenceText: evidence,
      });
      setAssessment(result);
    } catch (error) {
      console.error("AI assessment failed:", error);
      toast({
        variant: "destructive",
        title: "AI Assessment Failed",
        description: "Could not assess evidence. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmClose = async () => {
    if (!assessment || assessment.relevanceScore <= EVIDENCE_SCORE_THRESHOLD) return;

    const doneColumn = columns.find(c => c.name.toLowerCase() === "done");
    if (!doneColumn) {
      toast({
        variant: "destructive",
        title: "Column Not Found",
        description: "Could not find the Done column.",
      });
      return;
    }

    setIsClosing(true);
    try {
      await moveCard(card.id, doneColumn.id, card.lane_id ?? null);
      toast({
        title: "Card Closed",
        description: `"${card.title}" moved to Done.`,
      });
      setOpen(false);
      resetState();
    } catch (error) {
      console.error("Failed to move card:", error);
      toast({
        variant: "destructive",
        title: "Failed to Close Card",
        description: "Could not move card to Done. Please try again.",
      });
    } finally {
      setIsClosing(false);
    }
  };

  const isApproved = assessment !== null && assessment.relevanceScore > EVIDENCE_SCORE_THRESHOLD;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState(); }}>
      <DialogTrigger asChild onClick={() => setOpen(true)}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Close Card: {card.title}</DialogTitle>
          <DialogDescription>
            Provide evidence for completing this card. The AI will assess its relevance.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            id="evidence"
            placeholder="Describe the work done, link to pull requests, or attach documentation..."
            className="h-40"
            value={evidence}
            onChange={(e) => setEvidence(e.target.value)}
          />

          {assessment && (
            <Alert>
              <AlertTitle className="flex items-center gap-2">
                AI Assessment
                <Badge variant={isApproved ? "default" : "destructive"}>
                  Score: {assessment.relevanceScore}/100
                </Badge>
              </AlertTitle>
              <AlertDescription>
                {assessment.feedback}
                {!isApproved && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Score must exceed {EVIDENCE_SCORE_THRESHOLD} to close this card.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

        </div>
        <DialogFooter>
          {assessment ? (
            <Button
              onClick={handleConfirmClose}
              disabled={!isApproved || isClosing}
            >
              {isClosing && <Icons.sun className="mr-2 h-4 w-4 animate-spin" />}
              {isApproved ? "Confirm Close" : "Evidence Insufficient"}
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Icons.sun className="mr-2 h-4 w-4 animate-spin" />}
              Assess Evidence
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
