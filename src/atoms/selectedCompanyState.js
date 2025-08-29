import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';
const { persistAtom } = recoilPersist();

export const selectedCompanyState = atom({
    key: 'selectedCompanyState',
    default: null,
    effects_UNSTABLE: [persistAtom],
});
