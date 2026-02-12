export interface Profile {
  id: string;
  username: string;
  bio: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  website: string | null;
  location_name: string | null;
  tags: string[];
  is_creator: boolean;
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
