export interface Profile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  website: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  location_name: string | null;
  tags: string[];
  is_creator: boolean;
  creator_request_pending: boolean;
  subscription_price: number;
  last_seen: string;
  is_verified: boolean;
  ghost_mode: boolean;
  is_admin?: boolean;
  dist_meters?: number; // Added from RPC
  identity_tags?: string[];
}

export interface Post {
  id: string;
  user_id: string;
  media_url: string;
  caption: string | null;
  is_locked: boolean;
  is_pinned: boolean;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  media_url?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'tip';
  amount: number;
  created_at: string;
  description: string;
}

export interface FriendRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  created_at: string;
}
