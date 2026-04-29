import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Send, MoreVertical, Info, MessageCircle, Flag } from 'lucide-react';
import { messageService, authService, userService, itemService, Message, MessageRequest } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import ReportMessageModal from '../components/ReportMessageModal';
import UserReportModal from '../components/UserReportModal';

interface ConversationItem {
  id: string;
  user: {
    name: string;
    email: string;
    avatar: null;
    status: 'online' | 'offline' | 'away';
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  item?: {
    title: string;
    price: number;
    image: string;
  };
}

const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedChat, setSelectedChat] = useState<string>('');
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedMessageForReport, setSelectedMessageForReport] = useState<Message | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userReportModalOpen, setUserReportModalOpen] = useState(false);
  const { refreshUnreadCount } = useNotification();

  const currentUser = authService.getStoredUser();
  
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return 'https://via.placeholder.com/400x300?text=No+Image';
    
    // If it's a blob URL (from old uploads), show placeholder
    if (imageUrl.startsWith('blob:')) {
      return 'https://via.placeholder.com/400x300?text=No+Image';
    }
    
    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http')) return imageUrl;
    
    // If it starts with slash, it's a server path
    if (imageUrl.startsWith('/')) {
      return `http://localhost:8080${imageUrl}`;
    }
    
    // If it's just a filename, try uploads folder
    if (!imageUrl.includes('/')) {
      return `http://localhost:8080/uploads/${imageUrl}`;
    }
    
    // Default case - assume it's a relative path from server root
    return `http://localhost:8080/${imageUrl}`;
  };
  
  // Get URL parameters for starting new conversation
  const sellerIdParam = searchParams.get('seller');
  const itemIdParam = searchParams.get('item');

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat);
    }
  }, [selectedChat]);

  // Handle URL parameters for starting new conversation
  useEffect(() => {
    if (sellerIdParam && itemIdParam) {
      handleStartConversationFromItem(sellerIdParam, itemIdParam);
    }
  }, [sellerIdParam, itemIdParam]);

  const handleStartConversationFromItem = async (sellerId: string, itemId: string) => {
    try {
      // Get seller and item information
      const seller = await userService.getUserById(parseInt(sellerId));
      const item = await itemService.getItemById(parseInt(itemId));
      
      // Set selected chat to seller's email
      setSelectedChat(seller.uCusMail);
      
      // Clear URL parameters
      navigate('/chat', { replace: true });
      
      // Check if conversation already exists
      const existingConversation = conversations.find(conv => conv.user.email === seller.uCusMail);
      if (!existingConversation) {
        // Add seller to conversations list with item information
        const newConversation: ConversationItem = {
          id: seller.uCusMail,
          user: {
            name: seller.uName,
            email: seller.uCusMail,
            avatar: null,
            status: 'offline' as const
          },
          lastMessage: 'Start conversation about this item...',
          lastMessageTime: 'now',
          unreadCount: 0,
          item: {
            title: item.iName,
            price: item.price || 0,
            image: item.image || 'https://via.placeholder.com/100'
          }
        };
        
        setConversations(prev => [newConversation, ...prev]);
      }
    } catch (error) {
      console.error('Error starting conversation with seller:', error);
      // Still clear URL parameters even if there's an error
      navigate('/chat', { replace: true });
    }
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await messageService.getUserConversations();
      
      // Transform backend messages to conversation format
      const conversationMap = new Map<string, ConversationItem>();
      
      response.forEach((msg: Message) => {
        const otherUser = currentUser?.uCusMail === msg.sender.uCusMail ? msg.receiver : msg.sender;
        const conversationId = otherUser.uCusMail;
        
        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            id: conversationId,
            user: {
              name: otherUser.uName,
              email: otherUser.uCusMail,
              avatar: null,
              status: 'offline' as const
            },
            lastMessage: msg.content,
            lastMessageTime: formatMessageTime(msg.sentDate),
            unreadCount: 0,
            item: msg.item ? {
              title: msg.item.iName,
              price: msg.item.price || 0,
              image: msg.item.image || 'https://via.placeholder.com/100'
            } : undefined
          });
        }
        
        // Update with newer message and increment unread count if message is unread and for current user
        const conversation = conversationMap.get(conversationId)!;
        const msgDate = new Date(msg.sentDate);
        const currentLastMessageDate = new Date(conversation.lastMessageTime);
        
        if (msgDate > currentLastMessageDate) {
          conversation.lastMessage = msg.content;
          conversation.lastMessageTime = formatMessageTime(msg.sentDate);
        }
        
        // Count unread messages received by current user
        if (!msg.isRead && msg.receiver.uCusMail === currentUser?.uCusMail) {
          conversation.unreadCount++;
        }
      });

      setConversations(Array.from(conversationMap.values()));
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (userEmail: string) => {
    try {
      const response = await messageService.getConversation(userEmail);
      setMessages(response);
      
      // Mark unread messages as read
      const unreadMessages = response.filter(msg => 
        !msg.isRead && msg.receiver.uCusMail === currentUser?.uCusMail
      );
      
      for (const message of unreadMessages) {
        try {
          await messageService.markAsRead(message.messageId);
        } catch (error) {
          console.error(`Error marking message ${message.messageId} as read:`, error);
        }
      }
      
      // If we marked any messages as read, reload conversations and refresh global unread count
      if (unreadMessages.length > 0) {
        loadConversations();
        refreshUnreadCount();
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  };

  const selectedConversation = conversations.find(conv => conv.id === selectedChat);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && selectedChat) {
      try {
        setSendingMessage(true);
        const messageRequest: MessageRequest = {
          receiverEmail: selectedChat,
          content: message.trim()
        };
        
        // If this is the first message and we have itemId from URL params, include it
        if (itemIdParam && messages.length === 0) {
          messageRequest.itemId = parseInt(itemIdParam);
        }
        
        await messageService.sendMessage(messageRequest);
        setMessage('');
        
        // Reload conversations to update the conversation list
        await loadConversations();
        // Reload messages to show the new message
        await loadMessages(selectedChat);
        // Refresh global unread count
        refreshUnreadCount();
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setSendingMessage(false);
      }
    }
  };

  const handleReportMessage = (message: Message) => {
    setSelectedMessageForReport(message);
    setReportModalOpen(true);
  };

  const handleCloseReportModal = () => {
    setReportModalOpen(false);
    setSelectedMessageForReport(null);
  };

  const handleReportUser = () => {
    setDropdownOpen(false);
    setUserReportModalOpen(true);
  };

  const handleCloseUserReportModal = () => {
    setUserReportModalOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (dropdownOpen && !target.closest('.dropdown-container')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Chat List Sidebar */}
      <div className="w-1/3 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedChat(conversation.id)}
              className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                selectedChat === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                      {conversation.user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(conversation.user.status)}`} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {conversation.user.name}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {conversation.lastMessageTime}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate mb-1">
                    {conversation.lastMessage}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    {conversation.item && (
                      <div className="flex items-center space-x-1">
                        <img
                          src={getImageUrl(conversation.item.image)}
                          alt={conversation.item.title}
                          className="w-6 h-6 rounded object-cover"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conversation.item.title}
                        </span>
                      </div>
                    )}
                    {conversation.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )))}
        </div>
      </div>

      {/* Chat Window */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-gray-300 dark:border-gray-600">
                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  {selectedConversation.user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {selectedConversation.user.name}
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                <Info className="h-5 w-5" />
              </button>
              
              {/* Dropdown Menu */}
              <div className="relative dropdown-container">
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
                    <div className="py-1">
                      <button
                        onClick={handleReportUser}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Flag className="h-4 w-4 mr-3" />
                        Report User
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Item Info Card */}
          {selectedConversation.item && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <img
                  src={getImageUrl(selectedConversation.item.image)}
                  alt={selectedConversation.item.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {selectedConversation.item.title}
                  </h4>
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                    ৳{selectedConversation.item.price.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = currentUser?.uCusMail === msg.sender.uCusMail;
                return (
                  <div
                    key={msg.messageId}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} group`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg relative ${
                      isCurrentUser
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {formatMessageTime(msg.sentDate)}
                      </p>
                      
                      {/* Report button - only show for messages from other users */}
                      {!isCurrentUser && (
                        <button
                          onClick={() => handleReportMessage(msg)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          title="Report this message"
                        >
                          <Flag className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={!message.trim() || sendingMessage}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Select a conversation
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a conversation from the sidebar to start messaging
            </p>
          </div>
        </div>
      )}

      {/* Report Message Modal */}
      {selectedMessageForReport && (
        <ReportMessageModal
          isOpen={reportModalOpen}
          onClose={handleCloseReportModal}
          messageId={selectedMessageForReport.messageId}
          messageContent={selectedMessageForReport.content}
        />
      )}

      {/* User Report Modal */}
      {selectedConversation && (
        <UserReportModal
          isOpen={userReportModalOpen}
          onClose={handleCloseUserReportModal}
          userEmail={selectedConversation.user.email}
          userName={selectedConversation.user.name}
        />
      )}
    </div>
  );
};

export default Chat;