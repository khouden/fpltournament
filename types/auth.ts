export type User = {
  id: string;
  email: string;
};

export type Session = {
  user: User | null;
  expiresAt: number;
};
