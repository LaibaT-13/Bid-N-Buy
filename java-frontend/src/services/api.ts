const API_BASE_URL = 'http://localhost:8080/api';

// API client with automatic JWT token handling
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('jwt');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, remove it
        localStorage.removeItem('jwt');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text() as unknown as T;
  }

  // Public GET that does not send Authorization and does not auto-redirect on 401
  async getPublic<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return response.text() as unknown as T;
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    return this.handleResponse<T>(response);
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Type definitions matching backend models
export interface User {
  userId: number;
  uName: string;
  uPhone: string;
  uCusMail: string;
  dateJoined: string;
  role: 'USER' | 'ADMIN';
  address?: string;
}

export interface Item {
  itemId: number;
  iName: string;
  description: string;
  image?: string;
  price?: number;
  condition?: string;
  location?: string;
  postDate: string;
  updateDate: string;
  category: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SOLD' | 'UNSOLD';
  approvedBy?: User;
  approvedDate?: string;
  rejectionReason?: string;
  user: User;
  biddingEnabled?: boolean;
  auction?: Auction;
}

export interface Bid {
  bidId: number;
  item: Item;
  bidder: User;
  bidAmount: number;
  bidDate: string;
  status: 'ACTIVE' | 'OUTBID' | 'WINNING' | 'WON' | 'CANCELLED';
  isAutoBid?: boolean;
  maxAutoBidAmount?: number;
}

export interface Auction {
  auctionId: number;
  item: Item;
  startingBid: number;
  currentHighestBid: number;
  minimumIncrement: number;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'SOLD';
  currentWinner?: User;
  reservePrice?: number;
  autoExtendOnLateBid?: boolean;
  extensionTimeMinutes?: number;
  buyNowPrice?: number;
  allowBuyNow?: boolean;
}

export interface AuthResponse {
  jwt: string;
  message: string;
  isWarned?: boolean;
  warningReason?: string;
}

export interface AdminAuthResponse {
  jwt: string;
  user: User;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  uName: string;
  uPhone: string;
  uCusMail: string;
  uPassword: string;
  address?: string;
}

// API service methods
export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', credentials);
  },

  async adminLogin(credentials: LoginRequest): Promise<AdminAuthResponse> {
    return apiClient.post<AdminAuthResponse>('/auth/admin-login', credentials);
  },

  async signup(userData: SignupRequest): Promise<User> {
    return apiClient.post<User>('/auth/signup', userData);
  },

  async forgotPassword(email: string): Promise<string> {
    return apiClient.post<string>('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<string> {
    return apiClient.post<string>('/auth/reset-password', { token, newPassword });
  },

  async verifyOtpAndResetPassword(email: string, otp: string, newPassword: string): Promise<string> {
    return apiClient.post<string>('/auth/verify-otp-reset-password', { email, otp, newPassword });
  },

  async verifyRegistrationOtp(email: string, otp: string): Promise<string> {
    return apiClient.post<string>('/auth/verify-registration', { email, otp });
  },

  async resendRegistrationOtp(email: string): Promise<string> {
    return apiClient.post<string>('/auth/resend-registration-otp', { email });
  },

  logout() {
    localStorage.removeItem('jwt');
    localStorage.removeItem('user');
  },

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getStoredToken(): string | null {
    return localStorage.getItem('jwt');
  }
};

export const itemService = {
  async getAllItems(): Promise<Item[]> {
    // Public endpoint: returns only approved and available items
    return apiClient.getPublic<Item[]>('/items');
  },

  async getItemById(itemId: number): Promise<Item> {
    return apiClient.get<Item>(`/items/${itemId}`);
  },

  async createItem(itemData: Omit<Item, 'itemId' | 'postDate' | 'updateDate' | 'user'>): Promise<Item> {
    return apiClient.post<Item>('/items', itemData);
  },

  async createItemWithAuction(requestData: CreateItemWithAuctionRequest): Promise<{message: string, item: Item}> {
    return apiClient.post<{message: string, item: Item}>('/items/with-auction', requestData);
  },

  // User's own items
  async getMyItems(): Promise<Item[]> {
    return apiClient.get<Item[]>('/items/my-items');
  },

  async getMyPendingItems(): Promise<Item[]> {
    return apiClient.get<Item[]>('/items/my-items/pending');
  },

  // Delete user's own item (REMOVED - sellers cannot delete items)
  // async deleteItem(itemId: number): Promise<void> {
  //   return apiClient.delete<void>(`/items/my-items/${itemId}`);
  // },

  // Update item sale status (SOLD/UNSOLD) by seller
  async updateItemStatus(itemId: number, status: 'SOLD' | 'UNSOLD'): Promise<{message: string, status: string}> {
    return apiClient.put<{message: string, status: string}>(`/items/my-items/${itemId}/status`, { status });
  },

  // Admin item management
  async getPendingItems(): Promise<Item[]> {
    return apiClient.get<Item[]>('/items/admin/pending');
  },

  async getAllItemsForAdmin(): Promise<Item[]> {
    return apiClient.get<Item[]>('/items/admin/all');
  },

  async approveItem(itemId: number): Promise<Item> {
    return apiClient.put<Item>(`/items/admin/${itemId}/approve`, {});
  },

  async rejectItem(itemId: number, reason: string): Promise<Item> {
    return apiClient.put<Item>(`/items/admin/${itemId}/reject`, { reason });
  },

  async getPendingItemsCount(): Promise<number> {
    return apiClient.get<number>('/items/admin/pending-count');
  },

  async getTotalCount(): Promise<number> {
    return apiClient.get<number>('/items/count');
  }
};

