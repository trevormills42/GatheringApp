import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (deckData: any) => void;
}

export function ImportModal({ isOpen, onClose, onImportSuccess }: ImportModalProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const urlImportMutation = useMutation({
    mutationFn: async (importUrl: string) => {
      const response = await apiRequest("POST", "/api/import/url", { url: importUrl });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import successful",
        description: "Deck imported successfully from URL",
      });
      if (onImportSuccess) {
        onImportSuccess(data);
      }
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import deck from URL",
        variant: "destructive",
      });
    },
  });

  const textImportMutation = useMutation({
    mutationFn: async (importText: string) => {
      const response = await apiRequest("POST", "/api/import/text", { text: importText });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Import successful",
        description: "Deck imported successfully from text",
      });
      if (onImportSuccess) {
        onImportSuccess(data);
      }
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Import failed",
        description: error.message || "Failed to import deck from text",
        variant: "destructive",
      });
    },
  });

  const handleUrlImport = () => {
    if (!url.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid deck URL",
        variant: "destructive",
      });
      return;
    }
    urlImportMutation.mutate(url.trim());
  };

  const handleTextImport = () => {
    if (!text.trim()) {
      toast({
        title: "Invalid text",
        description: "Please enter a deck list",
        variant: "destructive",
      });
      return;
    }
    textImportMutation.mutate(text.trim());
  };

  const handleClose = () => {
    setUrl("");
    setText("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle>Import Deck</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* URL Import */}
          <div className="space-y-2">
            <Label htmlFor="deck-url" className="text-sm font-medium">
              Paste Deck URL
            </Label>
            <Input
              id="deck-url"
              type="url"
              placeholder="https://archidekt.com/decks/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              data-testid="input-import-url"
            />
            <p className="text-xs text-gray-500">
              Supports Archidekt, Moxfield, and other platforms
            </p>
            <Button
              onClick={handleUrlImport}
              disabled={urlImportMutation.isPending}
              className="w-full"
              data-testid="button-import-url"
            >
              {urlImportMutation.isPending ? "Importing..." : "Import from URL"}
            </Button>
          </div>

          {/* Text Import */}
          <div className="space-y-2">
            <Label htmlFor="deck-text" className="text-sm font-medium">
              Or paste deck list
            </Label>
            <Textarea
              id="deck-text"
              placeholder="4 Lightning Bolt&#10;4 Monastery Swiftspear&#10;20 Mountain"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="h-24 resize-none"
              data-testid="input-import-text"
            />
            <Button
              onClick={handleTextImport}
              disabled={textImportMutation.isPending}
              className="w-full"
              data-testid="button-import-text"
            >
              {textImportMutation.isPending ? "Importing..." : "Import from Text"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
