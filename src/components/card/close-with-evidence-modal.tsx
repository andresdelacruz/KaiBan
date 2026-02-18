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

interface CloseWithEvidenceModalProps {
  children: React.ReactNode;
  card: Card;
}

export function CloseWithEvidenceModal({ children, card }: CloseWithEvidenceModalProps) {
  const [evidence, setEvidence] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [assessment, setAssessment] = useState<AssessEvidenceRelevanceOutput | null>(null);
  const { toast } = useToast();

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

  return (
    <Dialog onOpenChange={() => { setAssessment(null); setEvidence(''); }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
                <Badge variant={assessment.relevanceScore > 70 ? "default" : "destructive"}>
                  Score: {assessment.relevanceScore}/100
                </Badge>
              </AlertTitle>
              <AlertDescription>
                {assessment.feedback}
              </AlertDescription>
            </Alert>
          )}

        </div>
        <DialogFooter>
          {assessment ? (
            <Button>Confirm Close</Button>
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
