// src/atoms/companiesState.js
import { atom } from 'recoil';

export const companiesState = atom({
    key: 'companiesState',
    default: false
});

export const companyTypesState = atom({
    key: 'companyTypesState',
    default: false
});

export const dataToShowState = atom({
    key: 'dataToShowState',
    default: null
})
