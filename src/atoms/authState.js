import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist();

export const accessTokenState = atom({
  key: 'accessTokenState',
  default: '',
  effects_UNSTABLE: [persistAtom],
});

export const authState = atom({
  key: 'authState',
  default: null,
  effects_UNSTABLE: [persistAtom],
});