// Message interfaces
export interface Message {
  messageId: number;
  sender: User;
  receiver: User;
  item?: Item;
  content: string;
  sentDate: string;
  isRead: boolean;
}

export interface MessageRequest {
  receiverEmail: string;
  content: string;
  itemId?: number;
}

export interface ReportMessageRequest {
  messageId: number;
  reason: ReportReason;
  additionalDetails?: string;
}

export interface MessageReport {
  reportId: number;
  message: Message;
  reporter: User;
  reason: ReportReason;
  additionalDetails?: string;
  reportedDate: string;
  status: ReportStatus;
  reviewedBy?: User;
  reviewedDate?: string;
  reviewNotes?: string;
}

export enum ReportReason {
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE_CONTENT = 'INAPPROPRIATE_CONTENT',
  SCAM_FRAUD = 'SCAM_FRAUD',
  HATE_SPEECH = 'HATE_SPEECH',
  VIOLENCE_THREATS = 'VIOLENCE_THREATS',
  FAKE_INFORMATION = 'FAKE_INFORMATION',
  OTHER = 'OTHER'
}

export enum ReportStatus {
  PENDING = 'PENDING',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

// Message service
export const messageService = {
  async sendMessage(messageData: MessageRequest): Promise<Message> {
    return apiClient.post<Message>('/messages/send', messageData);
  },

  async getConversation(otherUserEmail: string): Promise<Message[]> {
    return apiClient.get<Message[]>(`/messages/conversation/${otherUserEmail}`);
  },

  async getUserConversations(): Promise<Message[]> {
    return apiClient.get<Message[]>('/messages/conversations');
  },

  async markAsRead(messageId: number): Promise<string> {
    return apiClient.put<string>(`/messages/read/${messageId}`, {});
  },

  async getUnreadCount(): Promise<number> {
    return apiClient.get<number>('/messages/unread-count');
  },

  async reportMessage(reportData: ReportMessageRequest): Promise<MessageReport> {
    return apiClient.post<MessageReport>('/messages/report', reportData);
  },

  async getMyReports(): Promise<MessageReport[]> {
    return apiClient.get<MessageReport[]>('/messages/my-reports');
  }
};

// Admin message report interfaces
export interface ReviewReportRequest {
  action: 'WARNING' | 'RESOLVED' | 'DISMISSED';
  reviewNotes?: string;
}

export interface ReportStats {
  totalReports: number;
  pendingReports: number;
  underReviewReports: number;
  resolvedReports: number;
  dismissedReports: number;
}

// Admin message report service
export const adminMessageReportService = {
  async getPendingReports(): Promise<MessageReport[]> {
    return apiClient.get<MessageReport[]>('/admin/message-reports/pending');
  },

  async getAllReports(): Promise<MessageReport[]> {
    return apiClient.get<MessageReport[]>('/admin/message-reports');
  },

  async getReportsByStatus(status: ReportStatus): Promise<MessageReport[]> {
    return apiClient.get<MessageReport[]>(`/admin/message-reports/status/${status}`);
  },

  async reviewReport(reportId: number, reviewData: ReviewReportRequest): Promise<MessageReport> {
    return apiClient.put<MessageReport>(`/admin/message-reports/${reportId}/review`, reviewData);
  },

  async getReportStats(): Promise<ReportStats> {
    return apiClient.get<ReportStats>('/admin/message-reports/stats');
  },

  async getPendingCount(): Promise<number> {
    return apiClient.get<number>('/admin/message-reports/pending/count');
  }
};

// Image upload service
export const imageService = {
  async uploadImage(file: File): Promise<{url: string; filename: string}> {
    console.log('🔥 Starting image upload for file:', file.name, 'size:', file.size);
    
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('jwt');
    console.log('🔥 JWT token:', token ? 'exists' : 'missing', 'length:', token?.length || 0);
    
    if (!token) {
      throw new Error('User not authenticated - please log in');
    }

    console.log('🔥 Making request to:', `${API_BASE_URL}/images/upload`);

    const response = await fetch(`${API_BASE_URL}/images/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    console.log('🔥 Upload response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔥 Upload failed:', response.status, errorText);
      throw new Error(`Failed to upload image: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('🔥 Upload successful:', result);
    return result;
  }
};

// User profile interfaces
export interface UserStats {
  itemsPosted: number;
  itemsSold: number;
}

// Report interfaces
export interface Report {
  reportId: number;
  reporter: User;
  reportedUser: User;
  item?: Item;
  reason: string;
  description: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reportDate: string;
  reviewedBy?: User;
  reviewDate?: string;
  adminNotes?: string;
}

export interface ReportRequest {
  reportedUserEmail: string;
  reason: string;
  description: string;
  itemId?: number;
}

export interface StatusUpdate {
  status: string;
  adminNotes: string;
}

// User profile service
export const userService = {
  async getCurrentProfile(): Promise<User> {
    return apiClient.get<User>('/users/profile');
  },

  async getUserById(userId: number): Promise<User> {
    return apiClient.get<User>(`/users/${userId}`);
  },

  async updateProfile(userData: Partial<User>): Promise<User> {
    return apiClient.put<User>('/users/profile', userData);
  },

  async getCurrentStats(): Promise<UserStats> {
    return apiClient.get<UserStats>('/users/profile/stats');
  },

  async checkIfUserIsAdmin(userId?: number): Promise<{ isAdmin: boolean }> {
    const endpoint = userId ? `/admin/check-admin/${userId}` : '/admin/check-admin';
    return apiClient.get<{ isAdmin: boolean }>(endpoint);
  },

  async getTotalCount(): Promise<number> {
    return apiClient.get<number>('/users/count');
  }
};

// Auction service interfaces
export interface CreateAuctionRequest {
  itemId: number;
  startingBid: number;
  minimumIncrement: number;
  endTime: string;
  reservePrice?: number;
  buyNowPrice?: number;
  allowBuyNow?: boolean;
}

export interface CreateItemWithAuctionRequest {
  item: Omit<Item, 'itemId' | 'postDate' | 'updateDate' | 'user'>;
  auctionData?: {
    startingBid: number;
    minimumIncrement: number;
    endTime: string;
    reservePrice?: number;
    buyNowPrice?: number;
    allowBuyNow?: boolean;
  };
}

export interface PlaceBidRequest {
  itemId: number;
  bidAmount: number;
}

// Auction service
export const auctionService = {
  async createAuction(auctionData: CreateAuctionRequest): Promise<Auction> {
    return apiClient.post<Auction>('/auctions/create', auctionData);
  },

  async getAuctionByItemId(itemId: number): Promise<Auction | null> {
    try {
      return await apiClient.get<Auction>(`/auctions/item/${itemId}`);
    } catch (error) {
      return null;
    }
  },

  async getActiveAuctions(): Promise<Auction[]> {
    return apiClient.get<Auction[]>('/auctions/active');
  },

  async getAuctionsEndingSoon(): Promise<Auction[]> {
    return apiClient.get<Auction[]>('/auctions/ending-soon');
  },

  async buyNow(itemId: number): Promise<{message: string}> {
    return apiClient.post<{message: string}>(`/auctions/buy-now/${itemId}`, {});
  },

  async getMyAuctions(): Promise<Auction[]> {
    return apiClient.get<Auction[]>('/auctions/my-auctions');
  },

  async cancelAuction(auctionId: number): Promise<{message: string}> {
    return apiClient.put<{message: string}>(`/auctions/${auctionId}/cancel`, {});
  }
};

// Bid service
export const bidService = {
  async placeBid(bidData: PlaceBidRequest): Promise<Bid> {
    return apiClient.post<Bid>('/bids/place', bidData);
  },

  async getBidsForItem(itemId: number): Promise<Bid[]> {
    return apiClient.get<Bid[]>(`/bids/item/${itemId}`);
  },

  async getMyBids(): Promise<Bid[]> {
    return apiClient.get<Bid[]>('/bids/my-bids');
  },

  async getMyWinningBids(): Promise<Bid[]> {
    return apiClient.get<Bid[]>('/bids/my-winning-bids');
  },

  async canBidOnItem(itemId: number): Promise<{canBid: boolean}> {
    return apiClient.get<{canBid: boolean}>(`/bids/can-bid/${itemId}`);
  },

  async getHighestBid(itemId: number): Promise<Bid | null> {
    try {
      return await apiClient.get<Bid>(`/bids/highest/${itemId}`);
    } catch (error) {
      return null;
    }
  },

  async cancelBid(bidId: number): Promise<{message: string}> {
    return apiClient.put<{message: string}>(`/bids/${bidId}/cancel`, {});
  }
};

// Report service
export const reportService = {
  async submitReport(reportData: ReportRequest): Promise<Report> {
    return apiClient.post<Report>('/reports/submit', reportData);
  },

  async getAllReports(): Promise<Report[]> {
    return apiClient.get<Report[]>('/reports/admin/all');
  },

  async getReportsByStatus(status: string): Promise<Report[]> {
    return apiClient.get<Report[]>(`/reports/admin/status/${status}`);
  },

  async updateReportStatus(reportId: number, statusUpdate: StatusUpdate): Promise<Report> {
    return apiClient.put<Report>(`/reports/admin/${reportId}/status`, statusUpdate);
  },

  async getPendingReportsCount(): Promise<number> {
    return apiClient.get<number>('/reports/admin/pending-count');
  }
};
