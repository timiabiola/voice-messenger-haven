import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useThreadedMessages } from '@/hooks/useThreadedMessages';
import { ThreadedMessageView } from '@/components/messages/ThreadedMessageView';
import { MessageReplyModal } from '@/components/messages/MessageReplyModal';
import { useToast } from '@/components/ui/use-toast';

const MessageThread = () => {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { messages, loading, replyToMessage } = useThreadedMessages(threadId);
  const { toast } = useToast();
  
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyToMessageData, setReplyToMessageData] = useState<any>(null);

  // Check if we should open reply modal from navigation state
  useEffect(() => {
    if (location.state?.replyToMessageId && messages.length > 0) {
      const messageToReply = findMessageById(messages, location.state.replyToMessageId);
      if (messageToReply) {
        setReplyToMessageData(messageToReply);
        setReplyModalOpen(true);
      }
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, messages]);

  const handleReply = (messageId: string) => {
    const message = findMessageById(messages, messageId);
    if (message) {
      setReplyToMessageData(message);
      setReplyModalOpen(true);
    }
  };

  const findMessageById = (msgs: any[], id: string): any => {
    for (const msg of msgs) {
      if (msg.id === id) return msg;
      if (msg.replies) {
        const found = findMessageById(msg.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleReplySuccess = async (replyData: any) => {
    try {
      await replyToMessage(replyToMessageData.id, replyData);
      setReplyModalOpen(false);
      setReplyToMessageData(null);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!messages.length) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 w-full pt-20">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/inbox')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Inbox
            </Button>
            <p className="text-center text-muted-foreground">Thread not found</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 w-full pt-20">
        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 max-w-[1000px]">
          <Button
            variant="ghost"
            onClick={() => navigate('/inbox')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Inbox
          </Button>

          <div className="space-y-4 py-4">
            {messages.map((message) => (
              <ThreadedMessageView
                key={message.id}
                message={message}
                onReply={handleReply}
              />
            ))}
          </div>
        </div>
      </div>

      {replyToMessageData && (
        <MessageReplyModal
          isOpen={replyModalOpen}
          onClose={() => {
            setReplyModalOpen(false);
            setReplyToMessageData(null);
          }}
          parentMessage={replyToMessageData}
          onReplySuccess={handleReplySuccess}
        />
      )}
    </AppLayout>
  );
};

export default MessageThread;