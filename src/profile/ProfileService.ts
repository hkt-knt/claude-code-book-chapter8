import { ProfileStore } from './ProfileStore.js';
import { ValidationError } from '../errors/ValidationError.js';
import type { Profile } from '../types/Profile.js';

const MIN_NAME_LENGTH = 1;
const MAX_NAME_LENGTH = 50;

export class ProfileService {
  constructor(private readonly store: ProfileStore) {}

  static createDefault(): ProfileService {
    return new ProfileService(new ProfileStore());
  }

  getProfile(): Profile | null {
    return this.store.load().profile;
  }

  setName(rawName: string): Profile {
    const name = rawName.trim();
    if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
      throw new ValidationError(
        `表示名は${MIN_NAME_LENGTH}〜${MAX_NAME_LENGTH}文字で入力してください`,
        'name',
        rawName
      );
    }

    const profile: Profile = { name, updatedAt: new Date().toISOString() };
    this.store.save({ profile });
    return profile;
  }
}
