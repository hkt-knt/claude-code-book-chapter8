export interface Profile {
  name: string;
  updatedAt: string;
}

export interface ProfileConfig {
  profile: Profile | null;
}
