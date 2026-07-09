export interface User {
  id: string;
  email: string;
  name: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  verified: boolean;
}

export interface Preferences {
  haveCategories: string[];
  wantCategories: string[];
  condition: string;
  radius: string;
  tradeStyle: string;
}

export interface Passport {
  itemsReused: number;
  co2SavedKg: number;
  wasteDivertedKg: number;
  badges: string[];
}

export interface MeResponse {
  user: User;
  preferences: Preferences | null;
  passport: Passport;
}

export interface ItemOwner {
  id: string;
  name: string;
  avatarUrl?: string;
  location?: string;
}

export interface Item {
  id: string;
  title: string;
  category: string;
  condition: string;
  description: string;
  photoUrls: string[];
  wants: string[];
  available: boolean;
  createdAt: string;
  owner: ItemOwner;
}

export interface Trade {
  id: string;
  status: string;
  createdAt: string;
}

export interface MatchOtherUser {
  id: string;
  name: string;
  avatarUrl?: string;
  location?: string;
}

export interface LastMessage {
  content: string;
  senderId: string;
  createdAt: string;
}

export interface Match {
  trade: Trade;
  myItem: Item;
  theirItem: Item;
  otherUser: MatchOtherUser;
  conversationId: string;
  lastMessage: LastMessage | null;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export interface SwipeResult {
  matched: boolean;
  trade?: Trade;
  conversationId?: string;
  myItem?: Item;
  theirItem?: Item;
  otherUser?: MatchOtherUser;
}
