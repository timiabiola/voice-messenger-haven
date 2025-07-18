import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Send, Mic, Square } from 'lucide-react';
import { useRecording } from '@/hooks/use-recording';
import { useMessageUpload } from '@/hooks/use-message-upload';
import { useToast } from '@/components/ui/use-toast';
import { VoiceMessage } from '@/types/messages';

interface MessageReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentMessage: VoiceMessage;
  onReplySuccess: (reply: any) => void;
}

export const MessageReplyModal: React.FC<MessageReplyModalProps> = ({
  isOpen,
  onClose,
  parentMessage,
  onReplySuccess
}) => {
  const [title, setTitle] = useState(`Re: ${parentMessage.title}`);
  const [subject, setSubject] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPrivate, setIsPrivate] = useState(parentMessage.is_private);
  const [isUploading, setIsUploading] = useState(false);
  
  const { isRecording, startRecording, stopRecording, audioChunks, createAudioFromChunks } = useRecording();
  const { uploadMessage } = useMessageUpload();
  const { toast } = useToast();

  const handleRecord = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSendReply = async () => {
    const audioBlob = createAudioFromChunks();
    if (!audioBlob || audioChunks.length === 0) {
      toast({
        title: "No recording",
        description: "Please record a message first",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      const audioUrl = await uploadMessage(audioChunks);
      
      // The parent component will handle the actual reply creation
      await onReplySuccess({
        title,
        subject,
        audio_url: audioUrl,
        is_urgent: isUrgent,
        is_private: isPrivate,
        parent_message_id: parentMessage.id
      });

      onClose();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reply to Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Reply title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject (optional)</Label>
            <Textarea
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Add a subject or description"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="urgent"
                checked={isUrgent}
                onCheckedChange={setIsUrgent}
              />
              <Label htmlFor="urgent">Mark as urgent</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
              <Label htmlFor="private">Private message</Label>
            </div>
          </div>

          <div className="border rounded-lg p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <Label>Voice Recording</Label>
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                onClick={handleRecord}
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Record
                  </>
                )}
              </Button>
            </div>

            {audioChunks.length > 0 && !isRecording && (
              <div className="text-sm text-muted-foreground">
                Recording ready to send
              </div>
            )}

            {isRecording && (
              <div className="text-sm text-muted-foreground animate-pulse">
                Recording in progress...
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={audioChunks.length === 0 || isUploading}
            >
              <Send className="h-4 w-4 mr-2" />
              {isUploading ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};